"use client";

import { useEffect, useRef, useState } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { apiFetch } from "@/lib/api";
import type { PricedCart } from "@/lib/types";

interface State {
  data: PricedCart | null;
  loading: boolean;
  error: string | null;
}

/** Fetches authoritative totals from POST /cart/price whenever the cart changes. */
export function useCartPricing(): State & { refetch: () => void } {
  const { toApiItems, lines } = useCart();
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });
  const tick = useRef(0);

  const signature = JSON.stringify(lines.map((l) => [l.productId, l.variantId, l.quantity]));

  function run() {
    const items = toApiItems();
    if (items.length === 0) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const current = ++tick.current;
    setState((s) => ({ ...s, loading: true, error: null }));

    apiFetch<{ data: PricedCart }>("/cart/price", { method: "POST", body: { items } })
      .then((res) => {
        if (current === tick.current) setState({ data: res.data, loading: false, error: null });
      })
      .catch((err) => {
        if (current === tick.current) {
          setState({ data: null, loading: false, error: err?.message ?? "Could not price your cart." });
        }
      });
  }

  useEffect(() => {
    const timer = setTimeout(run, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return { ...state, refetch: run };
}
