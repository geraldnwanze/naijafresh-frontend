"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import type { Product, ProductVariant, SoldBy, StorageType } from "@/lib/types";
import { defaultQuantity, lineTotalKobo } from "@/lib/weight";

export interface CartLine {
  key: string;
  productId: number;
  slug: string;
  name: string;
  unit: string;
  type: Product["type"];
  imageUrl: string | null;
  variantId: number | null;
  variantName: string | null;
  /** Price per item, or per kg for weight-sold products. */
  unitPriceKobo: number;
  /** Item count, or grams for weight-sold products. */
  quantity: number;
  soldBy: SoldBy;
  storageType: StorageType;
  /** Weight rules in grams (weight-sold only). */
  minGrams: number;
  stepGrams: number;
  maxGrams: number | null;
}

interface CartContextValue {
  lines: CartLine[];
  /** Number of things in the cart: items, plus one per weight-sold line. */
  count: number;
  subtotalKobo: number;
  hasFrozen: boolean;
  /** `quantity` is an item count, or grams for weight-sold products (defaults to the minimum). */
  addItem: (product: Product, opts?: { variant?: ProductVariant | null; quantity?: number }) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  /** Payload for POST /cart/price and POST /orders */
  toApiItems: () => { product_id: number; variant_id: number | null; quantity: number }[];
}

const CartContext = createContext<CartContextValue | null>(null);
// v2: weight-based lines (quantity in grams). Older carts used plain counts and are discarded.
const STORAGE_KEY = "nf_cart_v2";

function lineKey(productId: number, variantId: number | null): string {
  return `${productId}:${variantId ?? "base"}`;
}

function clampQuantity(line: Pick<CartLine, "soldBy" | "maxGrams">, quantity: number): number {
  if (line.soldBy === "weight") {
    return line.maxGrams !== null ? Math.min(quantity, line.maxGrams) : quantity;
  }
  return Math.min(quantity, 99);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
      localStorage.removeItem("nf_cart_v1");
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore quota errors */
    }
  }, [lines, hydrated]);

  const addItem = useCallback<CartContextValue["addItem"]>((product, opts = {}) => {
    const variant = opts.variant ?? null;
    const byWeight = product.sold_by === "weight";
    const quantity = Math.max(1, opts.quantity ?? defaultQuantity(product));
    const key = lineKey(product.id, variant?.id ?? null);
    const unitPriceKobo = product.price_kobo + (variant?.price_delta_kobo ?? 0);

    const fresh: CartLine = {
      key,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unit: product.unit,
      type: product.type,
      imageUrl: product.image_url,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      unitPriceKobo,
      quantity,
      soldBy: product.sold_by,
      storageType: product.storage_type,
      minGrams: byWeight ? (product.weight?.min_grams ?? 0) : 0,
      stepGrams: byWeight ? (product.weight?.step_grams ?? 500) : 0,
      maxGrams: byWeight ? (product.weight?.max_grams ?? null) : null,
    };

    setLines((current) => {
      const existing = current.find((l) => l.key === key);
      if (existing) {
        return current.map((l) =>
          l.key === key ? { ...l, quantity: clampQuantity(l, l.quantity + quantity) } : l,
        );
      }
      return [...current, { ...fresh, quantity: clampQuantity(fresh, quantity) }];
    });

    track("product_added_to_cart", {
      product: product.slug,
      quantity,
      sold_by: product.sold_by,
      variant: variant?.name,
    });
  }, []);

  const setQuantity = useCallback<CartContextValue["setQuantity"]>((key, quantity) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((l) => l.key !== key)
        : current.map((l) => (l.key === key ? { ...l, quantity: clampQuantity(l, quantity) } : l)),
    );
  }, []);

  const removeItem = useCallback<CartContextValue["removeItem"]>((key) => {
    setLines((current) => current.filter((l) => l.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const toApiItems = useCallback(
    () =>
      lines.map((l) => ({
        product_id: l.productId,
        variant_id: l.variantId,
        quantity: l.quantity,
      })),
    [lines],
  );

  const count = useMemo(
    () => lines.reduce((sum, l) => sum + (l.soldBy === "weight" ? 1 : l.quantity), 0),
    [lines],
  );
  const subtotalKobo = useMemo(() => lines.reduce((sum, l) => sum + lineTotalKobo(l), 0), [lines]);
  const hasFrozen = useMemo(() => lines.some((l) => l.storageType === "frozen"), [lines]);

  const value = useMemo(
    () => ({ lines, count, subtotalKobo, hasFrozen, addItem, setQuantity, removeItem, clear, toApiItems }),
    [lines, count, subtotalKobo, hasFrozen, addItem, setQuantity, removeItem, clear, toApiItems],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
