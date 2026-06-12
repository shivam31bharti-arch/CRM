// Deal detail page.
import { DealDetail } from "@/components/deals/DealDetail";
import { PageHeader } from "@/components/layout/PageHeader";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await db.deal.findUnique({
    where: { id },
    include: { contact: true, activities: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } } }
  });
  if (!deal) return <PageHeader title="Deal not found" />;
  return (
    <>
      <PageHeader title={deal.title} description="Deal detail, linked contact, notes, and activity history." />
      <DealDetail deal={deal} />
    </>
  );
}
