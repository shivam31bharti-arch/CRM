// Platform selector for post composing and filtering.
import { Select } from "@/components/ui/Select";
import { platforms } from "@/lib/constants";

export function PlatformSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)} aria-label="Social platform">
      {platforms.map((platform) => (
        <option key={platform} value={platform}>
          {platform}
        </option>
      ))}
    </Select>
  );
}
