// Billing settings page with Stripe-ready upgrade placeholder.
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function BillingPage() {
  return (
    <>
      <PageHeader title="Billing" description="Current plan and upgrade path." />
      <Card>
        <p className="text-sm text-slate-500">Current plan</p>
        <h2 className="mt-1 text-2xl font-bold">Free</h2>
        <p className="mt-2 text-sm text-slate-600">Stripe checkout can be enabled by adding billing credentials and webhook handling.</p>
        <Button className="mt-4" disabled>Upgrade</Button>
      </Card>
    </>
  );
}
