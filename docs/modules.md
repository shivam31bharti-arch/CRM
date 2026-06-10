# Module Acceptance Criteria

## M1 Authentication and Authorization

- [x] User can register with email + password.
- [x] Passwords are hashed with bcrypt-compatible hashing and minimum length validation.
- [x] User can log in and receive a session cookie through NextAuth credentials.
- [x] Invalid credentials show a specific error message.
- [x] Unauthenticated users are redirected to /login.
- [x] ADMIN, MANAGER, MEMBER roles exist and are enforced on protected API helpers.
- [x] Session persists across page refreshes.
- [x] Logout clears session and redirects to /login.
- [x] Login page is mobile responsive and polished.
- [x] Password hashes are never returned by serializers.
- [x] CSRF protection is delegated to NextAuth form/session handling.

## M2 Contact Management

- [x] Contact list, detail, CRUD API, filters, pagination, import/export, tags, custom fields, loading, empty, and error states.

## M3 Deal Pipeline

- [x] Six-stage Kanban, card details, drag-and-drop stage route, won/lost timestamps, activity logging, and analytics panel.

## M4 Social Media Post Scheduler

- [x] Calendar/list views, composer, platform limits, recurring rules, drafts, mock publishing, OAuth stubs, and media URL storage.

## M5 Analytics Dashboard

- [x] Overview cards, date range filters, charts, sortable table, pagination, and CSV export.

## M6 Unified Inbox

- [x] Unified list, filters, read/reply/link actions, unread count, and real-time-ready event helper.

## M7 Campaign Manager

- [x] Campaign CRUD, detail, linked contacts/posts, status flow, and aggregate analytics.

## M8 Team and Collaboration

- [x] Member management, invite, roles, activity feed, assignments, and mention notification helper.

## M9 Settings and Integrations

- [x] Profile, integrations, webhooks, API key route stubs, and billing placeholder.

## M10 Notifications and Real-Time

- [x] Bell, dropdown, mark-read APIs, helper, Pusher-compatible adapter, and related notification triggers.
