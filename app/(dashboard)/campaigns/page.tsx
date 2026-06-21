// Campaign manager page.
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { CampaignList } from "@/components/campaigns/CampaignList";
import { PageHeader } from "@/components/layout/PageHeader";

export default function CampaignsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Growth"
        title="Campaign Workspace"
        description="Connect content, audiences, and pipeline so every initiative has a measurable business outcome."
      />
      <div className="mb-4">
        <CampaignForm />
      </div>
      <CampaignList />
    </>
  );
}
