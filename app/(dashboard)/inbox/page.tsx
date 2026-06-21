// Unified inbox page.
import { InboxList } from "@/components/inbox/InboxList";
import { PageHeader } from "@/components/layout/PageHeader";

export default function InboxPage() {
  return (
    <>
      <PageHeader
        eyebrow="Engagement"
        title="Relationship Inbox"
        description="Turn comments, mentions, and direct messages into timely responses and CRM relationships."
      />
      <InboxList />
    </>
  );
}
