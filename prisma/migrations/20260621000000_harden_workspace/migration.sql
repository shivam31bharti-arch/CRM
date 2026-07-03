BEGIN;

-- Workspace access can be revoked without deleting historical CRM activity.
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Collapse accidental duplicate memberships before enforcing one membership per user.
WITH ranked_memberships AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "joinedAt", "id") AS position
  FROM "TeamMember"
)
DELETE FROM "TeamMember"
WHERE "id" IN (
  SELECT "id" FROM ranked_memberships WHERE position > 1
);

CREATE UNIQUE INDEX "TeamMember_userId_key" ON "TeamMember"("userId");

-- Claim scheduled posts before external publishing to prevent duplicate delivery.
ALTER TYPE "PostStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TABLE "Post" ADD COLUMN "processingStartedAt" TIMESTAMP(3);

COMMIT;
