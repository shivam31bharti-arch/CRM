// Deal pipeline page.
import { DealForm } from "@/components/deals/DealForm";
import { PipelineBoard } from "@/components/deals/PipelineBoard";
import { PageHeader } from "@/components/layout/PageHeader";

export default function DealsPage() {
  return (
    <>
      <PageHeader title="Deals" description="Move opportunities through the six-stage revenue pipeline." />
      <div className="mb-4"><DealForm /></div>
      <PipelineBoard />
    </>
  );
}
