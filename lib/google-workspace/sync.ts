import { randomUUID } from "crypto";
import type { GoogleConnection, GoogleSyncTrigger } from "@prisma/client";
import { db } from "@/lib/db";
import { GoogleApiError, getGoogleAccessToken, googleApiJson } from "@/lib/google-workspace/client";
import {
  normalizeGoogleEmail,
  parseGoogleAddressHeader,
  safeGoogleSyncError,
  singleMatchedContactId
} from "@/lib/google-workspace/core";

const MAX_INITIAL_GMAIL_MESSAGES = 500;
const MAX_CALENDAR_PAGES = 4;
const GOOGLE_SYNC_LOCK_MINUTES = 20;

type GmailMessage = {
  id: string;
  threadId?: string;
  historyId?: string;
  internalDate?: string;
  payload?: { headers?: Array<{ name?: string; value?: string }> };
};

type CalendarEvent = {
  id: string;
  iCalUID?: string;
  summary?: string;
  status?: string;
  organizer?: { email?: string };
  attendees?: Array<{ email?: string }>;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  updated?: string;
};

export class GoogleSyncBusyError extends Error {}

function header(message: GmailMessage, name: string): string | undefined {
  return message.payload?.headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())
    ?.value;
}

function validDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function findContactId(emails: string[]): Promise<string | null> {
  const candidates = [...new Set(emails.map(normalizeGoogleEmail).filter(Boolean))];
  if (!candidates.length) return null;
  const matches = await db.contact.findMany({
    where: { emailNormalized: { in: candidates } },
    select: { id: true },
    take: 2
  });
  return singleMatchedContactId(matches);
}

async function persistGmailMessage(connection: GoogleConnection, message: GmailMessage) {
  const from = parseGoogleAddressHeader(header(message, "From"))[0] ?? null;
  const to = parseGoogleAddressHeader(header(message, "To"));
  const cc = parseGoogleAddressHeader(header(message, "Cc"));
  const accountEmail = normalizeGoogleEmail(connection.email);
  const direction = from?.email === accountEmail ? "OUTBOUND" : "INBOUND";
  const counterpartEmails =
    direction === "INBOUND"
      ? [from?.email].filter((value): value is string => Boolean(value))
      : [...to, ...cc].map((address) => address.email).filter((email) => email !== accountEmail);
  const contactId = await findContactId(counterpartEmails);
  const receivedAt = message.internalDate
    ? new Date(Number(message.internalDate))
    : (validDate(header(message, "Date")) ?? new Date());
  const subject = header(message, "Subject")?.trim() || null;

  return db.$transaction(async (transaction) => {
    const existing = await transaction.googleEmailRecord.findUnique({
      where: {
        connectionId_externalId: { connectionId: connection.id, externalId: message.id }
      },
      select: { id: true }
    });
    const data = {
      threadId: message.threadId ?? null,
      historyId: message.historyId ?? null,
      direction,
      subject,
      fromEmail: from?.email ?? null,
      fromName: from?.name ?? null,
      toEmails: to.map((address) => address.email),
      ccEmails: cc.map((address) => address.email),
      receivedAt,
      contactId
    } as const;
    if (existing) {
      await transaction.googleEmailRecord.update({ where: { id: existing.id }, data });
      return false;
    }
    const activity = contactId
      ? await transaction.activity.create({
          data: {
            type: direction === "INBOUND" ? "EMAIL_RECEIVED" : "EMAIL_SENT",
            description: `${direction === "INBOUND" ? "Received" : "Sent"} email${subject ? `: ${subject.slice(0, 180)}` : ""}`,
            metadata: { provider: "GOOGLE", externalId: message.id, direction },
            userId: connection.userId,
            contactId
          },
          select: { id: true }
        })
      : null;
    await transaction.googleEmailRecord.create({
      data: {
        connectionId: connection.id,
        externalId: message.id,
        ...data,
        activityId: activity?.id ?? null
      }
    });
    return true;
  });
}

