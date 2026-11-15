import { describe, expect, it } from "vitest";

import { cn, formatNaira, formatPct, profitTextClass, statusBadgeClass, timeAgo } from "@/lib/format";

describe("formatNaira", () => {
  it("formats whole naira without decimals", () => {
    expect(formatNaira(1_250_000)).toBe("₦12,500");
    expect(formatNaira(0)).toBe("₦0");
  });

  it("keeps kobo when there is a fraction", () => {
    expect(formatNaira(150_050)).toBe("₦1,500.50");
  });

  it("can force decimals", () => {
    expect(formatNaira(200_000, { withDecimals: true })).toBe("₦2,000.00");
  });

  it("marks negatives with a minus sign", () => {
    expect(formatNaira(-50_000)).toBe("−₦500");
  });
});

describe("formatPct", () => {
  it("handles null, undefined, negatives", () => {
    expect(formatPct(null)).toBe("—");
    expect(formatPct(undefined)).toBe("—");
    expect(formatPct(52.4)).toBe("52.4%");
    expect(formatPct(-3)).toBe("−3%");
  });
});

describe("profitTextClass", () => {
  it("colours profit, loss and nothing", () => {
    expect(profitTextClass(100)).toBe("text-emerald-700");
    expect(profitTextClass(-100)).toBe("text-rose-600");
    expect(profitTextClass(0)).toBe("text-ink");
    expect(profitTextClass(null)).toBe("text-ink");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-11-15T12:00:00Z").getTime();
  const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString();

  it("describes recent times", () => {
    expect(timeAgo(ago(10), now)).toBe("just now");
    expect(timeAgo(ago(5 * 60), now)).toBe("5m ago");
    expect(timeAgo(ago(3 * 3600), now)).toBe("3h ago");
    expect(timeAgo(ago(2 * 86_400), now)).toBe("2d ago");
  });

  it("falls back to a date after a week and to empty for no date", () => {
    expect(timeAgo(ago(10 * 86_400), now)).toMatch(/2026/);
    expect(timeAgo(null, now)).toBe("");
  });
});

describe("cn and statusBadgeClass", () => {
  it("drops falsy classes", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("styles known statuses and falls back for unknown ones", () => {
    expect(statusBadgeClass("delivered")).toContain("emerald");
    expect(statusBadgeClass("cancelled")).toContain("rose");
    expect(statusBadgeClass("mystery")).toBe("bg-zinc-100 text-zinc-700");
  });
});
