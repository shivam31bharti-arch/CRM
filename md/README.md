# CRM Project Memory

This directory is the canonical planning and handoff record for the CRM. It exists so a new human
or model can resume work without reconstructing intent from chat history or guessing from code.

## Reading order

1. [`REQUIREMENTS.md`](./REQUIREMENTS.md) — product goals, users, constraints, and non-goals.
2. [`DECISIONS.md`](./DECISIONS.md) — accepted architecture and product decisions.
3. [`PLAN.md`](./PLAN.md) — implementation sequence and acceptance gates.
4. [`PROGRESS.md`](./PROGRESS.md) — current state, next action, and blockers.
5. [`WORKLOG.md`](./WORKLOG.md) — chronological record of actions and evidence.
6. [`MISTAKES.md`](./MISTAKES.md) — observed mistakes, causes, corrections, and prevention rules.
7. [`VERIFICATION.md`](./VERIFICATION.md) — commands and evidence required before completion claims.
8. [`RESEARCH.md`](./RESEARCH.md) — external repositories, skills, and adoption decisions.

## Memory rules

- Code and database migrations are the authority for implemented behavior.
- `REQUIREMENTS.md` is the authority for agreed product scope.
- `DECISIONS.md` is the authority for accepted choices. New decisions append; they do not silently
  rewrite history.
- `PROGRESS.md` contains only the present state and immediate next actions.
- Every meaningful work session appends a dated entry to `WORKLOG.md`.
- A feature is marked complete only after the applicable checks in `VERIFICATION.md` pass.
- Every failed attempt or incorrect assumption is recorded in `MISTAKES.md`; entries are never
  deleted when corrected.
- Secrets, access tokens, personal data, and raw production payloads must never be written here.
- External agent skills are process guidance only. Repository instructions and user decisions take
  precedence.

## Session start checklist

- Read the eight files above in order.
- Run `git status --short`; preserve unrelated and pre-existing changes.
- Read the relevant source files and migrations before editing.
- Copy the active milestone from `PLAN.md` into the current section of `PROGRESS.md`.
- Use a failing test before production code for behavior changes.

## Session end checklist

- Run the relevant verification commands and record their exact results.
- Update milestone checkboxes only when their acceptance criteria are met.
- Update `PROGRESS.md` with the next smallest action.
- Append work performed, files changed, and verification evidence to `WORKLOG.md`.
- Record mistakes and corrected assumptions in `MISTAKES.md`.
