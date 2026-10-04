"use client";

import Link from "next/link";

import { useCart } from "@/components/providers/cart-provider";
import { ProductImage } from "@/components/product-image";
import { QuantitySelector } from "@/components/quantity-selector";
import { WeightSelector } from "@/components/weight-selector";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { formatNaira } from "@/lib/format";
import { useCartPricing } from "@/lib/use-cart-pricing";
import { lineTotalKobo } from "@/lib/weight";

export default function CartPage() {
  const { lines, setQuantity, removeItem, subtotalKobo, hasFrozen } = useCart();
  const pricing = useCartPricing();

  if (lines.length === 0) {
    return (
      <div className="container-page py-10">
        <h1 className="mb-6 text-2xl font-bold text-brand-800">Your cart</h1>
        <EmptyState
          title="Your cart is empty"
          description="Add some fresh ingredients or a meal kit to get started."
          action={{ href: "/products", label: "Start shopping" }}
        />
      </div>
    );
  }

  const summary = pricing.data;
  const subtotal = summary?.subtotal_kobo ?? subtotalKobo;
  const deliveryFee = summary?.delivery_fee_kobo;
  const total = summary?.total_kobo;

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Your cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {lines.map((line) => (
            <li
              key={line.key}
              className="flex gap-3 rounded-card border border-black/5 bg-white p-3"
            >
              <Link
                href={`/products/${line.slug}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-xl"
              >
                <ProductImage
                  product={{ name: line.name, tags: [], image_url: line.imageUrl, is_meal_kit: line.type === "meal_kit" }}
                  rounded="rounded-none"
                />
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link href={`/products/${line.slug}`} className="text-sm font-semibold text-ink hover:text-brand-700">
                      {line.name}
                    </Link>
                    <p className="text-xs text-ink-soft">
                      {line.variantName ? `${line.variantName} · ` : ""}
                      {line.soldBy === "weight" ? `${formatNaira(line.unitPriceKobo)} / kg` : `per ${line.unit}`}
                      {line.storageType === "frozen" ? " · ❄️ frozen" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(line.key)}
                    className="text-xs font-medium text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-auto flex items-center justify-between pt-2">
                  {line.soldBy === "weight" ? (
                    <WeightSelector
                      size="sm"
                      value={line.quantity}
                      onChange={(grams) => setQuantity(line.key, grams)}
                      rules={{ min_grams: line.minGrams, step_grams: line.stepGrams, max_grams: line.maxGrams }}
                    />
                  ) : (
                    <QuantitySelector
                      size="sm"
                      value={line.quantity}
                      onChange={(q) => setQuantity(line.key, q)}
                    />
                  )}
                  <span className="text-sm font-bold text-brand-800">{formatNaira(lineTotalKobo(line))}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-card border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-brand-800">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="font-semibold">{formatNaira(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Delivery fee</dt>
              <dd className="font-semibold">
                {deliveryFee === undefined
                  ? "Calculated at checkout"
                  : deliveryFee === 0
                    ? "Free"
                    : formatNaira(deliveryFee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-2 text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-extrabold text-brand-800">
                {total === undefined ? formatNaira(subtotal) : formatNaira(total)}
              </dd>
            </div>
          </dl>

          {hasFrozen && (
            <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">
              ❄️ Frozen items are packed separately in an insulated cooler bag.
            </p>
          )}

          {pricing.error && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{pricing.error}</p>
          )}

          <ButtonLink href="/checkout" fullWidth size="lg" className="mt-5">
            Continue to checkout
          </ButtonLink>
          <Link
            href="/products"
            className="mt-3 block text-center text-sm font-medium text-brand-700 hover:underline"
          >
            Keep shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
