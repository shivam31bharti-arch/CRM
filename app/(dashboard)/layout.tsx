// Dashboard layout with sidebar and topbar shell.
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { redirect } from "next/navigation";
import { ApiAuthError, requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireUser();
  } catch (error) {
    if (error instanceof ApiAuthError) redirect("/login");
    throw error;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
