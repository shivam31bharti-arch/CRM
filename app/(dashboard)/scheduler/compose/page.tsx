import { PageHeader } from "@/components/layout/PageHeader";
import { PostComposer } from "@/components/scheduler/PostComposer";

export default function ComposePage() {
  return (
    <>
      <PageHeader
        eyebrow="Content Studio"
        title="Compose & Schedule"
        description="Create channel-aware content with restored local drafts and delivery aligned to the current sync cadence."
      />
      <PostComposer />
    </>
  );
}
