// Contact detail API for read, update, and delete.
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
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
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        deals: true,
        notes: { include: { author: { select: { name: true, avatarUrl: true } } }, orderBy: { createdAt: "desc" } },
        activities: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } }
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

    // [C-1] MEMBER-level users may only update contacts they created or are assigned to.
    //        ADMIN and MANAGER can update any contact.
    if (user.role === "MEMBER") {
      const owned = await db.contact.findFirst({
        where: { id, OR: [{ createdById: user.id }, { assignedToId: user.id }] }
      });
      if (!owned) return jsonError("Contact not found or access denied.", 403);
    }

    const { tags, ...data } = parsed.data;
    const contact = await db.contact.update({
      where: { id },
      data: {
        ...data,
        activities: { create: { type: "CONTACT_UPDATED", description: "Contact updated", userId: user.id } },
        ...(tags
          ? {
              tags: {
                set: [],
                connectOrCreate: tags.map((tag) => ({ where: { name: tag.name }, create: tag }))
              }
            }
          : {})
      },
      include: { tags: true }
    });
    return Response.json(contact);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUser(["ADMIN", "MANAGER"]);
    await db.contact.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
