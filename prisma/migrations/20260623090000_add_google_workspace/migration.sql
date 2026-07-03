BEGIN;

ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'EMAIL_RECEIVED';

CREATE TYPE "GoogleConnectionStatus" AS ENUM ('CONNECTED', 'REAUTH_REQUIRED');
CREATE TYPE "GoogleSyncTrigger" AS ENUM ('MANUAL', 'SCHEDULED', 'INITIAL');
CREATE TYPE "GoogleSyncRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "GoogleEmailDirection" AS ENUM ('INBOUND', 'OUTBOUND');

CREATE TABLE "GoogleConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "scopes" TEXT[],
    "status" "GoogleConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "gmailHistoryId" TEXT,
    "gmailPageToken" TEXT,
    "gmailInitialHistoryId" TEXT,
    "calendarSyncToken" TEXT,
    "calendarPageToken" TEXT,
    "calendarWindowStartAt" TIMESTAMP(3),
    "calendarWindowEndAt" TIMESTAMP(3),
    "syncLockId" TEXT,
    "syncLockedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GoogleConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoogleOAuthAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT,
    "stateHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoogleOAuthAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoogleSyncRun" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "trigger" "GoogleSyncTrigger" NOT NULL,
    "status" "GoogleSyncRunStatus" NOT NULL DEFAULT 'RUNNING',
    "emailsImported" INTEGER NOT NULL DEFAULT 0,
    "eventsImported" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "GoogleSyncRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoogleEmailRecord" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "threadId" TEXT,
    "historyId" TEXT,
    "direction" "GoogleEmailDirection" NOT NULL,
    "subject" TEXT,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "toEmails" TEXT[],
    "ccEmails" TEXT[],
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "contactId" TEXT,
    "activityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GoogleEmailRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoogleCalendarEvent" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "iCalUid" TEXT,
    "title" TEXT,
    "status" TEXT NOT NULL,
    "organizerEmail" TEXT,
    "attendeeEmails" TEXT[],
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "contactId" TEXT,
    "activityId" TEXT,
    "sourceUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GoogleCalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GoogleConnection_userId_key" ON "GoogleConnection"("userId");
CREATE INDEX "GoogleConnection_status_idx" ON "GoogleConnection"("status");
CREATE INDEX "GoogleConnection_lastSyncedAt_idx" ON "GoogleConnection"("lastSyncedAt");
CREATE UNIQUE INDEX "GoogleOAuthAttempt_stateHash_key" ON "GoogleOAuthAttempt"("stateHash");
CREATE INDEX "GoogleOAuthAttempt_userId_expiresAt_idx" ON "GoogleOAuthAttempt"("userId", "expiresAt");
CREATE INDEX "GoogleSyncRun_connectionId_startedAt_idx" ON "GoogleSyncRun"("connectionId", "startedAt");
CREATE INDEX "GoogleSyncRun_status_idx" ON "GoogleSyncRun"("status");
CREATE UNIQUE INDEX "GoogleEmailRecord_activityId_key" ON "GoogleEmailRecord"("activityId");
CREATE UNIQUE INDEX "GoogleEmailRecord_connectionId_externalId_key" ON "GoogleEmailRecord"("connectionId", "externalId");
CREATE INDEX "GoogleEmailRecord_contactId_idx" ON "GoogleEmailRecord"("contactId");
CREATE INDEX "GoogleEmailRecord_receivedAt_idx" ON "GoogleEmailRecord"("receivedAt");
CREATE UNIQUE INDEX "GoogleCalendarEvent_activityId_key" ON "GoogleCalendarEvent"("activityId");
CREATE UNIQUE INDEX "GoogleCalendarEvent_connectionId_calendarId_externalId_key" ON "GoogleCalendarEvent"("connectionId", "calendarId", "externalId");
CREATE INDEX "GoogleCalendarEvent_contactId_idx" ON "GoogleCalendarEvent"("contactId");
CREATE INDEX "GoogleCalendarEvent_startsAt_idx" ON "GoogleCalendarEvent"("startsAt");

ALTER TABLE "GoogleConnection" ADD CONSTRAINT "GoogleConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoogleOAuthAttempt" ADD CONSTRAINT "GoogleOAuthAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoogleOAuthAttempt" ADD CONSTRAINT "GoogleOAuthAttempt_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GoogleConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoogleSyncRun" ADD CONSTRAINT "GoogleSyncRun_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GoogleConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoogleEmailRecord" ADD CONSTRAINT "GoogleEmailRecord_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GoogleConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoogleEmailRecord" ADD CONSTRAINT "GoogleEmailRecord_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GoogleEmailRecord" ADD CONSTRAINT "GoogleEmailRecord_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GoogleCalendarEvent" ADD CONSTRAINT "GoogleCalendarEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GoogleConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoogleCalendarEvent" ADD CONSTRAINT "GoogleCalendarEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GoogleCalendarEvent" ADD CONSTRAINT "GoogleCalendarEvent_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
