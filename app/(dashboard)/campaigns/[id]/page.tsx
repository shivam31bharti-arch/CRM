import { CampaignDetail } from "@/components/campaigns/CampaignDetail";
import { PageHeader } from "@/components/layout/PageHeader";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      posts: { include: { analytics: { orderBy: { recordedAt: "desc" }, take: 1 } } },
      contacts: { include: { contact: true } },
      deals: { include: { deal: true } }
    }
  });
  if (!campaign) notFound();
  return (
    <>
      <PageHeader
        eyebrow="Campaign record"
        title={campaign.name}
        description={
          campaign.description ?? "Campaign performance, audience, content, and pipeline influence."
        }
      />
      <CampaignDetail campaign={campaign} />
    </>
  );
}
