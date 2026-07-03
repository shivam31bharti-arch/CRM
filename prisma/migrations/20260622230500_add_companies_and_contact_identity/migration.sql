BEGIN;

-- Add first-class companies while retaining Contact.company for a staged compatibility period.
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "phone" TEXT,
    "description" TEXT,
    "ownerId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Contact"
ADD COLUMN "emailNormalized" TEXT,
ADD COLUMN "phoneNormalized" TEXT,
ADD COLUMN "companyId" TEXT;

-- Normalize existing identities for duplicate warnings. Display values remain unchanged.
UPDATE "Contact"
SET "emailNormalized" = NULLIF(
    TRANSLATE(
        REGEXP_REPLACE("email", E'^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g'),
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        'abcdefghijklmnopqrstuvwxyz'
    ),
    ''
);

UPDATE "Contact"
SET "phoneNormalized" = CASE
    WHEN NULLIF(REGEXP_REPLACE("phone", '[^0-9]', '', 'g'), '') IS NULL THEN NULL
    WHEN REGEXP_REPLACE("phone", E'^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g') LIKE '+%'
        THEN '+' || REGEXP_REPLACE("phone", '[^0-9]', '', 'g')
    ELSE REGEXP_REPLACE("phone", '[^0-9]', '', 'g')
END;

-- Company identity uses the same portable algorithm as the application: trim, collapse whitespace,
-- then fold ASCII A-Z. It intentionally avoids extension- or collation-dependent Unicode folding.
-- Create one company per normalized legacy company name. Deterministic IDs make the migration
-- repeatable in recovery environments without requiring an extension for UUID generation.
WITH normalized_companies AS (
    SELECT DISTINCT ON (
        TRANSLATE(
            BTRIM(REGEXP_REPLACE("company", E'[ \t\n\r\f\v]+', ' ', 'g'), ' '),
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            'abcdefghijklmnopqrstuvwxyz'
        )
    )
        BTRIM(REGEXP_REPLACE("company", E'[ \t\n\r\f\v]+', ' ', 'g'), ' ') AS "name",
        TRANSLATE(
            BTRIM(REGEXP_REPLACE("company", E'[ \t\n\r\f\v]+', ' ', 'g'), ' '),
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            'abcdefghijklmnopqrstuvwxyz'
        ) AS "normalizedName"
    FROM "Contact"
    WHERE NULLIF(BTRIM(REGEXP_REPLACE("company", E'[ \t\n\r\f\v]+', ' ', 'g'), ' '), '')
        IS NOT NULL
    ORDER BY
        TRANSLATE(
            BTRIM(REGEXP_REPLACE("company", E'[ \t\n\r\f\v]+', ' ', 'g'), ' '),
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            'abcdefghijklmnopqrstuvwxyz'
        ),
        "createdAt" ASC,
        "id" ASC
)
INSERT INTO "Company" ("id", "name", "normalizedName", "createdAt", "updatedAt")
SELECT
    'legacy_' || MD5("normalizedName"),
    "name",
    "normalizedName",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM normalized_companies;

UPDATE "Contact" AS contact
SET "companyId" = company."id"
FROM "Company" AS company
WHERE company."normalizedName" = TRANSLATE(
    BTRIM(REGEXP_REPLACE(contact."company", E'[ \t\n\r\f\v]+', ' ', 'g'), ' '),
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz'
);

CREATE UNIQUE INDEX "Company_normalizedName_key" ON "Company"("normalizedName");
CREATE INDEX "Company_name_idx" ON "Company"("name");
CREATE INDEX "Company_ownerId_idx" ON "Company"("ownerId");
CREATE INDEX "Company_createdAt_idx" ON "Company"("createdAt");
CREATE INDEX "Contact_emailNormalized_idx" ON "Contact"("emailNormalized");
CREATE INDEX "Contact_phoneNormalized_idx" ON "Contact"("phoneNormalized");
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

ALTER TABLE "Company"
ADD CONSTRAINT "Company_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Contact"
ADD CONSTRAINT "Contact_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
