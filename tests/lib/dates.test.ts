import { describe, expect, it } from "vitest";

import { periodLabel, presetRange, toYmd } from "@/lib/dates";

const now = new Date(2026, 10, 15); // 15 Nov 2026, local time

describe("dates", () => {
  it("formats local dates as Y-m-d", () => {
    expect(toYmd(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("builds preset ranges", () => {
    expect(presetRange("this_month", now)).toEqual({ from: "2026-11-01", to: "2026-11-15" });
    expect(presetRange("last_month", now)).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(presetRange("this_year", now)).toEqual({ from: "2026-01-01", to: "2026-11-15" });
    expect(presetRange("last_30", now)).toEqual({ from: "2026-10-17", to: "2026-11-15" });
  });

  it("wraps last month across a year boundary", () => {
    expect(presetRange("last_month", new Date(2026, 0, 10))).toEqual({ from: "2025-12-01", to: "2025-12-31" });
  });

  it("labels trend buckets", () => {
    expect(periodLabel("2026-11-03", "day")).toMatch(/3/);
    expect(periodLabel("2026-11-01", "month")).toMatch(/26/);
  });
});
