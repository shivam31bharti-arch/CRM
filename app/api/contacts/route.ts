// Contact collection API with search, filters, sort, pagination, and create.
import { Prisma } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { contactQuerySchema, contactSchema } from "@/lib/validations/contacts";
import { jsonError } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    await requireUser();
    const parsed = contactQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const where: Prisma.ContactWhereInput = {
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.search
        ? {
            OR: [
              { firstName: { contains: parsed.search, mode: "insensitive" } },
              { lastName: { contains: parsed.search, mode: "insensitive" } },
              { email: { contains: parsed.search, mode: "insensitive" } },
              { company: { contains: parsed.search, mode: "insensitive" } }
            ]
          }
        : {})
    };
    const allowedSort = ["firstName", "lastName", "email", "company", "status", "createdAt", "updatedAt"];
    const orderBy = { [allowedSort.includes(parsed.sort) ? parsed.sort : "createdAt"]: parsed.direction };
    const [items, total] = await Promise.all([
      db.contact.findMany({
        where,
        include: { tags: true, assignedTo: { select: { id: true, name: true } }, activities: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy,
        skip: (parsed.page - 1) * parsed.pageSize,
        take: parsed.pageSize
      }),
      db.contact.count({ where })
    ]);
    return Response.json({ items, total, page: parsed.page, pageSize: parsed.pageSize });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    const contact = await db.contact.create({
      data: {
        ...parsed.data,
        email: parsed.data.email || null,
        website: parsed.data.website || null,
        createdById: user.id,
        tags: {
          connectOrCreate: parsed.data.tags.map((tag) => ({
            where: { name: tag.name },
            create: tag
          }))
        },
        activities: { create: { type: "CONTACT_CREATED", description: "Contact created", userId: user.id } }
      },
      include: { tags: true }
    });
    return Response.json(contact, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
