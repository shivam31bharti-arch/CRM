// Profile settings page.
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "@/components/settings/ProfileForm";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Profile settings" description="Update your profile, email, avatar, and password." />
      <ProfileForm />
    </>
  );
}
