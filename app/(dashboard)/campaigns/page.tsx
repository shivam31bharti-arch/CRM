// Campaign manager page.
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { CampaignList } from "@/components/campaigns/CampaignList";
import { PageHeader } from "@/components/layout/PageHeader";

export default function CampaignsPage() {
  return (
    <>
      <PageHeader title="Campaigns" description="Group social posts, CRM contacts, and deals into measurable initiatives." />
      <div className="mb-4"><CampaignForm /></div>
      <CampaignList />
    </>
  );
}
