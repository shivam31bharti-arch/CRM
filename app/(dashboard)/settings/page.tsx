import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { SettingsNav } from "@/components/settings/SettingsNav";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Workspace Settings"
        description="Manage your identity, connections, and commercial workspace configuration."
      />
      <SettingsNav />
      <ProfileForm />
    </>
  );
}
