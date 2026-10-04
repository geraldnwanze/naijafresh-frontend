import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getToken, requireUser } from "@/lib/session";
import type { Order, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage() {
  await requireUser({ returnTo: "/orders" });
  const token = await getToken();
  const { data: orders } = await apiFetch<Paginated<Order>>("/orders", { token });

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-800">My orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you place an order it'll show up here so you can track it."
          action={{ href: "/products", label: "Start shopping" }}
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="flex flex-wrap items-center gap-3 rounded-card border border-black/5 bg-white p-4 transition hover:shadow-md"
              >
                <div className="flex-1">
                  <p className="font-semibold text-ink">{order.reference}</p>
                  <p className="text-xs text-ink-soft">
                    {formatDate(order.placed_at ?? order.created_at)} ·{" "}
                    {order.items?.length ?? 0} item{(order.items?.length ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge tone={order.status}>{order.status_label}</Badge>
                <span className="font-bold text-brand-800">{order.total}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
