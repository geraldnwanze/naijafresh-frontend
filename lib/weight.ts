import type { SoldBy } from "./types";

/**
 * Weights are integer grams everywhere (cart quantity, step, min/max) and the
 * price of a weight-sold product is per kilogram in kobo — mirroring the API.
 */

/** 1500 -> "1.5 kg", 2000 -> "2 kg", 500 -> "500 g" */
export function formatWeight(grams: number): string {
  if (grams < 1000) return `${grams} g`;
  const kg = Number((grams / 1000).toFixed(3));
  return `${kg} kg`;
}

/** Price of `grams` at `pricePerKgKobo`, rounded half-up to a whole kobo (matches the API). */
export function weightPriceKobo(pricePerKgKobo: number, grams: number): number {
  return Math.floor((pricePerKgKobo * grams + 500) / 1000);
}

/** Line total for a cart line: price × count for items, per-kg price × grams for weight. */
export function lineTotalKobo(line: { soldBy: SoldBy; unitPriceKobo: number; quantity: number }): number {
  return line.soldBy === "weight"
    ? weightPriceKobo(line.unitPriceKobo, line.quantity)
    : line.unitPriceKobo * line.quantity;
}

/** Quick-pick weights (grams) offered next to the stepper, respecting min/step/max. */
export function weightPresets(rules: { min_grams: number; step_grams: number; max_grams: number | null }): number[] {
  const candidates = [rules.min_grams, 1000, 2000, 5000, 10000];
  return [...new Set(candidates)]
    .filter(
      (g) =>
        g >= rules.min_grams &&
        g % rules.step_grams === 0 &&
        (rules.max_grams === null || g <= rules.max_grams),
    )
    .sort((a, b) => a - b)
    .slice(0, 4);
}

/** Default amount to add: the minimum weight for weight-sold items, otherwise 1. */
export function defaultQuantity(product: {
  sold_by: SoldBy;
  weight?: { min_grams: number };
}): number {
  return product.sold_by === "weight" ? (product.weight?.min_grams ?? 500) : 1;
}
