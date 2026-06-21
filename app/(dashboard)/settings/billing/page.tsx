import { PageHeader } from "@/components/layout/PageHeader";
import { BillingPlans } from "@/components/settings/BillingPlans";
import { SettingsNav } from "@/components/settings/SettingsNav";

export default function BillingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Plans & Billing"
        description="Choose the capacity and support level that matches your operating rhythm."
      />
      <SettingsNav />
      <BillingPlans />
    </>
  );
}
