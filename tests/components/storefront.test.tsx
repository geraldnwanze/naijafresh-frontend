import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CheckoutSummary } from "@/components/checkout-summary";
import { ProductCard } from "@/components/product-card";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
import { useCart } from "@/components/providers/cart-provider";
import type { PricedCart } from "@/lib/types";
import { makeProduct, makeWeightProduct } from "../factories";
import { renderWithStore } from "../render";

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
});

function CartLines() {
  const { lines } = useCart();
  return <pre data-testid="lines">{JSON.stringify(lines.map((l) => [l.productId, l.variantId, l.quantity]))}</pre>;
}

describe("ProductCard", () => {
  it("links to the product and shows name, unit and price", () => {
    renderWithStore(<ProductCard product={makeProduct()} />);

    expect(screen.getAllByRole("link", { name: /Fresh Tomatoes/ })[0]).toHaveAttribute("href", "/products/fresh-tomatoes");
    expect(screen.getByText("per basket")).toBeInTheDocument();
    expect(screen.getByText("₦1,500")).toBeInTheDocument();
  });

  it("shows badges and an out-of-stock overlay", () => {
    renderWithStore(
      <ProductCard product={makeProduct({ is_food_pack: true, food_pack: { contents: ["a", "b"], item_count: 2 }, in_stock: false })} />,
    );

    expect(screen.getByText("Food pack")).toBeInTheDocument();
    expect(screen.getByText(/2 items inside/)).toBeInTheDocument();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });

  it("labels weight-sold products per kg", () => {
    renderWithStore(<ProductCard product={makeWeightProduct()} />);

    expect(screen.getByText(/sold by weight · from 1 kg/)).toBeInTheDocument();
    expect(screen.getByText("/ kg")).toBeInTheDocument();
  });
});

describe("ProductPurchasePanel", () => {
  it("adds the chosen quantity and shows the running total", async () => {
    renderWithStore(
      <>
        <ProductPurchasePanel product={makeProduct()} />
        <CartLines />
      </>,
    );

    await userEvent.click(screen.getByLabelText("Increase quantity"));
    expect(screen.getByRole("button", { name: "Add to cart · ₦3,000" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Add to cart/ }));

    expect(screen.getByTestId("lines")).toHaveTextContent("[[1,null,2]]");
    expect(screen.getByText("Added 2 × Fresh Tomatoes to cart")).toBeInTheDocument();
  });

  it("applies a variant's price delta and adds that variant", async () => {
    const product = makeProduct({
      variants: [
        { id: 1, kind: "protein", name: "Beef", price_delta_kobo: 0, price_delta_display: null, is_default: true },
        { id: 2, kind: "protein", name: "Fish", price_delta_kobo: 50_000, price_delta_display: "+₦500", is_default: false },
      ],
    });
    renderWithStore(
      <>
        <ProductPurchasePanel product={product} />
        <CartLines />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: /Fish/ }));
    expect(screen.getByRole("button", { name: "Add to cart · ₦2,000" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Add to cart/ }));
    expect(screen.getByTestId("lines")).toHaveTextContent("[[1,2,1]]");
  });

  it("prices weight-sold products by the amount chosen", async () => {
    renderWithStore(
      <>
        <ProductPurchasePanel product={makeWeightProduct()} />
        <CartLines />
      </>,
    );

    expect(screen.getByRole("button", { name: "Add to cart · ₦2,000" })).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Increase by 500 g"));
    expect(screen.getByRole("button", { name: "Add to cart · ₦3,000" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Add to cart/ }));
    expect(screen.getByTestId("lines")).toHaveTextContent("[[2,null,1500]]");
    expect(screen.getByText("Added 1.5 kg of Parboiled Rice to cart")).toBeInTheDocument();
  });

  it("cannot add an unavailable product", () => {
    renderWithStore(<ProductPurchasePanel product={makeProduct({ in_stock: false })} />);
    expect(screen.getByRole("button", { name: "Currently unavailable" })).toBeDisabled();
  });
});

describe("CheckoutSummary", () => {
  const cart: PricedCart = {
    currency: "NGN",
    item_count: 2,
    lines: [
      {
        product_id: 1, slug: "x", name: "Rice", unit: "kg", image_url: null, variant_id: null, variant_name: null,
        quantity: 2000, quantity_label: "2 kg", sold_by: "weight", storage_type: "ambient", unit_price_kobo: 200_000,
        unit_price: "₦2,000", line_total_kobo: 400_000, line_total: "₦4,000", in_stock: true, available_quantity: 9000,
      },
      {
        product_id: 2, slug: "y", name: "Chicken", unit: "kg", image_url: null, variant_id: 3, variant_name: "Wings",
        quantity: 1, quantity_label: "1", sold_by: "unit", storage_type: "frozen", unit_price_kobo: 300_000,
        unit_price: "₦3,000", line_total_kobo: 300_000, line_total: "₦3,000", in_stock: false, available_quantity: 0,
      },
    ],
    subtotal_kobo: 700_000, subtotal: "₦7,000",
    delivery_fee_kobo: 0, delivery_fee: "₦0",
    discount_kobo: 0, discount: "₦0",
    total_kobo: 700_000, total: "₦7,000",
  };

  it("lists lines, flags frozen and unavailable, and totals with free delivery", () => {
    renderWithStore(<CheckoutSummary cart={cart} />);

    expect(screen.getByText(/2 kg × Rice/)).toBeInTheDocument();
    expect(screen.getByText(/Wings/)).toBeInTheDocument();
    expect(screen.getByText(/frozen/)).toBeInTheDocument();
    expect(screen.getByText(/unavailable/)).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getAllByText("₦7,000")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Our hygiene promise" })).toHaveAttribute("href", "/hygiene");
  });

  it("charges a delivery fee when there is one", () => {
    renderWithStore(<CheckoutSummary cart={{ ...cart, delivery_fee_kobo: 150_000, total_kobo: 850_000 }} />);
    expect(screen.getByText("₦1,500")).toBeInTheDocument();
    expect(screen.getByText("₦8,500")).toBeInTheDocument();
  });

  it("handles loading and empty states", async () => {
    const { rerender } = renderWithStore(<CheckoutSummary cart={null} loading />);
    expect(screen.getByText("Calculating…")).toBeInTheDocument();

    rerender(<CheckoutSummary cart={null} />);
    await waitFor(() => expect(screen.getByText("Your cart is empty.")).toBeInTheDocument());
  });
});
