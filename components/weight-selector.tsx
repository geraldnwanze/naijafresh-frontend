"use client";

import { cn } from "@/lib/format";
import { formatWeight, weightPresets } from "@/lib/weight";

interface WeightRules {
  min_grams: number;
  step_grams: number;
  max_grams: number | null;
}

/**
 * Stepper for weight-sold products. `value` is grams; the − / + buttons move by
 * the product's step and stay within its min/max. Optional quick-pick chips
 * (1 kg, 2 kg, …) make larger amounts like rice a single tap.
 */
export function WeightSelector({
  value,
  onChange,
  rules,
  size = "md",
  showPresets = false,
  className,
}: {
  value: number;
  onChange: (grams: number) => void;
  rules: WeightRules;
  size?: "sm" | "md";
  showPresets?: boolean;
  className?: string;
}) {
  const ceiling = rules.max_grams ?? 100_000;
  const dim = size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10";
  const canDecrease = value - rules.step_grams >= rules.min_grams;
  const canIncrease = value + rules.step_grams <= ceiling;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="inline-flex items-center rounded-full border border-black/10 bg-white">
        <button
          type="button"
          aria-label={`Decrease by ${formatWeight(rules.step_grams)}`}
          onClick={() => onChange(value - rules.step_grams)}
          disabled={!canDecrease}
          className={cn(dim, "grid place-items-center rounded-full text-brand-800 disabled:opacity-40")}
        >
          −
        </button>
        <span className="min-w-16 text-center text-sm font-semibold tabular-nums">
          {formatWeight(value)}
        </span>
        <button
          type="button"
          aria-label={`Increase by ${formatWeight(rules.step_grams)}`}
          onClick={() => onChange(value + rules.step_grams)}
          disabled={!canIncrease}
          className={cn(dim, "grid place-items-center rounded-full text-brand-800 disabled:opacity-40")}
        >
          +
        </button>
      </div>

      {showPresets && (
        <div className="flex flex-wrap gap-1.5">
          {weightPresets(rules).map((grams) => (
            <button
              key={grams}
              type="button"
              onClick={() => onChange(grams)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                value === grams
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-black/15 bg-white text-ink-soft hover:border-brand-400",
              )}
            >
              {formatWeight(grams)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
