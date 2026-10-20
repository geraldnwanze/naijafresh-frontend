import Link from "next/link";

import { productHygieneNote } from "@/lib/hygiene";
import type { Product } from "@/lib/types";

/** Reassurance on the product page, right under the buy button. */
export function HygieneAssurance({ product }: { product: Pick<Product, "is_frozen" | "is_meal_kit" | "is_food_pack"> }) {
  return (
    <div className="mt-4 flex gap-3 rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3">
      <span className="text-xl" aria-hidden>
        🧼
      </span>
      <div className="text-sm">
        <p className="font-semibold text-brand-800">Hygienically prepared and packed</p>
        <p className="mt-0.5 text-ink-soft">{productHygieneNote(product)}</p>
        <Link href="/hygiene" className="mt-1 inline-block font-semibold text-brand-700 hover:underline">
          How we keep your food safe →
        </Link>
      </div>
    </div>
  );
}

/** A single quiet line for the cart and checkout summaries. */
export function HygieneNote() {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
      <span aria-hidden>🧼</span>
      <span>
        Prepared and packed hygienically.{" "}
        <Link href="/hygiene" className="font-semibold underline-offset-2 hover:underline">
          Our hygiene promise
        </Link>
      </span>
    </p>
  );
}
