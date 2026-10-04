import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductGrid } from "@/components/product-grid";
import { ApiError } from "@/lib/api";
import { getCategory, getProducts } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await getCategory(slug);
    return {
      title: category.name,
      description: category.description ?? `Shop ${category.name} on NaijaFresh.`,
    };
  } catch {
    return { title: "Category" };
  }
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;

  let category;
  try {
    category = await getCategory(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const products = await getProducts({ category: slug, per_page: 48 });

  return (
    <div className="container-page py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-800">{category.name}</h1>
        {category.description && (
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">{category.description}</p>
        )}
      </header>
      <ProductGrid products={products.data} />
    </div>
  );
}
