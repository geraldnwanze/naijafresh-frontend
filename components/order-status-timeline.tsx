import { cn, formatDateTime } from "@/lib/format";
import type { TimelineStep } from "@/lib/types";

export function OrderStatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative space-y-6 border-l-2 border-black/10 pl-6">
      {steps.map((step) => (
        <li key={step.key} className="relative">
          <span
            className={cn(
              "absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full text-xs font-bold ring-4 ring-cream-100",
              step.state === "done" && "bg-brand-600 text-white",
              step.state === "current" && "bg-accent-500 text-brand-900",
              step.state === "upcoming" && "bg-black/10 text-ink-soft",
            )}
          >
            {step.state === "done" ? "✓" : step.state === "current" ? "•" : ""}
          </span>
          <p
            className={cn(
              "text-sm font-semibold",
              step.state === "upcoming" ? "text-ink-soft" : "text-ink",
            )}
          >
            {step.label}
          </p>
          {step.at && <p className="text-xs text-ink-soft">{formatDateTime(step.at)}</p>}
        </li>
      ))}
    </ol>
  );
}
