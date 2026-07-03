import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const MAX_SERIALIZABLE_ATTEMPTS = 3;
const WORKSPACE_IDENTITY_LOCK = 7_294_031_117_003_001n;

export type TransactionClient = Prisma.TransactionClient;

function isRetryableTransactionError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

export async function withSerializableTransaction<T>(
  operation: (transaction: TransactionClient) => Promise<T>
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      return await db.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 20_000
      });
    } catch (error) {
      if (!isRetryableTransactionError(error) || attempt === MAX_SERIALIZABLE_ATTEMPTS) throw error;
    }
  }
  throw new Error("Serializable transaction retry limit exceeded.");
}

// This application currently has one workspace. Serializing identity-sensitive writes keeps
// duplicate checks correct without making email or phone globally unique (explicit duplicates are
// still supported by the contact-create workflow).
export async function lockWorkspaceIdentityWrites(transaction: TransactionClient): Promise<void> {
  await transaction.$queryRaw(Prisma.sql`SELECT pg_advisory_xact_lock(${WORKSPACE_IDENTITY_LOCK})`);
}

export async function lockRecordForUpdate(
  transaction: TransactionClient,
  table: "Company" | "Contact",
  id: string
): Promise<void> {
  if (table === "Company") {
    await transaction.$queryRaw(
      Prisma.sql`SELECT "id" FROM "Company" WHERE "id" = ${id} FOR UPDATE`
    );
    return;
  }
  await transaction.$queryRaw(Prisma.sql`SELECT "id" FROM "Contact" WHERE "id" = ${id} FOR UPDATE`);
}
