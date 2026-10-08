import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductImage } from "@/components/product-image";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api";
import { getProduct } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return {
      title: product.name,
      description: product.description.slice(0, 155),
      openGraph: { title: product.name, description: product.description.slice(0, 155) },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;

  let product;
  try {
    product = await getProduct(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const kit = product.meal_kit;
  const pack = product.food_pack;

  return (
    <div className="container-page py-8">
      <nav className="mb-4 text-sm text-ink-soft">
        <Link href="/products" className="hover:underline">Shop</Link>
        {product.category && (
          <>
            {" / "}
            <Link href={`/categories/${product.category.slug}`} className="hover:underline">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-card border border-black/5 bg-white">
          <div className="aspect-square">
            <ProductImage product={product} rounded="rounded-none" />
          </div>
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {product.is_meal_kit && <Badge className="bg-accent-500 text-brand-900">Ready-to-cook meal kit</Badge>}
            {product.is_food_pack && <Badge className="bg-amber-100 text-amber-900">Food pack combo</Badge>}
            {product.is_frozen && <Badge className="bg-sky-100 text-sky-800">❄️ Frozen</Badge>}
            {product.is_sold_by_weight && <Badge className="bg-brand-100 text-brand-700">Sold by weight</Badge>}
            {product.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} className="bg-brand-50 text-brand-700">{tag}</Badge>
            ))}
          </div>

          <h1 className="mt-3 text-3xl font-extrabold text-brand-800">{product.name}</h1>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
            {product.description}
          </p>

          <div className="mt-6">
            <ProductPurchasePanel product={product} />
          </div>

          {product.is_frozen && (
            <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
              ❄️ Delivered frozen in an insulated cooler bag. Please be available during your delivery
              window and move it to the freezer on arrival.
            </p>
          )}
          {product.storage_type === "chilled" && !product.is_meal_kit && (
            <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
              Keep refrigerated after delivery.
            </p>
          )}
        </div>
      </div>

      {pack && (
        <section className="mt-10 rounded-card border border-black/5 bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-brand-800">What&apos;s inside</h2>
            <p className="text-sm text-ink-soft">
              {pack.item_count} items · one pack price · no fridge needed
            </p>
          </div>
          <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-ink sm:grid-cols-2">
            {pack.contents.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            🧺 Everything in this pack is non-perishable. Store it in a cool, dry place.
          </p>
        </section>
      )}

      {kit && (
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="text-lg font-bold text-brand-800">What&apos;s in the kit</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {kit.serves && (
                <div>
                  <dt className="text-ink-soft">Serves</dt>
                  <dd className="font-semibold">{kit.serves}</dd>
                </div>
              )}
              {kit.prep_time_minutes && (
                <div>
                  <dt className="text-ink-soft">Prep &amp; cook time</dt>
                  <dd className="font-semibold">about {kit.prep_time_minutes} mins</dd>
                </div>
              )}
            </dl>

            {kit.included_items.length > 0 && (
              <>
                <p className="mt-4 text-sm font-semibold text-ink">Included</p>
                <ul className="mt-1 space-y-1 text-sm text-ink-soft">
                  {kit.included_items.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </>
            )}

            {kit.not_included_items.length > 0 && (
              <>
                <p className="mt-4 text-sm font-semibold text-ink">Not included</p>
                <ul className="mt-1 space-y-1 text-sm text-ink-soft">
                  {kit.not_included_items.map((item) => (
                    <li key={item}>✗ {item}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="space-y-6">
            {kit.cooking_instructions && (
              <div className="rounded-card border border-black/5 bg-white p-5">
                <h2 className="text-lg font-bold text-brand-800">How to cook it</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                  {kit.cooking_instructions}
                </p>
              </div>
            )}
            {kit.storage_instructions && (
              <div className="rounded-card border border-black/5 bg-white p-5">
                <h2 className="text-lg font-bold text-brand-800">Storage</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{kit.storage_instructions}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
