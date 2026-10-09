"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/states";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { AdminStats } from "@/lib/types";
import { AdminDashboardSkeleton } from "@/components/skeletons/admin";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-card border border-black/5 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-brand-800">{value}</p>
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, loading, error } = useApi<{ data: AdminStats }>("/admin/dashboard");

  if (loading) return <AdminDashboardSkeleton />;
  if (error || !data) return <ErrorState message={error ?? undefined} />;

  const s = data.data;

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-800">Dashboard</h1>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total orders" value={s.orders_total} hint={`${s.orders_today} today`} />
        <Stat label="Pending orders" value={s.orders_pending} hint="Need confirmation" />
        <Stat label="Awaiting delivery" value={s.orders_awaiting_delivery} hint="Ready or out for delivery" />
        <Stat label="Revenue (paid)" value={s.revenue} hint={`${s.revenue_today} today`} />
        <Stat label="Delivered" value={s.orders_delivered} />
        <Stat label="Products" value={s.products_total} hint={`${s.products_out_of_stock} out of stock`} />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-800">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-brand-700 hover:underline">
            All orders
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto rounded-card border border-black/5 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-2">Reference</th>
                <th className="px-4 py-2">Placed</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {s.recent_orders.map((order) => (
                <tr key={order.id} className="hover:bg-cream-50">
                  <td className="px-4 py-2">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold text-brand-700 hover:underline">
                      {order.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-ink-soft">{formatDate(order.placed_at ?? order.created_at)}</td>
                  <td className="px-4 py-2"><Badge tone={order.status}>{order.status_label}</Badge></td>
                  <td className="px-4 py-2 text-right font-semibold">{order.total}</td>
                </tr>
              ))}
              {s.recent_orders.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-soft">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
