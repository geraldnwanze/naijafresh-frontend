import Link from "next/link";

import type { Category } from "@/lib/types";

const CATEGORY_EMOJI: Record<string, string> = {
  "fresh-foodstuff": "🧺",
  vegetables: "🥬",
  fruits: "🍍",
  "spices-seasonings": "🧂",
  staples: "🍚",
  protein: "🥩",
  "frozen-foods": "🧊",
  "meal-kits": "🍲",
  "food-boxes": "📦",
};

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="flex flex-col items-center gap-2 rounded-card border border-black/5 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-2xl">
        {CATEGORY_EMOJI[category.slug] ?? "🛒"}
      </span>
      <span className="text-sm font-semibold text-ink">{category.name}</span>
      {typeof category.products_count === "number" && (
        <span className="text-xs text-ink-soft">{category.products_count} items</span>
      )}
    </Link>
  );
}
