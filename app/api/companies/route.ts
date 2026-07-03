import { Prisma } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import { buildCompanyData, buildCompanyUpdateData } from "@/lib/domain/companies/service";
import { db } from "@/lib/db";
import { lockWorkspaceIdentityWrites, withSerializableTransaction } from "@/lib/db-transaction";
import { companyQuerySchema, companySchema } from "@/lib/validations/companies";
import { jsonError } from "@/lib/utils";

const companyInclude = {
  owner: { select: { id: true, name: true, avatarUrl: true } },
  _count: { select: { contacts: true } }
} satisfies Prisma.CompanyInclude;

export async function GET(request: Request) {
  try {
    await requireUser();
    const parsed = companyQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid query.", 422);

    const where: Prisma.CompanyWhereInput = {
      archivedAt: null,
      ...(parsed.data.search
        ? {
            OR: [
              { name: { contains: parsed.data.search, mode: "insensitive" as const } },
              { industry: { contains: parsed.data.search, mode: "insensitive" as const } },
              { website: { contains: parsed.data.search, mode: "insensitive" as const } }
            ]
          }
        : {})
    };
    const [items, total] = await Promise.all([
      db.company.findMany({
        where,
        include: companyInclude,
        orderBy: { [parsed.data.sort]: parsed.data.direction },
        skip: (parsed.data.page - 1) * parsed.data.pageSize,
        take: parsed.data.pageSize
      }),
      db.company.count({ where })
    ]);
    return Response.json({
      items,
      total,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = companySchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);

    const data = buildCompanyData(parsed.data, user);
    const result = await withSerializableTransaction(async (transaction) => {
      await lockWorkspaceIdentityWrites(transaction);
      const existing = await transaction.company.findUnique({
        where: { normalizedName: data.normalizedName },
        select: { id: true, name: true, archivedAt: true }
      });
      if (existing?.archivedAt) {
        const restorationData = buildCompanyUpdateData(parsed.data, user);
        if (typeof restorationData.ownerId === "string") {
          const owner = await transaction.user.findFirst({
            where: { id: restorationData.ownerId, isActive: true },
            select: { id: true }
          });
          if (!owner) return { kind: "invalid-owner" } as const;
        }
        const company = await transaction.company.update({
          where: { id: existing.id },
          data: { ...restorationData, archivedAt: null },
          include: companyInclude
        });
        return { kind: "restored", company } as const;
      }
      if (existing) return { kind: "duplicate", company: existing } as const;

      const owner = await transaction.user.findFirst({
        where: { id: data.ownerId, isActive: true },
        select: { id: true }
      });
      if (!owner) return { kind: "invalid-owner" } as const;

      const company = await transaction.company.create({ data, include: companyInclude });
      return { kind: "created", company } as const;
    });

    if (result.kind === "invalid-owner") {
      return jsonError("Company owner must be an active teammate.", 422);
    }
    if (result.kind === "duplicate") {
      return Response.json(
        {
          error: "A company with this name already exists.",
          code: "DUPLICATE_COMPANY",
          company: result.company
        },
        { status: 409 }
      );
    }
    return Response.json(result.company, { status: result.kind === "created" ? 201 : 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("A company with this name already exists.", 409);
    }
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
