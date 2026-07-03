// Contact collection API with search, filters, sort, pagination, and create.
import { Prisma } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { lockWorkspaceIdentityWrites, withSerializableTransaction } from "@/lib/db-transaction";
import { buildContactIdentityData, findDuplicateCandidates } from "@/lib/domain/contacts/identity";
import { contactCreateSchema, contactQuerySchema } from "@/lib/validations/contacts";
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
              { company: { contains: parsed.search, mode: "insensitive" } },
              {
                companyRecord: {
                  is: { name: { contains: parsed.search, mode: "insensitive" } }
                }
              }
            ]
          }
        : {})
    };
    const allowedSort = [
      "firstName",
      "lastName",
      "email",
      "company",
      "status",
      "createdAt",
      "updatedAt"
    ];
    const orderBy = {
      [allowedSort.includes(parsed.sort) ? parsed.sort : "createdAt"]: parsed.direction
    };
    const [items, total] = await Promise.all([
      db.contact.findMany({
        where,
        include: {
          tags: true,
          companyRecord: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          activities: { orderBy: { createdAt: "desc" }, take: 1 }
        },
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
    const parsed = contactCreateSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);
    const { allowDuplicate, tags, email, phone, ...input } = parsed.data;
    const identity = buildContactIdentityData({ email, phone });

    const result = await withSerializableTransaction(async (transaction) => {
      await lockWorkspaceIdentityWrites(transaction);

      if (input.companyId) {
        const company = await transaction.company.findFirst({
          where: { id: input.companyId, archivedAt: null },
          select: { id: true }
        });
        if (!company) return { kind: "company-not-found" } as const;
      }

      const identityFilters: Prisma.ContactWhereInput[] = [];
      if (identity.emailNormalized) {
        identityFilters.push({ emailNormalized: identity.emailNormalized });
      }
      if (identity.phoneNormalized) {
        identityFilters.push({ phoneNormalized: identity.phoneNormalized });
      }
      const potentialDuplicates = identityFilters.length
        ? await transaction.contact.findMany({
            where: { status: { not: "ARCHIVED" }, OR: identityFilters },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              emailNormalized: true,
              phoneNormalized: true,
              companyRecord: { select: { id: true, name: true } }
            },
            take: 10
          })
        : [];
      const duplicateMatches = findDuplicateCandidates({ email, phone }, potentialDuplicates);
      if (duplicateMatches.length && !allowDuplicate) {
        const reasonsById = new Map(duplicateMatches.map((match) => [match.id, match.reasons]));
        return {
          kind: "duplicate",
          duplicates: potentialDuplicates
            .filter((contact) => reasonsById.has(contact.id))
            .map((contact) => ({ ...contact, reasons: reasonsById.get(contact.id) }))
        } as const;
      }

      const contact = await transaction.contact.create({
        data: {
          ...input,
          ...identity,
          company: input.company || null,
          website: input.website || null,
          createdById: user.id,
          tags: {
            connectOrCreate: tags.map((tag) => ({
              where: { name: tag.name },
              create: tag
            }))
          },
          activities: {
            create: { type: "CONTACT_CREATED", description: "Contact created", userId: user.id }
          }
        },
        include: { tags: true, companyRecord: { select: { id: true, name: true } } }
      });
      return { kind: "created", contact } as const;
    });

    if (result.kind === "company-not-found") return jsonError("Company not found.", 422);
    if (result.kind === "duplicate") {
      return Response.json(
        {
          error: "A contact with matching identity data already exists.",
          code: "DUPLICATE_CONTACT",
          duplicates: result.duplicates
        },
        { status: 409 }
      );
    }
    return Response.json(result.contact, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
