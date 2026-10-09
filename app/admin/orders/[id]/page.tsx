"use client";

import Link from "next/link";
import { use, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { OrderStatusTimeline } from "@/components/order-status-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { ErrorState } from "@/components/ui/states";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDate, formatNaira, formatPct, profitTextClass } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { Order } from "@/lib/types";
import { AdminOrderSkeleton } from "@/components/skeletons/admin";

const NEXT_STATUSES = [
  "confirmed", "processing", "preparing", "ready_for_pickup",
  "out_for_delivery", "delivered", "cancelled",
];

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token } = useAuth();
  const { toast } = useToast();
  const { data, loading, error, refetch } = useApi<{ data: Order }>(`/admin/orders/${id}`);

  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) return <AdminOrderSkeleton />;
  if (error || !data) return <ErrorState message={error ?? undefined} />;

  const order = data.data;

  async function updateStatus() {
    if (!token || !status) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/orders/${id}/status`, {
        method: "PUT",
        token,
        body: {
          status,
          reason: status === "cancelled" ? reason : null,
          rider_name: riderName || null,
          rider_phone: riderPhone || null,
        },
      });
      toast(`Order marked ${status.replace(/_/g, " ")}`, "success");
      setStatus("");
      setReason("");
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? (err.firstError ?? err.message) : "Update failed", "error");
    } finally {
      setSaving(false);
    }
  }

  const addr = order.delivery_address;

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-brand-700 hover:underline">← All orders</Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-brand-800">{order.reference}</h1>
        <Badge tone={order.status}>{order.status_label}</Badge>
        {order.payment && <Badge tone={order.payment.status}>Payment: {order.payment.status_label}</Badge>}
        {order.has_frozen_items && <Badge className="bg-sky-100 text-sky-800">❄️ Contains frozen items</Badge>}
      </div>
      {order.has_frozen_items && (
        <p className="mt-3 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-900">
          Pack the frozen items separately in a cooler bag with ice packs, and send them on the
          customer&apos;s chosen delivery window.
        </p>
      )}
      <p className="mt-1 text-sm text-ink-soft">Placed {formatDate(order.placed_at ?? order.created_at)}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold text-brand-800">Update status</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="New status">
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">Choose…</option>
                  {NEXT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </Select>
              </Field>
              {status === "cancelled" && (
                <Field label="Cancellation reason" required>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
              )}
              {status === "out_for_delivery" && (
                <>
                  <Field label="Rider name">
                    <Input value={riderName} onChange={(e) => setRiderName(e.target.value)} />
                  </Field>
                  <Field label="Rider phone">
                    <Input value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} />
                  </Field>
                </>
              )}
            </div>
            <Button className="mt-3" onClick={updateStatus} disabled={!status || saving}>
              {saving ? "Saving…" : "Apply update"}
            </Button>
            <p className="mt-2 text-xs text-ink-soft">
              Orders move forward one step at a time. Invalid jumps are rejected.
            </p>
          </section>

          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-brand-800">Progress</h2>
            <OrderStatusTimeline steps={order.timeline} />
          </section>

          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold text-brand-800">Items</h2>
            <ul className="divide-y divide-black/5 text-sm">
              {order.items?.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-2">
                  <span>
                    {item.quantity_label} × {item.name}
                    {item.variant_name ? ` (${item.variant_name})` : ""}
                    {item.is_frozen && <span className="ml-2 text-sky-700">❄️ frozen</span>}
                  </span>
                  <span className="font-semibold">{item.line_total}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-black/10 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{order.subtotal}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd>{order.delivery_fee}</dd></div>
              <div className="flex justify-between font-bold text-brand-800"><dt>Total</dt><dd>{order.total}</dd></div>
            </dl>
          </section>
        </div>

        <aside className="space-y-4 text-sm">
          {order.profit_kobo !== undefined && order.cost_kobo !== undefined && (
            <section className="rounded-card border border-black/5 bg-white p-5">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-soft">Profit</h2>
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Products sold</dt>
                  <dd>{formatNaira(order.subtotal_kobo - order.discount_kobo)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Cost of goods</dt>
                  <dd>−{formatNaira(order.cost_kobo)}</dd>
                </div>
                <div className="flex justify-between border-t border-black/10 pt-1 text-base font-bold">
                  <dt>Profit</dt>
                  <dd className={profitTextClass(order.profit_kobo)}>
                    {formatNaira(order.profit_kobo)}
                    {order.subtotal_kobo - order.discount_kobo > 0 && (
                      <span className="ml-1 text-xs font-medium text-ink-soft">
                        ({formatPct(
                          Math.round((order.profit_kobo / (order.subtotal_kobo - order.discount_kobo)) * 1000) / 10,
                        )})
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-ink-soft">Before delivery costs and overheads.</p>
              {order.has_uncosted_items && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Some items had no cost price when sold, so this profit is overstated.
                </p>
              )}
            </section>
          )}
          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-soft">Customer</h2>
            <p className="font-semibold text-ink">{order.contact.first_name} {order.contact.last_name}</p>
            <p className="text-ink-soft">{order.contact.phone}</p>
            <p className="text-ink-soft">{order.contact.email}</p>
          </section>
          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-soft">Delivery</h2>
            <p className="text-ink-soft">
              {addr.street}, {addr.area}, {addr.city}{addr.state ? `, ${addr.state}` : ""}, {addr.country}
            </p>
            {addr.notes && <p className="mt-1 text-xs text-ink-soft">Note: {addr.notes}</p>}
            <p className="mt-2 text-ink-soft">
              {order.delivery_window.label} · {order.delivery_window.time}
              {order.delivery_window.date ? ` · ${formatDate(order.delivery_window.date)}` : ""}
            </p>
            {order.delivery?.rider_name && (
              <p className="mt-1 text-ink-soft">Rider: {order.delivery.rider_name} ({order.delivery.rider_phone})</p>
            )}
          </section>
          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-soft">Payment</h2>
            <p className="text-ink-soft">{order.payment_method_label}</p>
            {order.payment && (
              <p className="mt-1">
                <Badge tone={order.payment.status}>{order.payment.status_label}</Badge>
                <span className="ml-2 text-xs text-ink-soft">{order.payment.reference}</span>
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
