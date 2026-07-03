// Contact detail API for read, update, and delete.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  lockRecordForUpdate,
  lockWorkspaceIdentityWrites,
  withSerializableTransaction
} from "@/lib/db-transaction";
import { buildContactIdentityUpdateData } from "@/lib/domain/contacts/identity";
import { contactSchema } from "@/lib/validations/contacts";
import { jsonError } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUser();
    const contact = await db.contact.findUnique({
      where: { id },
      include: {
        tags: true,
        companyRecord: true,
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        deals: true,
        notes: {
          include: { author: { select: { name: true, avatarUrl: true } } },
          orderBy: { createdAt: "desc" }
        },
        activities: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!contact) return jsonError("Contact not found.", 404);
    return Response.json(contact);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const parsed = contactSchema.partial().safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);

    const { tags, email, phone, ...data } = parsed.data;
    const identityData = buildContactIdentityUpdateData({
      ...(Object.prototype.hasOwnProperty.call(parsed.data, "email") ? { email } : {}),
      ...(Object.prototype.hasOwnProperty.call(parsed.data, "phone") ? { phone } : {})
    });
    const result = await withSerializableTransaction(async (transaction) => {
      await lockWorkspaceIdentityWrites(transaction);
      await lockRecordForUpdate(transaction, "Contact", id);
      const existing = await transaction.contact.findUnique({
        where: { id },
        select: { id: true, createdById: true, assignedToId: true }
      });
      if (!existing) return { kind: "not-found" } as const;
      if (
        user.role === "MEMBER" &&
        existing.createdById !== user.id &&
        existing.assignedToId !== user.id
      ) {
        return { kind: "forbidden" } as const;
      }

      if (parsed.data.companyId) {
        const company = await transaction.company.findFirst({
          where: { id: parsed.data.companyId, archivedAt: null },
          select: { id: true }
        });
        if (!company) return { kind: "company-not-found" } as const;
      }

      const contact = await transaction.contact.update({
        where: { id },
        data: {
          ...data,
          ...identityData,
          ...(data.company !== undefined ? { company: data.company || null } : {}),
          ...(data.website !== undefined ? { website: data.website || null } : {}),
          activities: {
            create: { type: "CONTACT_UPDATED", description: "Contact updated", userId: user.id }
          },
          ...(tags
            ? {
                tags: {
                  set: [],
                  connectOrCreate: tags.map((tag) => ({ where: { name: tag.name }, create: tag }))
                }
              }
            : {})
        },
        include: { tags: true, companyRecord: { select: { id: true, name: true } } }
      });
      return { kind: "updated", contact } as const;
    });
    if (result.kind === "not-found") return jsonError("Contact not found.", 404);
    if (result.kind === "forbidden") return jsonError("Contact not found or access denied.", 403);
    if (result.kind === "company-not-found") return jsonError("Company not found.", 422);
    return Response.json(result.contact);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUser(["ADMIN", "MANAGER"]);
    await db.contact.update({ where: { id }, data: { status: "ARCHIVED", assignedToId: null } });
    return Response.json({ ok: true, archived: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
