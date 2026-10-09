"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { ProductForm } from "@/components/admin/product-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ErrorState } from "@/components/ui/states";
import { apiFetch, ApiError } from "@/lib/api";
import { formatNaira, formatPct, profitTextClass } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { Category, Paginated, Product } from "@/lib/types";
import { TableSkeleton } from "@/components/ui/skeletons";

export default function AdminProductsPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [editing, setEditing] = useState<Product | null | undefined>(undefined); // undefined = closed

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const path = useMemo(
    () => `/admin/products?per_page=100${debounced ? `&search=${encodeURIComponent(debounced)}` : ""}`,
    [debounced],
  );

  const { data, loading, error, refetch } = useApi<Paginated<Product>>(path);
  const { data: categoriesData } = useApi<{ data: Category[] }>("/admin/categories");
  const categories = categoriesData?.data ?? [];

  async function remove(product: Product) {
    if (!token || !confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/admin/products/${product.id}`, { method: "DELETE", token });
      toast("Product deleted", "info");
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", "error");
    }
  }

  const formOpen = editing !== undefined;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-800">Products</h1>
        {!formOpen && (
          <Button size="sm" onClick={() => setEditing(null)}>+ New product</Button>
        )}
      </div>

      {formOpen ? (
        <div className="mt-5 rounded-card border border-black/5 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-brand-800">
            {editing ? `Edit ${editing.name}` : "New product"}
          </h2>
          <ProductForm
            categories={categories}
            product={editing}
            onCancel={() => setEditing(undefined)}
            onSaved={() => {
              setEditing(undefined);
              refetch();
            }}
          />
        </div>
      ) : (
        <>
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-4 max-w-xs"
          />

          <div className="mt-4">
            {loading ? (
              <TableSkeleton />
            ) : error ? (
              <ErrorState message={error} />
            ) : (
              <div className="overflow-x-auto rounded-card border border-black/5 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-cream-100 text-left text-xs uppercase tracking-wide text-ink-soft">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2">Cost</th>
                      <th className="px-4 py-2">Margin</th>
                      <th className="px-4 py-2">Stock</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {data?.data.map((product) => (
                      <tr key={product.id} className="hover:bg-cream-50">
                        <td className="px-4 py-2">
                          <span className="font-medium text-ink">{product.name}</span>
                          {product.is_meal_kit && <Badge className="ml-2 bg-accent-500 text-brand-900">kit</Badge>}
                          {product.is_food_pack && <Badge className="ml-2 bg-amber-100 text-amber-900">pack</Badge>}
                          {product.is_frozen && <Badge className="ml-2 bg-sky-100 text-sky-800">frozen</Badge>}
                        </td>
                        <td className="px-4 py-2 text-ink-soft">{product.category?.name}</td>
                        <td className="px-4 py-2">
                          {formatNaira(product.price_kobo)}
                          {product.is_sold_by_weight && <span className="text-xs text-ink-soft"> / kg</span>}
                        </td>
                        <td className="px-4 py-2 text-ink-soft">
                          {product.cost_price_kobo != null ? formatNaira(product.cost_price_kobo) : "—"}
                        </td>
                        <td className="px-4 py-2">
                          {product.margin_pct != null ? (
                            <span className={"font-semibold " + profitTextClass(product.profit_per_unit_kobo)}>
                              {formatPct(product.margin_pct)}
                            </span>
                          ) : (
                            <span className="text-xs text-amber-700">add cost</span>
                          )}
                        </td>
                        <td className="px-4 py-2">{product.stock_label ?? "—"}</td>
                        <td className="px-4 py-2">
                          <Badge tone={product.is_available ? "confirmed" : "cancelled"}>
                            {product.is_available ? "Available" : "Hidden"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => setEditing(product)} className="text-xs font-medium text-brand-700 hover:underline">
                            Edit
                          </button>
                          <button onClick={() => remove(product)} className="ml-3 text-xs font-medium text-rose-600 hover:underline">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
