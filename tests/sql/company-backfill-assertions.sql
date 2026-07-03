DO $$
DECLARE
  first_company_id TEXT;
  second_company_id TEXT;
BEGIN
  IF (SELECT COUNT(*) FROM "Contact") <> 5 THEN
    RAISE EXCEPTION 'Contact count changed during migration';
  END IF;

  IF (SELECT "company" FROM "Contact" WHERE "id" = 'contact-1') <> 'Acme Labs' THEN
    RAISE EXCEPTION 'Legacy company display value changed';
  END IF;

  IF (SELECT COUNT(*) FROM "Company") <> 2 THEN
    RAISE EXCEPTION 'Expected exactly two normalized companies';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "Company" WHERE "normalizedName" = 'acme labs') THEN
    RAISE EXCEPTION 'ASCII company normalization failed';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "Company" WHERE "normalizedName" = 'ＡＣＭＥ') THEN
    RAISE EXCEPTION 'Portable non-ASCII company normalization failed';
  END IF;

  SELECT "companyId" INTO first_company_id FROM "Contact" WHERE "id" = 'contact-1';
  SELECT "companyId" INTO second_company_id FROM "Contact" WHERE "id" = 'contact-2';
  IF first_company_id IS NULL OR first_company_id <> second_company_id THEN
    RAISE EXCEPTION 'Equivalent ASCII company names were not linked together';
  END IF;

  IF (SELECT "companyId" FROM "Contact" WHERE "id" = 'contact-3') = first_company_id THEN
    RAISE EXCEPTION 'Distinct non-ASCII company was merged incorrectly';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "Contact" WHERE "id" IN ('contact-4', 'contact-5') AND "companyId" IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Blank or null company was linked';
  END IF;

  IF (SELECT "emailNormalized" FROM "Contact" WHERE "id" = 'contact-1') <>
     'founder@example.com' THEN
    RAISE EXCEPTION 'Email identity backfill failed';
  END IF;

  IF (SELECT "phoneNormalized" FROM "Contact" WHERE "id" = 'contact-1') <>
     '+919876543210' THEN
    RAISE EXCEPTION 'Phone identity backfill failed';
  END IF;
END
$$;

SELECT
  (SELECT COUNT(*) FROM "Contact") AS contacts,
  (SELECT COUNT(*) FROM "Company") AS companies,
  (SELECT COUNT(*) FROM "Contact" WHERE "companyId" IS NOT NULL) AS linked_contacts;

