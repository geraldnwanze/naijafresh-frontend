import type { AppNotification, Product } from "@/lib/types";

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: "Fresh Tomatoes",
    slug: "fresh-tomatoes",
    type: "ingredient",
    is_meal_kit: false,
    is_food_pack: false,
    description: "Ripe tomatoes",
    price_kobo: 150_000,
    price: "₦1,500",
    compare_at_price_kobo: null,
    compare_at_price: null,
    unit: "basket",
    sold_by: "unit",
    is_sold_by_weight: false,
    price_label: "per basket",
    storage_type: "ambient",
    storage_label: "Ambient",
    is_frozen: false,
    image_url: null,
    tags: [],
    is_featured: false,
    is_available: true,
    in_stock: true,
    preparation_type: null,
    preparation_label: null,
    ...overrides,
  };
}

export function makeWeightProduct(overrides: Partial<Product> = {}): Product {
  return makeProduct({
    id: 2,
    name: "Parboiled Rice",
    slug: "parboiled-rice",
    price_kobo: 200_000,
    unit: "kg",
    sold_by: "weight",
    is_sold_by_weight: true,
    weight: { min_grams: 1000, step_grams: 500, max_grams: 10_000 },
    ...overrides,
  });
}

export function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: "n1",
    kind: "order_status",
    title: "Order confirmed",
    body: "We are preparing your order.",
    url: "/orders/NF-1",
    order_id: 1,
    order_reference: "NF-1",
    is_read: false,
    read_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
