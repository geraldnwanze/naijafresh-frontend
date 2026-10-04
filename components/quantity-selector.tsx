"use client";

import { cn } from "@/lib/format";

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const dim = size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10";

  return (
    <div className={cn("inline-flex items-center rounded-full border border-black/10 bg-white", className)}>
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        className={cn(dim, "grid place-items-center rounded-full text-brand-800 disabled:opacity-40")}
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        className={cn(dim, "grid place-items-center rounded-full text-brand-800 disabled:opacity-40")}
      >
        +
      </button>
    </div>
  );
}
