# API Reference

All endpoints require authentication except registration and NextAuth handlers.

- `POST /api/auth/register`: create user.
- `GET|POST /api/auth/[...nextauth]`: session login/logout handlers.
- `GET|POST /api/contacts`: list or create contacts.
- `GET|PATCH|DELETE /api/contacts/[id]`: read, update, delete contact.
- `POST /api/contacts/import`: CSV import.
- `GET /api/contacts/export`: CSV export.
- `GET|POST /api/deals`: list or create deals.
- `GET|PATCH|DELETE /api/deals/[id]`: read, update, delete deal.
- `PATCH /api/deals/[id]/stage`: change pipeline stage.
- `GET|POST /api/posts`: list or create posts.
- `GET|PATCH|DELETE /api/posts/[id]`: read, update, cancel, or delete post.
- `POST /api/posts/publish`: mock immediate publish.
- `GET|POST /api/social-accounts`: list or create mock social accounts.
- `GET /api/social-accounts/connect/[platform]`: mock OAuth connect.
- `GET /api/analytics/overview`: KPI aggregates.
- `GET /api/analytics/platform/[platform]`: platform trend rows.
- `GET /api/analytics/posts`: post performance or CSV export.
- `GET|PATCH /api/inbox`: list messages or mark all read.
- `GET|PATCH /api/inbox/[id]`: read or update read state.
- `POST /api/inbox/[id]/reply`: save reply.
- `POST /api/inbox/[id]/link-contact`: link message to contact.
- `GET|POST /api/campaigns`: list or create campaigns.
- `GET|PATCH|DELETE /api/campaigns/[id]`: campaign detail operations.
- `POST|DELETE /api/campaigns/[id]/posts`: link or unlink post.
- `POST|DELETE /api/campaigns/[id]/contacts`: link or unlink contact.
- `GET|POST /api/team`: list members/activity or invite user.
- `PATCH|DELETE /api/team/[id]`: update role or remove member.
- `GET|PATCH /api/settings/profile`: current user profile.
- `GET|PATCH /api/settings/integrations`: social connection states.
- `GET|POST /api/notifications`: list or create notification.
- `PATCH /api/notifications/[id]/read`: mark one read.
- `PATCH /api/notifications/read-all`: mark all read.
- `GET|POST /api/webhooks`: list or create local webhook definitions.
