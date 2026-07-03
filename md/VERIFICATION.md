# Verification Standard

Fresh evidence is required before any completion claim. Record command, exit code, and meaningful
result counts in `WORKLOG.md`.

## Documentation gate

Run from `D:\CRM`:

```powershell
Get-ChildItem md -File | Sort-Object Name | Select-Object Name,Length
rg -n "TB[D]|TO[D]O|implement late[r]|fill in detail[s]" md
git diff --check -- md
```

Expected:

- Nine named Markdown files exist and are non-empty.
- The placeholder scan has no matches. A historical mistake quotation must be rewritten if it causes
  a false positive.
- `git diff --check` exits successfully with no whitespace errors.

## Focused feature gate

For each red-green cycle:

1. Run the smallest relevant test and observe the expected failure.
2. Record why it failed.
3. Implement the smallest behavior.
4. Run the same test and observe success.
5. Run all related tests and record the count.

Standard command:

```powershell
npx tsx --test tests/<focused-file>.test.ts
```

## Full repository gate

Run each command independently so a failure is attributable:

```powershell
npm run format:check
npm run typecheck
npm run lint
npm test
npm run audit
npm run build
```

Expected: every command exits `0`. Record audit findings even if below the configured failure level.

## Database migration gate

- Back up or use a disposable database.
- Record relevant table row counts before migration.
- Run `npm run db:migrate:deploy` against the disposable target.
- Record row counts and relationship integrity after migration.
- Verify the application can read both migrated and newly created records.
- For destructive follow-up migrations, document recovery and rehearse it before production.

## Browser gate

For changed UI flows:

- Authenticate with the least-privileged applicable role.
- Exercise success, validation failure, empty, loading, and permission-denied paths.
- Verify keyboard navigation and visible focus.
- Check browser console and failed network requests.
- Repeat authorization-sensitive mutations as a member and manager/admin where applicable.

## Security gate

- Inspect changed API selections for password hashes, access tokens, refresh tokens, API keys,
  invitation tokens, and environment values.
- Confirm authorization inside route handlers or domain services, not only navigation or proxy code.
- Confirm automation actions are typed and allowlisted.
- Confirm logs and audit payloads redact secret-like keys.
- Confirm scheduled/retried operations use stable idempotency keys.

## Completion language

- Allowed after evidence: “Milestone 2 passes the focused and full verification gates; evidence is in
  the 2026-07-01 worklog entry.”
- Required when evidence is incomplete: “Implementation exists, but the milestone remains incomplete
  because the build/browser/migration gate has not been run.”
