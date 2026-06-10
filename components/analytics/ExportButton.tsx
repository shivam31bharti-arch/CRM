// Analytics CSV export button.
"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ExportButton() {
  return (
    <Button variant="secondary" onClick={() => window.open("/api/analytics/posts?export=csv", "_blank")}>
      <Download className="h-4 w-4" aria-hidden="true" />
      Export CSV
    </Button>
  );
}
