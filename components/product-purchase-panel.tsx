"use client";

import { useState } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { QuantitySelector } from "@/components/quantity-selector";
import { Button } from "@/components/ui/button";
import { WeightSelector } from "@/components/weight-selector";
import { formatNaira } from "@/lib/format";
import type { Product, ProductVariant } from "@/lib/types";
import { defaultQuantity, formatWeight, weightPriceKobo } from "@/lib/weight";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const variants = product.variants ?? [];
  const byWeight = product.sold_by === "weight" && !!product.weight;

  const [variantId, setVariantId] = useState<number | null>(
    variants.find((v) => v.is_default)?.id ?? variants[0]?.id ?? null,
  );
  // Items: a count. Weight-sold: grams (starts at the product minimum).
  const [quantity, setQuantity] = useState(defaultQuantity(product));

  const selectedVariant: ProductVariant | null = variants.find((v) => v.id === variantId) ?? null;
  // Per item, or per kg for weight-sold products.
  const unitPriceKobo = product.price_kobo + (selectedVariant?.price_delta_kobo ?? 0);
  const totalKobo = byWeight ? weightPriceKobo(unitPriceKobo, quantity) : unitPriceKobo * quantity;
  const disabled = !product.in_stock;

  function handleAdd() {
    if (disabled) {
      toast(`${product.name} is currently unavailable`, "error");
      return;
    }
    addItem(product, { variant: selectedVariant, quantity });
    toast(
      byWeight
        ? `Added ${formatWeight(quantity)} of ${product.name} to cart`
        : `Added ${quantity} × ${product.name} to cart`,
      "success",
    );
  }

  return (
    <div className="rounded-card border border-black/5 bg-white p-5 shadow-sm">
      <p className="text-3xl font-extrabold text-brand-800">
        {formatNaira(unitPriceKobo)}
        {byWeight && <span className="ml-1 text-base font-semibold text-ink-soft">/ kg</span>}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        {byWeight ? "sold by weight" : `per ${product.unit}`}
        {product.preparation_label ? ` · ${product.preparation_label}` : ""}
      </p>

      {variants.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-sm font-medium text-ink">Choose protein</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setVariantId(variant.id)}
                className={
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition " +
                  (variant.id === variantId
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-black/15 bg-white text-ink-soft hover:border-brand-400")
                }
              >
                {variant.name}
                {variant.price_delta_display ? ` (${variant.price_delta_display})` : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        {byWeight && product.weight ? (
          <>
            <p className="mb-1.5 text-sm font-medium text-ink">How much do you need?</p>
            <WeightSelector value={quantity} onChange={setQuantity} rules={product.weight} showPresets />
            <p className="mt-2 text-xs text-ink-soft">
              Minimum {formatWeight(product.weight.min_grams)}, in steps of{" "}
              {formatWeight(product.weight.step_grams)}
              {product.weight.max_grams ? `, up to ${formatWeight(product.weight.max_grams)}` : ""}.
            </p>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <QuantitySelector value={quantity} onChange={setQuantity} max={99} />
            <span className="text-sm text-ink-soft">{product.in_stock ? "In stock" : "Out of stock"}</span>
          </div>
        )}
        {byWeight && (
          <p className="mt-1 text-sm text-ink-soft">{product.in_stock ? "In stock" : "Out of stock"}</p>
        )}
      </div>

      <Button className="mt-5" fullWidth size="lg" onClick={handleAdd} disabled={disabled}>
        {disabled ? "Currently unavailable" : `Add to cart · ${formatNaira(totalKobo)}`}
      </Button>
    </div>
  );
}
