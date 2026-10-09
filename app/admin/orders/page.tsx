"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import { ErrorState, EmptyState } from "@/components/ui/states";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { Order, Paginated } from "@/lib/types";
import { TableSkeleton } from "@/components/ui/skeletons";

const STATUSES = [
  "", "pending", "confirmed", "processing", "preparing",
  "ready_for_pickup", "out_for_delivery", "delivered", "cancelled",
];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const path = useMemo(() => {
    const p = new URLSearchParams({ per_page: "50" });
    if (status) p.set("status", status);
    if (debounced) p.set("search", debounced);
    return `/admin/orders?${p.toString()}`;
  }, [status, debounced]);

  const { data, loading, error } = useApi<Paginated<Order>>(path);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-800">Orders</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search reference, name, phone, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[220px]">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s ? s.replace(/_/g, " ") : "All statuses"}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4">
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState title="No orders match" description="Try clearing the filters." />
        ) : (
          <div className="overflow-x-auto rounded-card border border-black/5 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-left text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Placed</th>
                  <th className="px-4 py-2">Payment</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data.data.map((order) => (
                  <tr key={order.id} className="hover:bg-cream-50">
                    <td className="px-4 py-2">
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand-700 hover:underline">
                        {order.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {order.contact.first_name} {order.contact.last_name}
                      <span className="block text-xs text-ink-soft">{order.contact.phone}</span>
                    </td>
                    <td className="px-4 py-2 text-ink-soft">{formatDate(order.placed_at ?? order.created_at)}</td>
                    <td className="px-4 py-2">
                      {order.payment ? (
                        <Badge tone={order.payment.status}>{order.payment.status_label}</Badge>
                      ) : (
                        <span className="text-ink-soft">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2"><Badge tone={order.status}>{order.status_label}</Badge></td>
                    <td className="px-4 py-2 text-right font-semibold">{order.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
