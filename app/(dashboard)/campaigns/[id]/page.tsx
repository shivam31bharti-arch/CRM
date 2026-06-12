// Campaign detail page.
import { CampaignDetail } from "@/components/campaigns/CampaignDetail";
import { PageHeader } from "@/components/layout/PageHeader";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id }, include: { posts: { include: { analytics: true } }, contacts: { include: { contact: true } }, deals: { include: { deal: true } } } });
  if (!campaign) return <PageHeader title="Campaign not found" />;
  return (
    <>
      <PageHeader title={campaign.name} description={campaign.description ?? "Campaign detail"} />
      <CampaignDetail campaign={campaign} />
    </>
  );
}
