import type { ReportGroupBy } from "./types";

/** Local calendar date as Y-m-d (the API expects business-local days). */
export function toYmd(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export type RangePreset = "this_month" | "last_month" | "last_30" | "this_year" | "custom";

export const RANGE_PRESETS: { value: Exclude<RangePreset, "custom">; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_30", label: "Last 30 days" },
  { value: "this_year", label: "This year" },
];

export function presetRange(preset: Exclude<RangePreset, "custom">, now = new Date()): { from: string; to: string } {
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (preset) {
    case "this_month":
      return { from: toYmd(new Date(year, month, 1)), to: toYmd(now) };
    case "last_month":
      return { from: toYmd(new Date(year, month - 1, 1)), to: toYmd(new Date(year, month, 0)) };
    case "this_year":
      return { from: toYmd(new Date(year, 0, 1)), to: toYmd(now) };
    default: {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return { from: toYmd(start), to: toYmd(now) };
    }
  }
}

/** Short axis/tooltip label for a trend bucket starting on `periodStart` (Y-m-d). */
export function periodLabel(periodStart: string, groupBy: ReportGroupBy): string {
  const date = new Date(`${periodStart}T00:00:00`);

  if (groupBy === "month") {
    return date.toLocaleDateString("en-NG", { month: "short", year: "2-digit" });
  }

  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}
