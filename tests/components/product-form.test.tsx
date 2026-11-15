import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductForm } from "@/components/admin/product-form";
import type { Category } from "@/lib/types";

const apiFetch = vi.fn();

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));
vi.mock("@/components/providers/auth-provider", () => ({ useAuth: () => ({ token: "tok" }) }));
vi.mock("@/components/providers/toast-provider", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const category = (id: number, name: string): Category => ({
  id, name, slug: name.toLowerCase(), description: null, image_url: null, position: id, is_active: true,
});

async function fillRequired() {
  await userEvent.type(screen.getByLabelText(/^Name/), "Okra");
  await userEvent.type(screen.getByLabelText(/^Selling price/), "1500");
  await userEvent.type(screen.getByLabelText(/^Description/), "Fresh okra");
  await userEvent.clear(screen.getByLabelText(/^Stock/));
  await userEvent.type(screen.getByLabelText(/^Stock/), "10");
}

beforeEach(() => {
  apiFetch.mockReset().mockResolvedValue({});
});

describe("ProductForm", () => {
  it("uses the first category even if the category list loads after the form opens", async () => {
    const { rerender } = render(<ProductForm categories={[]} onSaved={() => {}} onCancel={() => {}} />);

    rerender(<ProductForm categories={[category(7, "Vegetables"), category(8, "Fruits")]} onSaved={() => {}} onCancel={() => {}} />);
    await fillRequired();
    await userEvent.click(screen.getByRole("button", { name: "Create product" }));

    expect(apiFetch).toHaveBeenCalledWith("/admin/products", expect.objectContaining({
      method: "POST",
      body: expect.objectContaining({ category_id: 7 }),
    }));
  });

  it("sends the category the admin picked", async () => {
    render(<ProductForm categories={[category(7, "Vegetables"), category(8, "Fruits")]} onSaved={() => {}} onCancel={() => {}} />);

    await fillRequired();
    await userEvent.selectOptions(screen.getByLabelText(/^Category/), "8");
    await userEvent.click(screen.getByRole("button", { name: "Create product" }));

    expect(apiFetch.mock.calls[0][1].body.category_id).toBe(8);
  });

  it("sends prices in kobo and weight-sold stock in grams", async () => {
    render(<ProductForm categories={[category(7, "Vegetables")]} onSaved={() => {}} onCancel={() => {}} />);

    await userEvent.selectOptions(screen.getByLabelText(/^How is it sold/), "weight");
    await userEvent.type(screen.getByLabelText(/^Name/), "Ginger");
    await userEvent.type(screen.getByLabelText(/^Selling price per kg/), "2400");
    await userEvent.type(screen.getByLabelText(/^Cost price per kg/), "1800");
    await userEvent.type(screen.getByLabelText(/^Description/), "Fresh ginger");
    await userEvent.clear(screen.getByLabelText(/^Stock/));
    await userEvent.type(screen.getByLabelText(/^Stock/), "20");
    await userEvent.click(screen.getByRole("button", { name: "Create product" }));

    expect(apiFetch.mock.calls[0][1].body).toMatchObject({
      sold_by: "weight",
      price_kobo: 240_000,
      cost_price_kobo: 180_000,
      stock_quantity: 20_000,
      weight_step_grams: 500,
    });
  });

  it("forces food packs to per-pack, room temperature and sends the contents list", async () => {
    render(<ProductForm categories={[category(7, "Packs")]} onSaved={() => {}} onCancel={() => {}} />);

    await userEvent.selectOptions(screen.getByLabelText(/^How is it sold/), "weight");
    await userEvent.selectOptions(screen.getByLabelText(/^Storage/), "frozen");
    await userEvent.selectOptions(screen.getByLabelText(/^Type/), "food_pack");
    await fillRequired();
    await userEvent.type(screen.getByLabelText(/^What's inside/), "Rice (5 kg)\n\nBeans (2 kg)");
    await userEvent.click(screen.getByRole("button", { name: "Create product" }));

    expect(apiFetch.mock.calls[0][1].body).toMatchObject({
      type: "food_pack",
      sold_by: "unit",
      storage_type: "ambient",
      included_items: ["Rice (5 kg)", "Beans (2 kg)"],
    });
  });
});
