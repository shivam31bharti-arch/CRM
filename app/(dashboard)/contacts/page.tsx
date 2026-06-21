// Contact management page.
import { ContactForm } from "@/components/contacts/ContactForm";
import { ContactTable } from "@/components/contacts/ContactTable";
import { ImportModal } from "@/components/contacts/ImportModal";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ContactsPage() {
  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Customer Hub"
        description="Build a clean relationship map, assign ownership, and move the right people toward revenue."
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <ContactTable />
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <ContactForm />
          <ImportModal />
        </aside>
      </div>
    </>
  );
}
