// Scheduler calendar page.
import Link from "next/link";
import { CalendarView } from "@/components/scheduler/CalendarView";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";

export default function SchedulerPage() {
  return (
    <>
      <PageHeader title="Scheduler" description="Plan, filter, and review social content." actions={<Link href="/scheduler/compose"><Button>Compose</Button></Link>} />
      <CalendarView />
    </>
  );
}
