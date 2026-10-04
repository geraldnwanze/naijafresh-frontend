"use client";

import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";
import { defaultQuantity, formatWeight } from "@/lib/weight";

/**
 * One-tap add from a product card. Weight-sold products add their minimum
 * weight (e.g. 1 kg of rice); fine-tune it in the cart or on the product page.
 */
export function AddToCartButton({ product, fullWidth = false }: { product: Product; fullWidth?: boolean }) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const disabled = !product.in_stock;
  const quantity = defaultQuantity(product);
  const byWeight = product.sold_by === "weight";

  function handleAdd() {
    if (disabled) {
      toast(`${product.name} is currently unavailable`, "error");
      return;
    }
    addItem(product, { quantity });
    toast(byWeight ? `Added ${formatWeight(quantity)} of ${product.name}` : `Added ${product.name} to cart`, "success");
  }

  return (
    <Button
      size="sm"
      fullWidth={fullWidth}
      variant={disabled ? "outline" : "primary"}
      onClick={handleAdd}
      disabled={disabled}
    >
      {disabled ? "Unavailable" : byWeight ? `Add ${formatWeight(quantity)}` : "Add to cart"}
    </Button>
  );
}
