# Social Media Manager CRM Design Specification

This document is the source of truth for the build.

## Feature List

### Must-Have MVP

- Authentication: email/password registration and login with protected dashboard routes.
- Contacts: searchable, filterable, paginated contact management with tags, custom fields, import/export, notes, and activity timeline.
- Deals: Kanban sales pipeline with drag-and-drop stage changes, won/lost handling, detail views, and pipeline analytics.
- Scheduler: social post composer, calendar/list views, platform validation, media URL storage, drafts, recurring rules, and mock publishing.
- Analytics: overview cards, date filters, Recharts visualizations, post performance table, and CSV export.
- Inbox: unified message list with filters, read/reply state, contact linking, and real-time-friendly update hooks.
- Campaigns: campaign CRUD, linked contacts/posts/deals, status transitions, and aggregate analytics.
- Team: member table, invites, role changes, activity feed, assignments, and mention notifications.
- Settings: profile update, integrations, OAuth stubs, webhooks, API keys, and billing stub.
- Notifications: topbar bell, unread counts, mark-read actions, and helper-driven notification creation.
- Documentation and Docker: reproducible local setup with PostgreSQL and Redis services.

### Nice-to-Have Stubs

- Production social publishing adapters: replace mock Twitter, LinkedIn, Instagram, and Facebook clients with real APIs.
- Approval workflows: route posts through reviewer states before publishing.
- Saved views: persist table and calendar filters per user.
- AI caption assistant: generate post copy from campaign context.
- Social listening: ingest keyword mentions beyond owned-account messages.
- Stripe billing: paid plan checkout, subscription webhook handling, and seat limits.

## Database Schema

### ERD Text

- User 1-* Contact as creator and optional assignee.
- User 1-* Deal as optional assignee.
- User 1-* Activity, Notification, SocialAccount, Post, Note, Session, TeamMember.
- Contact *-* Tag through implicit Prisma relation.
- Contact 1-* Note, Activity, Deal, InboxItem.
- Deal 1-* Note and Activity.
- SocialAccount 1-* Post, PlatformAnalytic, InboxItem.
- Post 1-* PostAnalytic.
- Campaign *-* Contact through CampaignContact.
- Campaign *-* Deal through CampaignDeal.
- Campaign 1-* Post.

### Tables

User: id String pk cuid; email String unique; name String nullable; avatarUrl String nullable; role Role default MEMBER; passwordHash String; createdAt DateTime now; updatedAt DateTime updatedAt; lastLoginAt DateTime nullable.

Session: id String pk cuid; userId String fk User cascade; token String unique; expiresAt DateTime; createdAt DateTime now.

Contact: id String pk cuid; firstName String; lastName String; email String nullable index; phone String nullable; company String nullable; jobTitle String nullable; website String nullable; avatarUrl String nullable; status ContactStatus default LEAD index; source String nullable; customFields Json nullable; createdById String fk User; assignedToId String nullable fk User index; createdAt DateTime now index; updatedAt DateTime updatedAt.

Tag: id String pk cuid; name String unique; color String default #6366f1; createdAt DateTime now.

Note: id String pk cuid; body String; contactId String nullable fk Contact cascade index; dealId String nullable fk Deal cascade index; authorId String fk User; createdAt DateTime now; updatedAt DateTime updatedAt.

Deal: id String pk cuid; title String; value Float default 0; currency String default USD; stage DealStage default LEAD index; probability Int default 0; closeDate DateTime nullable index; description String nullable; contactId String nullable fk Contact; assignedToId String nullable fk User index; createdAt DateTime now; updatedAt DateTime updatedAt; wonAt DateTime nullable; lostAt DateTime nullable; lostReason String nullable.

SocialAccount: id String pk cuid; platform Platform; accountName String; accountId String; accessToken String; refreshToken String nullable; tokenExpiry DateTime nullable; avatarUrl String nullable; followerCount Int default 0; userId String fk User cascade index; isActive Boolean default true; createdAt DateTime now; updatedAt DateTime updatedAt; unique(platform, accountId).

Post: id String pk cuid; body String; mediaUrls String[] default []; platform Platform index; status PostStatus default DRAFT index; scheduledAt DateTime nullable index; publishedAt DateTime nullable; externalPostId String nullable; errorMessage String nullable; isRecurring Boolean default false; recurringRule String nullable; authorId String fk User index; socialAccountId String fk SocialAccount; campaignId String nullable fk Campaign; createdAt DateTime now; updatedAt DateTime updatedAt.

PostAnalytic: id String pk cuid; postId String fk Post cascade index; likes Int; comments Int; shares Int; reach Int; impressions Int; clicks Int; recordedAt DateTime now index.

PlatformAnalytic: id String pk cuid; socialAccountId String fk SocialAccount cascade index; followers Int; following Int; reach Int; impressions Int; engagementRate Float; recordedAt DateTime now index.

InboxItem: id String pk cuid; platform Platform; type InboxType; externalId String; senderName String; senderAvatarUrl String nullable; body String; isRead Boolean default false index; isReplied Boolean default false; replyBody String nullable; repliedAt DateTime nullable; contactId String nullable fk Contact index; socialAccountId String fk SocialAccount; receivedAt DateTime now index; unique(platform, externalId).

Campaign: id String pk cuid; name String; description String nullable; status CampaignStatus default DRAFT; startDate DateTime nullable; endDate DateTime nullable; createdAt DateTime now; updatedAt DateTime updatedAt.

CampaignContact: campaignId String fk Campaign cascade; contactId String fk Contact cascade; addedAt DateTime now; composite pk(campaignId, contactId).

