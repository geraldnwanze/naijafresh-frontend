import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CartProvider, useCart } from "@/components/providers/cart-provider";
import { useCartPricing } from "@/lib/use-cart-pricing";
import { makeProduct } from "../factories";

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;
const priced = { data: { total_kobo: 150_000, lines: [] } };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  fetchMock = vi.fn(async () => new Response(JSON.stringify(priced), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function useBoth() {
  return { cart: useCart(), pricing: useCartPricing() };
}

describe("useCartPricing", () => {
  it("does nothing for an empty cart", async () => {
    const { result } = renderHook(() => useCartPricing(), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it("asks the server to price the cart (the server stays the source of truth)", async () => {
    const { result } = renderHook(useBoth, { wrapper });

    act(() => result.current.cart.addItem(makeProduct(), { quantity: 2 }));

    await waitFor(() => expect(result.current.pricing.data?.total_kobo).toBe(150_000));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/_api/v1/cart/price");
    expect(JSON.parse(init.body)).toEqual({ items: [{ product_id: 1, variant_id: null, quantity: 2 }] });
  });

  it("reprices when the cart changes", async () => {
    const { result } = renderHook(useBoth, { wrapper });

    act(() => result.current.cart.addItem(makeProduct()));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    act(() => result.current.cart.addItem(makeProduct({ id: 4 })));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("reports an error and clears data when pricing fails", async () => {
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ message: "Something is out of stock" }), { status: 422 }),
    );
    const { result } = renderHook(useBoth, { wrapper });

    act(() => result.current.cart.addItem(makeProduct()));

    await waitFor(() => expect(result.current.pricing.error).toBe("Something is out of stock"));
    expect(result.current.pricing.data).toBeNull();
  });
});
