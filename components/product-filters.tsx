"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/format";
import type { Category } from "@/lib/types";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];

const TYPES = [
  { value: "", label: "Everything" },
  { value: "ingredient", label: "Ingredients" },
  { value: "meal_kit", label: "Meal kits" },
  { value: "food_pack", label: "Food packs" },
];

export function ProductFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  const activeCategory = params.get("category") ?? "";
  const activeType = params.get("type") ?? "";
  const activeSort = params.get("sort") ?? "newest";
  const frozenOnly = params.get("storage") === "frozen";

  return (
    <div className="space-y-4">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
        <button
          onClick={() => update("category", "")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
            !activeCategory ? "bg-brand-700 text-white" : "bg-white text-ink-soft ring-1 ring-black/10",
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => update("category", category.slug)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
              activeCategory === category.slug
                ? "bg-brand-700 text-white"
                : "bg-white text-ink-soft ring-1 ring-black/10",
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-white p-0.5 ring-1 ring-black/10">
          {TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => update("type", type.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                activeType === type.value ? "bg-brand-700 text-white" : "text-ink-soft",
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-pressed={frozenOnly}
          onClick={() => update("storage", frozenOnly ? "" : "frozen")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold ring-1",
            frozenOnly ? "bg-sky-600 text-white ring-sky-600" : "bg-white text-ink-soft ring-black/10",
          )}
        >
          ❄️ Frozen only
        </button>

        <select
          value={activeSort}
          onChange={(e) => update("sort", e.target.value)}
          className="ml-auto rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium outline-none"
          aria-label="Sort products"
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
