// Contact management page.
import { ContactForm } from "@/components/contacts/ContactForm";
import { ContactTable } from "@/components/contacts/ContactTable";
import { ImportModal } from "@/components/contacts/ImportModal";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ContactsPage() {
  return (
    <>
      <PageHeader title="Contacts" description="Manage leads, customers, tags, assignments, and activity history." />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <ContactTable />
        <div className="space-y-4">
          <ContactForm />
          <ImportModal />
        </div>
      </div>
    </>
  );
}
