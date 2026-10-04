import { cn } from "@/lib/format";
import type { DeliveryWindow } from "@/lib/types";

export function DeliveryWindowSelector({
  windows,
  value,
  onChange,
}: {
  windows: DeliveryWindow[];
  value: number | null;
  onChange: (id: number) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {windows.map((window) => (
        <button
          key={window.id}
          type="button"
          onClick={() => onChange(window.id)}
          className={cn(
            "rounded-xl border px-3 py-3 text-left transition",
            value === window.id
              ? "border-brand-700 bg-brand-50 ring-1 ring-brand-700"
              : "border-black/10 bg-white hover:border-brand-400",
          )}
        >
          <span className="block text-sm font-semibold text-ink">{window.label}</span>
          <span className="block text-xs text-ink-soft">{window.display}</span>
        </button>
      ))}
    </div>
  );
}
