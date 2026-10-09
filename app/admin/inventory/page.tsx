"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ErrorState } from "@/components/ui/states";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Paginated, Product } from "@/lib/types";
import { TableSkeleton } from "@/components/ui/skeletons";

// Low-stock threshold in display units: 5 items, or 5 kg for weight-sold products.
const LOW_STOCK = 5;

export default function AdminInventoryPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [draft, setDraft] = useState<Record<number, { stock: string; available: boolean }>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const path = useMemo(() => {
    const p = new URLSearchParams({ per_page: "200" });
    if (debounced) p.set("search", debounced);
    if (lowOnly) p.set("low_stock", "1");
    return `/admin/inventory?${p.toString()}`;
  }, [debounced, lowOnly]);

  const { data, loading, error, refetch } = useApi<Paginated<Product>>(path);

  function rowValue(product: Product) {
    return draft[product.id] ?? {
      // Weight-sold stock is grams in the API; edit it in kg here.
      stock:
        product.sold_by === "weight"
          ? String(Number(((product.stock_quantity ?? 0) / 1000).toFixed(3)))
          : String(product.stock_quantity ?? 0),
      available: product.is_available,
    };
  }

  async function save(product: Product) {
    if (!token) return;
    const value = rowValue(product);
    setSavingId(product.id);
    try {
      await apiFetch(`/admin/inventory/${product.id}`, {
        method: "PUT",
        token,
        body: {
          stock_quantity:
            product.sold_by === "weight" ? Math.round(Number(value.stock) * 1000) : Number(value.stock),
          is_available: value.available,
        },
      });
      toast(`${product.name} updated`, "success");
      setDraft((d) => {
        const next = { ...d };
        delete next[product.id];
        return next;
      });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? (err.firstError ?? err.message) : "Update failed", "error");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-800">Inventory</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="accent-brand-700" />
          Low stock only (≤ {LOW_STOCK} items / {LOW_STOCK} kg)
        </label>
      </div>

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
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Stock</th>
                  <th className="px-4 py-2">Available</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data?.data.map((product) => {
                  const value = rowValue(product);
                  const stockNum = Number(value.stock);
                  const dirty = !!draft[product.id];
                  return (
                    <tr key={product.id} className="hover:bg-cream-50">
                      <td className="px-4 py-2">
                        <span className="font-medium text-ink">{product.name}</span>
                        <span className="block text-xs text-ink-soft">
                          {product.category?.name}
                          {product.is_frozen ? " · ❄️ frozen" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step={product.sold_by === "weight" ? "0.1" : "1"}
                            value={value.stock}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, [product.id]: { ...value, stock: e.target.value } }))
                            }
                            className="w-20 rounded-lg border border-black/10 px-2 py-1"
                          />
                          {product.sold_by === "weight" && <span className="text-xs text-ink-soft">kg</span>}
                          {stockNum <= LOW_STOCK && <Badge tone="pending">low</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={value.available}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, [product.id]: { ...value, available: e.target.checked } }))
                          }
                          className="accent-brand-700"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          size="sm"
                          variant={dirty ? "primary" : "outline"}
                          disabled={!dirty || savingId === product.id}
                          onClick={() => save(product)}
                        >
                          {savingId === product.id ? "Saving…" : "Save"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
