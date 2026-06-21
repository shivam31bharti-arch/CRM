// Scheduler calendar page.
import Link from "next/link";
import { Plus } from "lucide-react";
import { CalendarView } from "@/components/scheduler/CalendarView";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";

export default function SchedulerPage() {
  return (
    <>
      <PageHeader
        title="Content Studio"
        description="Plan the publishing rhythm, spot open days, and keep every channel moving."
        actions={
          <Link href="/scheduler/compose">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Compose
            </Button>
          </Link>
        }
      />
      <CalendarView />
    </>
  );
}
