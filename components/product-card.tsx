import Link from "next/link";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { PriceDisplay } from "@/components/price-display";
import { ProductImage } from "@/components/product-image";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { formatWeight } from "@/lib/weight";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-card border border-black/5 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden">
        <ProductImage product={product} rounded="rounded-none" className="transition duration-300 group-hover:scale-[1.03]" />
        <div className="absolute left-2 top-2 flex gap-1">
          {product.is_meal_kit && <Badge className="bg-accent-500 text-brand-900">Meal kit</Badge>}
          {product.is_frozen && <Badge className="bg-sky-100 text-sky-800">❄️ Frozen</Badge>}
          {product.is_featured && !product.is_meal_kit && !product.is_frozen && <Badge>Popular</Badge>}
        </div>
        {!product.in_stock && (
          <div className="absolute inset-0 grid place-items-center bg-white/60">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-soft shadow">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand-700">
          {product.name}
        </Link>
        <p className="mt-0.5 text-xs text-ink-soft">
          {product.is_sold_by_weight && product.weight
            ? `sold by weight · from ${formatWeight(product.weight.min_grams)}`
            : `per ${product.unit}`}
          {product.is_meal_kit && product.meal_kit?.serves ? ` · serves ${product.meal_kit.serves}` : ""}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <PriceDisplay
            kobo={product.price_kobo}
            compareAtKobo={product.compare_at_price_kobo}
            suffix={product.is_sold_by_weight ? "/ kg" : undefined}
          />
        </div>

        <div className="mt-3">
          <AddToCartButton product={product} fullWidth />
        </div>
      </div>
    </div>
  );
}
