import { apiFetch } from "./api";
import type { Category, DeliveryWindow, Paginated, Product, StoreConfig } from "./types";

// Public catalogue reads. Cached briefly so the storefront stays fast; the
// admin mutations are infrequent and a 2-minute window is acceptable for an MVP.
const catalogueCache = { next: { revalidate: 120 } } as const;

export function getStoreConfig() {
  return apiFetch<{ data: StoreConfig }>("/config", catalogueCache).then((r) => r.data);
}

export function getCategories() {
  return apiFetch<{ data: Category[] }>("/categories", catalogueCache).then((r) => r.data);
}

export function getCategory(slug: string) {
  return apiFetch<{ data: Category }>(`/categories/${slug}`, catalogueCache).then((r) => r.data);
}

export function getDeliveryWindows() {
  return apiFetch<{ data: DeliveryWindow[] }>("/delivery-windows", catalogueCache).then((r) => r.data);
}

export interface ProductQuery {
  category?: string;
  type?: "ingredient" | "meal_kit";
  storage?: "ambient" | "chilled" | "frozen";
  sold_by?: "unit" | "weight";
  search?: string;
  tag?: string;
  featured?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "name";
  per_page?: number;
  page?: number;
}

export function getProducts(query: ProductQuery = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "" || value === false) continue;
    params.set(key, value === true ? "1" : String(value));
  }
  const qs = params.toString();
  return apiFetch<Paginated<Product>>(`/products${qs ? `?${qs}` : ""}`, {
    next: { revalidate: query.search ? 0 : 120 },
  });
}

export function getProduct(slug: string) {
  return apiFetch<{ data: Product }>(`/products/${slug}`, catalogueCache).then((r) => r.data);
}
