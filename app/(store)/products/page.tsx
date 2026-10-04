import type { Metadata } from "next";

import { ProductFilters } from "@/components/product-filters";
import { ProductGrid } from "@/components/product-grid";
import { getCategories, getProducts } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop fresh Nigerian ingredients & meal kits",
  description:
    "Browse fresh foodstuff, spices, staples, protein and ready-to-cook meal kits. Filter by category and add to your cart.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const search = pick(sp.search);
  const category = pick(sp.category);
  const type = pick(sp.type) as "ingredient" | "meal_kit" | undefined;
  const sort = pick(sp.sort) as "newest" | "price_asc" | "price_desc" | "name" | undefined;
  const storage = pick(sp.storage) === "frozen" ? "frozen" : undefined;

  const [categories, result] = await Promise.all([
    getCategories(),
    getProducts({ search, category, type, storage, sort, per_page: 48 }),
  ]);

  return (
    <div className="container-page py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-800">
          {search ? `Results for “${search}”` : "Shop"}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {result.meta.total} {result.meta.total === 1 ? "product" : "products"}
        </p>
      </header>

      <ProductFilters categories={categories} />

      <div className="mt-6">
        <ProductGrid products={result.data} />
      </div>
    </div>
  );
}
