import { CompanyForm } from "@/components/companies/CompanyForm";
import { CompanyList } from "@/components/companies/CompanyList";
import { PageHeader } from "@/components/layout/PageHeader";

export default function CompaniesPage() {
  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Companies"
        description="Keep account context, ownership, contacts, and pipeline connected in one place."
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <CompanyList />
        <aside className="xl:sticky xl:top-20 xl:self-start">
          <CompanyForm />
        </aside>
      </div>
    </>
  );
}
