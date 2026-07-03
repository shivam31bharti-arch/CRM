import { Prisma } from "@prisma/client";
import { authErrorResponse, requireUser } from "@/lib/auth";
import {
  buildCompanyUpdateData,
  canArchiveCompany,
  canEditCompany
} from "@/lib/domain/companies/service";
import { db } from "@/lib/db";
import {
  lockRecordForUpdate,
  lockWorkspaceIdentityWrites,
  withSerializableTransaction
} from "@/lib/db-transaction";
import { companySchema } from "@/lib/validations/companies";
import { jsonError } from "@/lib/utils";

const companyDetailInclude = {
  owner: { select: { id: true, name: true, avatarUrl: true } },
  contacts: {
    where: { status: { not: "ARCHIVED" as const } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      jobTitle: true,
      status: true,
      assignedTo: { select: { id: true, name: true, avatarUrl: true } },
      deals: { select: { id: true, title: true, value: true, currency: true, stage: true } }
    },
    orderBy: [{ lastName: "asc" as const }, { firstName: "asc" as const }]
  }
} satisfies Prisma.CompanyInclude;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const company = await db.company.findFirst({
      where: { id, archivedAt: null },
      include: companyDetailInclude
    });
    if (!company) return jsonError("Company not found.", 404);
    return Response.json(company);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const parsed = companySchema.partial().safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);

    const data = buildCompanyUpdateData(parsed.data, user);
    const result = await withSerializableTransaction(async (transaction) => {
      await lockWorkspaceIdentityWrites(transaction);
      await lockRecordForUpdate(transaction, "Company", id);
      const existing = await transaction.company.findFirst({
        where: { id, archivedAt: null },
        select: { id: true, ownerId: true }
      });
      if (!existing) return { kind: "not-found" } as const;
      if (!canEditCompany(user, existing.ownerId)) return { kind: "forbidden" } as const;

      if (typeof data.ownerId === "string") {
        const owner = await transaction.user.findFirst({
          where: { id: data.ownerId, isActive: true },
          select: { id: true }
        });
        if (!owner) return { kind: "invalid-owner" } as const;
      }

      const company = await transaction.company.update({
        where: { id },
        data,
        include: companyDetailInclude
      });
      return { kind: "updated", company } as const;
    });
    if (result.kind === "not-found") return jsonError("Company not found.", 404);
    if (result.kind === "forbidden") return jsonError("Access denied.", 403);
    if (result.kind === "invalid-owner") {
      return jsonError("Company owner must be an active teammate.", 422);
    }
    return Response.json(result.company);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("A company with this name already exists.", 409);
    }
    return authErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!canArchiveCompany(user.role)) return jsonError("Insufficient permissions.", 403);
    const { id } = await params;
    const existing = await db.company.findFirst({
      where: { id, archivedAt: null },
      select: { id: true }
    });
    if (!existing) return jsonError("Company not found.", 404);

    await db.company.update({ where: { id }, data: { archivedAt: new Date() } });
    return Response.json({ ok: true, archived: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
