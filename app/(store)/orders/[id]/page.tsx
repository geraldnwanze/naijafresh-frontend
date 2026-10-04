import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompletePaymentButton } from "@/components/complete-payment-button";
import { OrderStatusTimeline } from "@/components/order-status-timeline";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getToken, requireUser } from "@/lib/session";
import type { Order } from "@/lib/types";

type Params = Promise<{ id: string }>;

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  await requireUser({ returnTo: `/orders/${id}` });
  const token = await getToken();

  let order: Order;
  try {
    order = await apiFetch<{ data: Order }>(`/orders/${id}`, { token }).then((r) => r.data);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    throw error;
  }

  const address = order.delivery_address;
  const needsPayment =
    order.payment_method === "paystack" && order.payment && order.payment.status !== "paid";

  return (
    <div className="container-page py-8">
      <Link href="/orders" className="text-sm text-brand-700 hover:underline">
        ← All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-brand-800">{order.reference}</h1>
        <Badge tone={order.status}>{order.status_label}</Badge>
        {order.has_frozen_items && <Badge className="bg-sky-100 text-sky-800">❄️ Includes frozen items</Badge>}
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Placed {formatDate(order.placed_at ?? order.created_at)}
      </p>

      {order.is_cancelled && order.cancellation_reason && (
        <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          This order was cancelled: {order.cancellation_reason}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-brand-800">Progress</h2>
            <OrderStatusTimeline steps={order.timeline} />
            {order.delivery?.window_time && (
              <p className="mt-5 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                Estimated delivery: {order.delivery.window_label} ({order.delivery.window_time})
                {order.delivery.scheduled_date ? ` · ${formatDate(order.delivery.scheduled_date)}` : ""}
              </p>
            )}
            {order.delivery?.rider_name && (
              <p className="mt-2 text-sm text-ink-soft">
                Rider: {order.delivery.rider_name}
                {order.delivery.rider_phone ? ` · ${order.delivery.rider_phone}` : ""}
              </p>
            )}
          </section>

          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold text-brand-800">Items</h2>
            <ul className="divide-y divide-black/5">
              {order.items?.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    <span className="font-medium text-ink">{item.name}</span>
                    {item.variant_name ? <span className="text-ink-soft"> · {item.variant_name}</span> : null}
                    <span className="block text-xs text-ink-soft">
                      {item.sold_by === "weight"
                        ? `${item.quantity_label} × ${item.unit_price} / kg`
                        : `${item.quantity} × ${item.unit_price} / ${item.unit}`}
                      {item.is_frozen ? " · ❄️ frozen" : ""}
                    </span>
                  </span>
                  <span className="font-semibold">{item.line_total}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">Summary</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{order.subtotal}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd>{order.delivery_fee}</dd></div>
              <div className="flex justify-between border-t border-black/10 pt-1.5 text-base font-bold text-brand-800">
                <dt>Total</dt><dd>{order.total}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-ink-soft">{order.payment_method_label}</span>
              {order.payment && <Badge tone={order.payment.status}>{order.payment.status_label}</Badge>}
            </div>
            {needsPayment && (
              <div className="mt-3">
                <CompletePaymentButton orderReference={order.reference} />
              </div>
            )}
          </section>

          <section className="rounded-card border border-black/5 bg-white p-5 text-sm">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-soft">Delivery to</h2>
            <p className="font-medium text-ink">
              {order.contact.first_name} {order.contact.last_name}
            </p>
            <p className="text-ink-soft">{order.contact.phone}</p>
            <p className="mt-2 text-ink-soft">
              {address.street}, {address.area}, {address.city}
              {address.state ? `, ${address.state}` : ""}, {address.country}
            </p>
            {address.notes && <p className="mt-1 text-xs text-ink-soft">Note: {address.notes}</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
