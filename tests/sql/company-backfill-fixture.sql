INSERT INTO "User" (
  "id", "email", "name", "role", "passwordHash", "createdAt", "updatedAt", "isActive"
) VALUES (
  'verify-user', 'verify@example.com', 'Verification User', 'ADMIN', 'not-a-real-password-hash',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true
);

INSERT INTO "Contact" (
  "id", "firstName", "lastName", "email", "phone", "company", "status", "createdById",
  "createdAt", "updatedAt"
) VALUES
  (
    'contact-1', 'Ada', 'One', E'\tFounder@Example.COM\r\n', E'\t+91 (987) 654-3210\r\n',
    'Acme Labs', 'LEAD', 'verify-user', '2026-01-01', CURRENT_TIMESTAMP
  ),
  (
    'contact-2', 'Grace', 'Two', NULL, NULL, E'\tACME \n Labs\r', 'PROSPECT', 'verify-user',
    '2026-01-02', CURRENT_TIMESTAMP
  ),
  (
    'contact-3', 'Linus', 'Three', 'linus@example.com', '555.0100', 'ＡＣＭＥ', 'CUSTOMER',
    'verify-user', '2026-01-03', CURRENT_TIMESTAMP
  ),
  (
    'contact-4', 'Blank', 'Company', NULL, NULL, '   ', 'LEAD', 'verify-user', '2026-01-04',
    CURRENT_TIMESTAMP
  ),
  (
    'contact-5', 'Null', 'Company', NULL, NULL, NULL, 'LEAD', 'verify-user', '2026-01-05',
    CURRENT_TIMESTAMP
  );
