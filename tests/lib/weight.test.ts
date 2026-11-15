import { describe, expect, it } from "vitest";

import { defaultQuantity, formatWeight, lineTotalKobo, weightPresets, weightPriceKobo } from "@/lib/weight";

describe("formatWeight", () => {
  it("shows grams below a kilo and kilos above", () => {
    expect(formatWeight(500)).toBe("500 g");
    expect(formatWeight(1000)).toBe("1 kg");
    expect(formatWeight(1500)).toBe("1.5 kg");
  });
});

describe("weightPriceKobo", () => {
  it("prices grams from a per-kg price", () => {
    expect(weightPriceKobo(200_000, 1000)).toBe(200_000);
    expect(weightPriceKobo(200_000, 500)).toBe(100_000);
  });

  it("rounds half up to a whole kobo, like the API", () => {
    expect(weightPriceKobo(1, 500)).toBe(1);
    expect(weightPriceKobo(1, 499)).toBe(0);
    expect(weightPriceKobo(333, 1500)).toBe(500);
  });
});

describe("lineTotalKobo", () => {
  it("multiplies items and prices weight by kg", () => {
    expect(lineTotalKobo({ soldBy: "unit", unitPriceKobo: 150_000, quantity: 3 })).toBe(450_000);
    expect(lineTotalKobo({ soldBy: "weight", unitPriceKobo: 200_000, quantity: 2500 })).toBe(500_000);
  });
});

describe("weightPresets", () => {
  it("offers sensible quick picks within the rules", () => {
    expect(weightPresets({ min_grams: 1000, step_grams: 500, max_grams: 10_000 })).toEqual([1000, 2000, 5000, 10_000]);
  });

  it("respects the step and the maximum", () => {
    expect(weightPresets({ min_grams: 500, step_grams: 500, max_grams: 2000 })).toEqual([500, 1000, 2000]);
    expect(weightPresets({ min_grams: 1000, step_grams: 1000, max_grams: null })).toEqual([1000, 2000, 5000, 10_000]);
  });
});

describe("defaultQuantity", () => {
  it("is 1 for items and the minimum weight for weight-sold products", () => {
    expect(defaultQuantity({ sold_by: "unit" })).toBe(1);
    expect(defaultQuantity({ sold_by: "weight", weight: { min_grams: 1000 } })).toBe(1000);
    expect(defaultQuantity({ sold_by: "weight" })).toBe(500);
  });
});
