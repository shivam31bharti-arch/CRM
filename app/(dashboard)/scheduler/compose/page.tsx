// Post composer page.
import { PageHeader } from "@/components/layout/PageHeader";
import { PostComposer } from "@/components/scheduler/PostComposer";

export default function ComposePage() {
  return (
    <>
      <PageHeader title="Compose post" description="Create platform-aware content with scheduling and recurrence." />
      <PostComposer />
    </>
  );
}
