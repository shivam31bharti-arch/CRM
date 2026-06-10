# CRM Research

Sources reviewed: Salesforce Sales Cloud public product/help materials, HubSpot CRM public product/help materials and 2026 review coverage, Pipedrive public product/help materials and 2026 review coverage, Zoho CRM public product/help materials and 2026 review coverage, Monday Sales CRM public product materials and 2026 review coverage.

## Salesforce Sales Cloud

- Primary navigation: Home, Leads, Accounts, Contacts, Opportunities, Tasks, Calendar, Reports, Dashboards, Forecasts, Campaigns, Setup/App Launcher.
- Core entities: Lead can convert into Account, Contact, and Opportunity. Account owns Contacts and Opportunities. Opportunity owns stages, products, activities, quotes, and forecasts. Activities attach to records.
- Contact/lead layout: highlights panel, key fields, related lists, activity timeline, notes/files, campaign history, ownership, status/lifecycle fields, custom fields.
- Pipeline board: Opportunities can be viewed by list, Kanban, stage path, forecast category, owner, and close date. Strong emphasis on inline stage changes and weighted forecast value.
- Activity timeline: task, call, email, meeting, and note history in reverse chronological sequence with upcoming work separated from history.
- Search/filter UX: global search, object tabs, list views, saved filters, advanced report filters, owner/team filters.
- Mobile: native mobile app mirrors record actions, search, approvals, notifications, and compact record layouts.
- Best-in-class: enterprise data model, workflow automation, reporting/forecasting depth, permissioning, ecosystem, customization.

## HubSpot CRM and Sales Hub

- Primary navigation: CRM, Contacts, Companies, Deals, Tickets, Conversations, Marketing, Sales, Automation, Reports, Settings.
- Core entities: Contact and Company are central; Deals attach to contacts/companies and pipelines; Activities include emails, calls, meetings, notes, tasks.
- Contact/lead layout: left identity and property rail, center timeline, right association cards for deals, tickets, companies, attachments, list memberships.
- Pipeline board: drag-and-drop deal board grouped by stage, list/table view alternative, filters by owner, amount, close date, priority.
- Activity timeline: unified engagement feed with filtering by activity type and expandable details.
- Search/filter UX: global search, saved views, property filters, segmentation lists, table columns chosen by user.
- Mobile: compact CRM object views, task queue, calling/email support, notifications.
- Best-in-class: approachable free CRM, clean record layout, strong lifecycle marketing + sales bridge, onboarding/training ecosystem.

## Pipedrive

- Primary navigation: Leads, Deals, Contacts, Activities, Campaigns, Insights, Automations, Marketplace, Settings.
- Core entities: Person and Organization contacts relate to Deals; Deals flow through Pipelines and Stages; Activities drive next actions.
- Contact/lead layout: contact header, contact details, linked organization, open deals, activity history, notes, files, custom fields.
- Pipeline board: core UX is drag-and-drop Kanban by stage with deal cards, values, labels, next activity warnings, rotting/stale signals.
- Activity timeline: sales activity history with strong focus on next scheduled activity and overdue status.
- Search/filter UX: pipeline filters, owner/team filters, labels, custom fields, saved filter chips.
- Mobile: pipeline and activity-first mobile app for field sales workflows.
- Best-in-class: fast visual selling workflow, low learning curve, pipeline clarity, practical automation.

## Zoho CRM

- Primary navigation: Home, Leads, Contacts, Accounts, Deals, Tasks, Meetings, Calls, Analytics, Campaigns, Marketplace, Setup.
- Core entities: Lead converts to Account, Contact, Deal; Activities attach to records; Campaigns associate with leads/contacts/deals; modules are highly customizable.
- Contact/lead layout: record details, timeline, related lists, social signals, notes, attachments, open activities, custom module data.
- Pipeline board: Kanban and list views; multiple pipelines; Blueprint process guidance; stage probabilities and forecasting.
- Activity timeline: record timeline combines field changes, emails, calls, meetings, notes, and automation events.
- Search/filter UX: module search, global search, custom views, advanced criteria, tags, territory/user filters.
- Mobile: native app with record details, tasks, calls, offline-friendly sales usage.
- Best-in-class: broad customization, strong value, multichannel communication, automation depth, Zoho suite integration.

## Monday Sales CRM

- Primary navigation: Workspace boards, Leads, Contacts, Accounts, Deals/Pipeline, Activities, Dashboards, Automations, Integrations.
- Core entities: Boards contain item rows; Contacts, Accounts, Deals, and Activities are represented as customizable boards connected by relation columns.
- Contact/lead layout: item detail panel with fields, updates/comments, files, activity updates, related board items.
- Pipeline board: flexible board views including Kanban, table, timeline, chart/dashboard; drag cards between stages.
- Activity timeline: collaboration updates, status changes, mentions, files, and automations in item updates.
- Search/filter UX: board search, saved views, status/person/date filters, dashboards, quick filters.
- Mobile: board-first mobile experience with updates, notifications, and item edits.
- Best-in-class: no-code customization, collaborative UI, easy automation builder, visual dashboards.

## Design Implications

- Use a left sidebar plus compact topbar for predictable CRM navigation.
- Make records timeline-centered with a right rail for associations and ownership.
- Provide both table and board/calendar views where workflows demand scanning.
- Support saved-looking filters even if MVP stores them client-side.
- Every list must have search, filters, sorting, pagination, loading, empty, and error states.
- Activity and notification data should be first-class because best CRM products make changes observable.
