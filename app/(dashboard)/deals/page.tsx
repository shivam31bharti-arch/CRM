// Deal pipeline page.
import { DealForm } from "@/components/deals/DealForm";
import { PipelineBoard } from "@/components/deals/PipelineBoard";
import { PageHeader } from "@/components/layout/PageHeader";

export default function DealsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Revenue"
        title="Opportunity Pipeline"
        description="Prioritize the right deals, keep momentum visible, and move revenue forward with drag-and-drop stages."
      />
      <div className="mb-4">
        <DealForm />
      </div>
      <PipelineBoard />
    </>
  );
}
