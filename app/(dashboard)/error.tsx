"use client";

import { Button } from "@/components/ui/Button";

export default function DashboardError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto mt-16 max-w-lg rounded-lg border border-red-200 bg-white p-6 text-center shadow-card">
      <h1 className="text-xl font-semibold text-slate-950">
        This workspace view could not be loaded
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        The error was recorded. Retry the request or return later.
      </p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
