import { formatNaira } from "@/lib/format";
import type { PricedCart } from "@/lib/types";

export function CheckoutSummary({ cart, loading }: { cart: PricedCart | null; loading?: boolean }) {
  return (
    <div className="rounded-card border border-black/5 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-brand-800">Order summary</h2>

      {loading && !cart ? (
        <p className="mt-4 text-sm text-ink-soft">Calculating…</p>
      ) : cart ? (
        <>
          <ul className="mt-4 divide-y divide-black/5 text-sm">
            {cart.lines.map((line) => (
              <li key={`${line.product_id}-${line.variant_id ?? "base"}`} className="flex justify-between gap-3 py-2">
                <span className="text-ink-soft">
                  {line.quantity_label} × {line.name}
                  {line.variant_name ? ` (${line.variant_name})` : ""}
                  {line.storage_type === "frozen" && <span className="ml-1 text-sky-700">· ❄️ frozen</span>}
                  {!line.in_stock && <span className="ml-1 text-rose-600">· unavailable</span>}
                </span>
                <span className="shrink-0 font-medium">{formatNaira(line.line_total_kobo)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-3 space-y-2 border-t border-black/10 pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="font-semibold">{formatNaira(cart.subtotal_kobo)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Delivery fee</dt>
              <dd className="font-semibold">
                {cart.delivery_fee_kobo === 0 ? "Free" : formatNaira(cart.delivery_fee_kobo)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-2 text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-extrabold text-brand-800">{formatNaira(cart.total_kobo)}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">Your cart is empty.</p>
      )}
    </div>
  );
}