async function fetchGmailMessage(accessToken: string, id: string): Promise<GmailMessage> {
  const url = new URL(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}`
  );
  url.searchParams.set("format", "metadata");
  for (const name of ["From", "To", "Cc", "Subject", "Date", "Message-ID"]) {
    url.searchParams.append("metadataHeaders", name);
  }
  url.searchParams.set("fields", "id,threadId,historyId,internalDate,payload(headers(name,value))");
  return googleApiJson<GmailMessage>(accessToken, url);
}

async function gmailMessageIds(accessToken: string, connection: GoogleConnection) {
  if (connection.gmailHistoryId) {
    const ids = new Set<string>();
    let pageToken: string | undefined = connection.gmailPageToken ?? undefined;
    let latestHistoryId = connection.gmailHistoryId;
    do {
      const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/history");
      url.searchParams.set("startHistoryId", connection.gmailHistoryId);
      url.searchParams.set("historyTypes", "messageAdded");
      url.searchParams.set("maxResults", "100");
      url.searchParams.set(
        "fields",
        "history(id,messagesAdded(message(id))),historyId,nextPageToken"
      );
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const result = await googleApiJson<{
        history?: Array<{ messagesAdded?: Array<{ message?: { id?: string } }> }>;
        historyId?: string;
        nextPageToken?: string;
      }>(accessToken, url);
      for (const item of result.history ?? []) {
        for (const added of item.messagesAdded ?? [])
          if (added.message?.id) ids.add(added.message.id);
      }
      latestHistoryId = result.historyId ?? latestHistoryId;
      pageToken = result.nextPageToken;
    } while (pageToken && ids.size < MAX_INITIAL_GMAIL_MESSAGES);
    return {
      ids: [...ids].slice(0, MAX_INITIAL_GMAIL_MESSAGES),
      historyId: pageToken ? connection.gmailHistoryId : latestHistoryId,
      pageToken: pageToken ?? null
    };
  }

  const ids: string[] = [];
  let pageToken: string | undefined = connection.gmailPageToken ?? undefined;
  let initialHistoryId = connection.gmailInitialHistoryId;
  if (!initialHistoryId) {
    const profile = await googleApiJson<{ historyId?: string }>(
      accessToken,
      "https://gmail.googleapis.com/gmail/v1/users/me/profile"
    );
    initialHistoryId = profile.historyId ?? null;
    await db.googleConnection.update({
      where: { id: connection.id },
      data: { gmailInitialHistoryId: initialHistoryId }
    });
  }
  do {
    const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    url.searchParams.set(
      "maxResults",
      String(Math.min(100, MAX_INITIAL_GMAIL_MESSAGES - ids.length))
    );
    url.searchParams.set("fields", "messages(id),nextPageToken");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const result = await googleApiJson<{
      messages?: Array<{ id?: string }>;
      nextPageToken?: string;
    }>(accessToken, url);
    ids.push(...(result.messages ?? []).flatMap((message) => (message.id ? [message.id] : [])));
    pageToken = result.nextPageToken;
  } while (pageToken && ids.length < MAX_INITIAL_GMAIL_MESSAGES);
  return {
    ids: ids.slice(0, MAX_INITIAL_GMAIL_MESSAGES),
    historyId: pageToken ? null : initialHistoryId,
    pageToken: pageToken ?? null
  };
}

async function syncGmail(connection: GoogleConnection, accessToken: string) {
  let batch: Awaited<ReturnType<typeof gmailMessageIds>>;
  try {
    batch = await gmailMessageIds(accessToken, connection);
  } catch (error) {
    if (!(error instanceof GoogleApiError) || error.status !== 404 || !connection.gmailHistoryId) {
      throw error;
    }
    await db.googleConnection.update({
      where: { id: connection.id },
      data: { gmailHistoryId: null, gmailPageToken: null, gmailInitialHistoryId: null }
    });
    batch = await gmailMessageIds(accessToken, {
      ...connection,
      gmailHistoryId: null,
      gmailPageToken: null,
      gmailInitialHistoryId: null
    });
  }
  let imported = 0;
  for (let index = 0; index < batch.ids.length; index += 10) {
    const messages = await Promise.all(
      batch.ids.slice(index, index + 10).map((id) => fetchGmailMessage(accessToken, id))
    );
    const results = await Promise.all(
      messages.map((message) => persistGmailMessage(connection, message))
    );
    imported += results.filter(Boolean).length;
  }
  await db.googleConnection.update({
    where: { id: connection.id },
    data: {
      gmailHistoryId: batch.historyId ?? connection.gmailHistoryId,
      gmailPageToken: batch.pageToken,
      gmailInitialHistoryId: batch.pageToken ? undefined : null
    }
  });
  return imported;
}

function calendarDate(value?: { dateTime?: string; date?: string }): Date | null {
  return validDate(value?.dateTime ?? (value?.date ? `${value.date}T00:00:00.000Z` : null));
}

async function persistCalendarEvent(connection: GoogleConnection, event: CalendarEvent) {
  const accountEmail = normalizeGoogleEmail(connection.email);
  const organizerEmail = event.organizer?.email
    ? normalizeGoogleEmail(event.organizer.email)
    : null;
  const attendeeEmails = (event.attendees ?? []).flatMap((attendee) =>
    attendee.email ? [normalizeGoogleEmail(attendee.email)] : []
  );
  const contactId = await findContactId(
    [organizerEmail, ...attendeeEmails].filter(
      (email): email is string => Boolean(email) && email !== accountEmail
    )
  );
  return db.$transaction(async (transaction) => {
    const existing = await transaction.googleCalendarEvent.findUnique({
      where: {
        connectionId_calendarId_externalId: {
          connectionId: connection.id,
          calendarId: "primary",
          externalId: event.id
        }
      },
      select: { id: true }
    });
    const data = {
      iCalUid: event.iCalUID ?? null,
      title: event.summary?.trim() || null,
      status: event.status ?? "confirmed",
      organizerEmail,
      attendeeEmails,
      startsAt: calendarDate(event.start),
      endsAt: calendarDate(event.end),
      sourceUpdatedAt: validDate(event.updated),
      contactId
    } as const;
    if (existing) {
      await transaction.googleCalendarEvent.update({ where: { id: existing.id }, data });
      return false;
    }
    const activity =
      data.status === "cancelled" || !contactId
        ? null
        : await transaction.activity.create({
            data: {
              type: "MEETING_SCHEDULED",
              description: `Google Calendar event${data.title ? `: ${data.title.slice(0, 180)}` : ""}`,
              metadata: { provider: "GOOGLE", externalId: event.id, calendarId: "primary" },
              userId: connection.userId,
              contactId
            },
            select: { id: true }
          });
    await transaction.googleCalendarEvent.create({
      data: {
        connectionId: connection.id,
        calendarId: "primary",
        externalId: event.id,
        ...data,
        activityId: activity?.id ?? null
      }
    });
    return true;
  });
}

async function syncCalendar(connection: GoogleConnection, accessToken: string) {
  let syncToken = connection.calendarSyncToken;
  let imported = 0;
  let pageToken: string | undefined = connection.calendarPageToken ?? undefined;
  let page = 0;
  let retriedFullSync = false;
  let windowStart = connection.calendarWindowStartAt ?? new Date(Date.now() - 90 * 86_400_000);
  let windowEnd = connection.calendarWindowEndAt ?? new Date(Date.now() + 365 * 86_400_000);
  for (;;) {
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    url.searchParams.set("maxResults", "250");
    url.searchParams.set("showDeleted", "true");
    url.searchParams.set(
      "fields",
      "items(id,iCalUID,summary,status,organizer(email),attendees(email),start,end,updated),nextPageToken,nextSyncToken"
    );
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    if (syncToken) {
      url.searchParams.set("syncToken", syncToken);
    } else {
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("timeMin", windowStart.toISOString());
      url.searchParams.set("timeMax", windowEnd.toISOString());
    }
    let result: { items?: CalendarEvent[]; nextPageToken?: string; nextSyncToken?: string };
    try {
      result = await googleApiJson(accessToken, url);
    } catch (error) {
      if (
        error instanceof GoogleApiError &&
        error.status === 410 &&
        syncToken &&
        !retriedFullSync
      ) {
        syncToken = null;
        pageToken = undefined;
        page = 0;
        retriedFullSync = true;
        windowStart = new Date(Date.now() - 90 * 86_400_000);
        windowEnd = new Date(Date.now() + 365 * 86_400_000);
        await db.googleConnection.update({
          where: { id: connection.id },
          data: {
            calendarSyncToken: null,
            calendarPageToken: null,
            calendarWindowStartAt: windowStart,
            calendarWindowEndAt: windowEnd
          }
        });
        continue;
      }
      throw error;
    }
    for (const event of result.items ?? [])
      if (await persistCalendarEvent(connection, event)) imported += 1;
    pageToken = result.nextPageToken;
    if (!pageToken) {
      if (result.nextSyncToken) {
        await db.googleConnection.update({
          where: { id: connection.id },
          data: {
            calendarSyncToken: result.nextSyncToken,
            calendarPageToken: null,
            calendarWindowStartAt: null,
            calendarWindowEndAt: null
          }
        });
      }
      break;
    }
    page += 1;
    if (page >= MAX_CALENDAR_PAGES) {
      await db.googleConnection.update({
        where: { id: connection.id },
        data: {
          calendarPageToken: pageToken,
          calendarWindowStartAt: syncToken ? null : windowStart,
          calendarWindowEndAt: syncToken ? null : windowEnd
        }
      });
      break;
    }
  }
  return imported;
}

export async function syncGoogleConnection(connectionId: string, trigger: GoogleSyncTrigger) {
  const lockId = randomUUID();
  const staleBefore = new Date(Date.now() - GOOGLE_SYNC_LOCK_MINUTES * 60_000);
  const claim = await db.googleConnection.updateMany({
    where: {
      id: connectionId,
      status: "CONNECTED",
      OR: [{ syncLockId: null }, { syncLockedAt: { lt: staleBefore } }]
    },
    data: { syncLockId: lockId, syncLockedAt: new Date() }
  });
  if (!claim.count) throw new GoogleSyncBusyError("A Google Workspace sync is already running.");
  const run = await db.googleSyncRun.create({ data: { connectionId, trigger } });

  try {
    const connection = await db.googleConnection.findUniqueOrThrow({ where: { id: connectionId } });
    const accessToken = await getGoogleAccessToken(connection);
    const emailsImported = await syncGmail(connection, accessToken);
    const eventsImported = await syncCalendar(connection, accessToken);
    const finishedAt = new Date();
    await db.$transaction([
      db.googleSyncRun.update({
        where: { id: run.id },
        data: { status: "SUCCEEDED", emailsImported, eventsImported, finishedAt }
      }),
      db.googleConnection.update({
        where: { id: connectionId },
        data: { lastSyncedAt: finishedAt, lastError: null }
      })
    ]);
    return { emailsImported, eventsImported, finishedAt };
  } catch (error) {
    const message = safeGoogleSyncError(error);
    await db
      .$transaction([
        db.googleSyncRun.update({
          where: { id: run.id },
          data: { status: "FAILED", error: message.slice(0, 1000), finishedAt: new Date() }
        }),
        db.googleConnection.update({
          where: { id: connectionId },
          data: { lastError: message.slice(0, 1000) }
        })
      ])
      .catch(() => undefined);
    throw error;
  } finally {
    await db.googleConnection
      .updateMany({
        where: { id: connectionId, syncLockId: lockId },
        data: { syncLockId: null, syncLockedAt: null }
      })
      .catch(() => undefined);
  }
}

export async function runGoogleWorkspaceSyncs() {
  const connections = await db.googleConnection.findMany({
    where: { status: "CONNECTED" },
    select: { id: true, lastSyncedAt: true },
    orderBy: { lastSyncedAt: { sort: "asc", nulls: "first" } },
    take: 25
  });
  const result = { processed: 0, succeeded: 0, failed: 0, skipped: 0 };
  for (const connection of connections) {
    result.processed += 1;
    try {
      await syncGoogleConnection(connection.id, connection.lastSyncedAt ? "SCHEDULED" : "INITIAL");
      result.succeeded += 1;
    } catch (error) {
      if (error instanceof GoogleSyncBusyError) result.skipped += 1;
      else {
        result.failed += 1;
        console.error(`[Google Workspace] Sync failed for ${connection.id}:`, error);
      }
    }
  }
  return result;
}
