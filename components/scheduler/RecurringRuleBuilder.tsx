// Recurring post rule selector.
import { Select } from "@/components/ui/Select";

export function RecurringRuleBuilder({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)} aria-label="Recurring rule">
      <option value="">No recurrence</option>
      <option value="DAILY">Daily</option>
      <option value="WEEKLY">Weekly</option>
      <option value="MONTHLY">Monthly</option>
    </Select>
  );
}
