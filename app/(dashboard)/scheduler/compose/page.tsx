import { PageHeader } from "@/components/layout/PageHeader";
import { PostComposer } from "@/components/scheduler/PostComposer";

export default function ComposePage() {
  return (
    <>
      <PageHeader
        eyebrow="Content Studio"
        title="Compose & Schedule"
        description="Create channel-aware content with a live preview, reliable draft saving, and precise delivery controls."
      />
      <PostComposer />
    </>
  );
}
