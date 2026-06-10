// Color-coded tag badge for contact segmentation.
export function TagBadge({ name, color = "#6366f1" }: { name: string; color?: string }) {
  return (
    <span className="rounded-full border px-2 py-0.5 text-xs font-medium" style={{ borderColor: color, color }}>
      {name}
    </span>
  );
}
