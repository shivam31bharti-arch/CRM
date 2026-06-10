// Reusable error state with retry affordance.
import { Button } from "@/components/ui/Button";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="font-medium">Something needs attention</p>
      <p className="mt-1">{message}</p>
      {onRetry ? (
        <Button className="mt-3" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
