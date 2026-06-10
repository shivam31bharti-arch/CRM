// Lightweight confirmation dialog for destructive actions.
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
  open,
  title,
  body,
  onCancel,
  onConfirm
}: {
  open: boolean;
  title: string;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-panel">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{body}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
