import { act, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { CartProvider, useCart } from "@/components/providers/cart-provider";
import { makeProduct, makeWeightProduct } from "../factories";
import { renderWithStore } from "../render";

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
});

describe("CartProvider", () => {
  it("adds items and merges the same product and variant", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const tomatoes = makeProduct();

    act(() => result.current.addItem(tomatoes));
    act(() => result.current.addItem(tomatoes, { quantity: 2 }));

    expect(result.current.lines).toHaveLength(1);
    expect(result.current.lines[0].quantity).toBe(3);
    expect(result.current.count).toBe(3);
    expect(result.current.subtotalKobo).toBe(450_000);
  });

  it("keeps different variants of one product on separate lines and adds the price delta", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = makeProduct();
    const chicken = { id: 10, kind: "protein", name: "Chicken", price_delta_kobo: 50_000, price_delta_display: null, is_default: true };

    act(() => result.current.addItem(product));
    act(() => result.current.addItem(product, { variant: chicken }));

    expect(result.current.lines).toHaveLength(2);
    expect(result.current.lines[1].unitPriceKobo).toBe(200_000);
    expect(result.current.toApiItems()).toEqual([
      { product_id: 1, variant_id: null, quantity: 1 },
      { product_id: 1, variant_id: 10, quantity: 1 },
    ]);
  });

  it("prices weight-sold lines per kg and counts each as one thing", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(makeWeightProduct(), { quantity: 2500 }));

    expect(result.current.subtotalKobo).toBe(500_000);
    expect(result.current.count).toBe(1);
  });

  it("clamps quantities to the weight maximum and the 99-item cap", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(makeWeightProduct(), { quantity: 9000 }));
    act(() => result.current.addItem(makeWeightProduct(), { quantity: 9000 }));
    act(() => result.current.addItem(makeProduct({ id: 5 }), { quantity: 98 }));
    act(() => result.current.setQuantity("5:base", 500));

    expect(result.current.lines.find((l) => l.productId === 2)?.quantity).toBe(10_000);
    expect(result.current.lines.find((l) => l.productId === 5)?.quantity).toBe(99);
  });

  it("removes a line when its quantity is set to zero, and on removeItem and clear", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(makeProduct({ id: 1 })));
    act(() => result.current.addItem(makeProduct({ id: 2 })));
    act(() => result.current.addItem(makeProduct({ id: 3 })));
    act(() => result.current.setQuantity("1:base", 0));
    act(() => result.current.removeItem("2:base"));
    expect(result.current.lines.map((l) => l.productId)).toEqual([3]);

    act(() => result.current.clear());
    expect(result.current.lines).toEqual([]);
  });

  it("flags frozen items", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(makeProduct()));
    expect(result.current.hasFrozen).toBe(false);

    act(() => result.current.addItem(makeProduct({ id: 9, storage_type: "frozen", is_frozen: true })));
    expect(result.current.hasFrozen).toBe(true);
  });

  it("persists to localStorage and restores on mount", () => {
    const first = renderHook(() => useCart(), { wrapper });
    act(() => first.result.current.addItem(makeProduct(), { quantity: 4 }));
    expect(JSON.parse(localStorage.getItem("nf_cart_v2") ?? "[]")[0].quantity).toBe(4);
    first.unmount();

    const second = renderHook(() => useCart(), { wrapper });
    expect(second.result.current.lines[0].quantity).toBe(4);
  });

  it("survives corrupt storage and drops the old v1 cart", () => {
    localStorage.setItem("nf_cart_v2", "{not json");
    localStorage.setItem("nf_cart_v1", "[]");

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.lines).toEqual([]);
  });

  it("throws outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useCart())).toThrow(/CartProvider/);
  });
});

describe("AddToCartButton", () => {
  it("adds one item and confirms with a toast", async () => {
    renderWithStore(
      <>
        <AddToCartButton product={makeProduct()} />
        <CartCount />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByText("Added Fresh Tomatoes to cart")).toBeInTheDocument();
  });

  it("adds the minimum weight for weight-sold products", async () => {
    renderWithStore(
      <>
        <AddToCartButton product={makeWeightProduct()} />
        <CartCount />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Add 1 kg" }));

    expect(screen.getByText("Added 1 kg of Parboiled Rice")).toBeInTheDocument();
  });

  it("is disabled when the product is out of stock", () => {
    renderWithStore(<AddToCartButton product={makeProduct({ in_stock: false })} />);
    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });
});

function CartCount() {
  const { count } = useCart();
  return <span data-testid="count">{count}</span>;
}