CampaignDeal: campaignId String fk Campaign cascade; dealId String fk Deal cascade; addedAt DateTime now; composite pk(campaignId, dealId).

Activity: id String pk cuid; type ActivityType; description String; metadata Json nullable; userId String fk User index; contactId String nullable fk Contact index; dealId String nullable fk Deal index; createdAt DateTime now index.

Notification: id String pk cuid; userId String fk User cascade; type NotificationType; title String; body String; link String nullable; isRead Boolean default false; createdAt DateTime now; indexes(userId,isRead), createdAt.

TeamMember: id String pk cuid; userId String fk User cascade; role Role; joinedAt DateTime now.

## Navigation Architecture

- Sidebar: Dashboard (/), Contacts (/contacts), Deals (/deals), Scheduler (/scheduler), Analytics (/analytics), Inbox (/inbox), Campaigns (/campaigns), Team (/team), Settings (/settings).
- Settings subnav: Profile (/settings), Integrations (/settings/integrations), Billing (/settings/billing).
- Scheduler subnav: Calendar (/scheduler), Compose (/scheduler/compose).
- Breadcrumbs: route segments become labels; dynamic id pages resolve to record titles when available, otherwise "Detail".
- Icons: lucide-react only: LayoutDashboard, Users, KanbanSquare, CalendarDays, BarChart3, Inbox, Megaphone, UserRoundCog, Settings.

## Design Tokens

- Colors: primary #2563eb; secondary #14b8a6; accent #f59e0b; background #f8fafc; surface #ffffff; border #e2e8f0; text #0f172a; muted #64748b; success #16a34a; warning #d97706; danger #dc2626; info #0284c7.
- Typography: Inter/system sans; 12/16 labels, 14/20 body, 16/24 body-lg, 20/28 section heading, 24/32 page title, 32/40 dashboard hero metric. Weights 400, 500, 600, 700.
- Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- Radius: 4 small, 6 controls, 8 cards/dialogs, 999 pills.
- Shadows: sm 0 1px 2px rgba(15,23,42,.08); md 0 8px 24px rgba(15,23,42,.10).
- Buttons: primary filled, secondary outline, ghost, danger. Height 36 default, 32 compact, 44 large.
- Inputs: 36 default, visible labels, border neutral, focus ring primary, error ring danger.
- Badges: status-specific background and text; never rely on color alone.

## API Surface Map

All endpoints require an authenticated session unless marked public. Admin-only endpoints require ADMIN.

- POST /api/auth/register: create user.
- GET/POST /api/auth/[...nextauth]: NextAuth handler.
- GET /api/contacts: list contacts with search, filter, sort, pagination.
- POST /api/contacts: create contact.
- GET/PATCH/DELETE /api/contacts/[id]: read, update, delete contact.
- POST /api/contacts/import: import contacts from CSV.
- GET /api/contacts/export: export contacts CSV.
- GET/POST /api/deals: list/create deals.
- GET/PATCH/DELETE /api/deals/[id]: read/update/delete deal.
- PATCH /api/deals/[id]/stage: update deal stage.
- GET/POST /api/posts: list/create posts.
- GET/PATCH/DELETE /api/posts/[id]: read/update/delete post.
- POST /api/posts/publish: mock immediate publish.
- GET/POST /api/social-accounts: list/create mock social accounts.
- GET/POST /api/social-accounts/connect/[platform]: mock OAuth connect.
- GET /api/analytics: compact aggregate endpoint.
- GET /api/analytics/overview: aggregate KPI cards.
- GET /api/analytics/platform/[platform]: platform trend data.
- GET /api/analytics/posts: post performance rows or CSV.
- GET/PATCH /api/inbox: list items or mark all read.
- GET/PATCH /api/inbox/[id]: read/update item.
- POST /api/inbox/[id]/reply: save reply.
- POST /api/inbox/[id]/link-contact: link item to contact.
- GET/POST /api/campaigns: list/create campaigns.
- GET/PATCH/DELETE /api/campaigns/[id]: read/update/delete campaign.
- POST/DELETE /api/campaigns/[id]/posts: link/unlink posts.
- POST/DELETE /api/campaigns/[id]/contacts: link/unlink contacts.
- GET/POST /api/team: list members/invite user.
- PATCH/DELETE /api/team/[id]: change role/remove member. Admin only.
- GET/PATCH /api/settings/profile: read/update profile.
- GET/PATCH /api/settings/integrations: list/update integrations.
- GET/POST /api/notifications: list/create notifications.
- PATCH /api/notifications/[id]/read: mark notification read.
- PATCH /api/notifications/read-all: mark all read.
- POST /api/webhooks: receive/test webhook payload.

WebSocket/SSE events:

- notification.created: server to client; { notification }.
- inbox.created: server to client; { inboxItem }.
- deal.stageChanged: server to client; { dealId, stage, actorId }.
- post.statusChanged: server to client; { postId, status }.

## Screen Inventory

- /login: sign in.
- /register: create account.
- /: dashboard overview and activity feed.
- /contacts: contact table and filters.
- /contacts/[id]: contact detail and timeline.
- /deals: pipeline Kanban and analytics.
- /deals/[id]: deal detail.
- /scheduler: calendar and post list.
- /scheduler/compose: compose and schedule post.
- /analytics: social analytics dashboard.
- /inbox: unified inbox.
- /campaigns: campaign list.
- /campaigns/[id]: campaign detail.
- /team: team management.
- /settings: profile settings.
- /settings/integrations: social account and webhook integrations.
- /settings/billing: billing stub.
