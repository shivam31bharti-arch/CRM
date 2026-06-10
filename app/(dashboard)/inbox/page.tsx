// Unified inbox page.
import { InboxList } from "@/components/inbox/InboxList";
import { PageHeader } from "@/components/layout/PageHeader";

export default function InboxPage() {
  return (
    <>
      <PageHeader title="Inbox" description="Reply to mentions, comments, DMs, and social replies from one queue." />
      <InboxList />
    </>
  );
}
