"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import { apiFetch } from "@/lib/api";
import { track } from "@/lib/analytics";
import { formatNaira } from "@/lib/format";
import type { Order, OrderPayment } from "@/lib/types";

function MockPay() {
  const router = useRouter();
  const params = useSearchParams();
  const reference = params.get("reference");
  const { token, loading: authLoading } = useAuth();

  const [payment, setPayment] = useState<OrderPayment | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "paid" | "failed">("idle");

  useEffect(() => {
    if (authLoading || !token || !reference) return;
    apiFetch<{ data: OrderPayment }>(`/payments/${reference}`, { token })
      .then((res) => setPayment(res.data))
      .catch(() => setPayment(null));
  }, [authLoading, token, reference]);

  async function decide(outcome: "success" | "fail") {
    if (!token || !reference) return;
    setStatus("processing");
    try {
      const res = await apiFetch<{ paid: boolean; order: Order }>("/payments/verify", {
        method: "POST",
        token,
        body: { reference, mock_outcome: outcome },
      });
      if (res.paid) {
        track("payment_completed", { reference });
        setStatus("paid");
        setTimeout(() => router.replace(`/orders/${res.order.id}?paid=1`), 900);
      } else {
        setStatus("failed");
      }
    } catch {
      setStatus("failed");
    }
  }

  if (authLoading) return <LoadingState />;
  if (!reference) {
    return <div className="container-page py-16 text-center text-ink-soft">Missing payment reference.</div>;
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-card border border-black/5 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-bold text-brand-800">Test payment</span>
          <span className="rounded-full bg-accent-500/20 px-2 py-0.5 text-[11px] font-bold text-accent-600">
            SIMULATION
          </span>
        </div>

        <p className="text-sm text-ink-soft">
          Paystack credentials aren&apos;t configured, so this is a simulated checkout. No real money
          moves. Choose an outcome to continue.
        </p>

        <div className="my-5 rounded-xl bg-brand-50 p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Amount due</p>
          <p className="text-2xl font-extrabold text-brand-800">
            {payment ? formatNaira(payment.amount_kobo) : "—"}
          </p>
          <p className="mt-1 text-xs text-ink-soft">Ref: {reference}</p>
        </div>

        {status === "failed" && (
          <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            Payment declined. You can try again or pay on delivery from your order page.
          </p>
        )}
        {status === "paid" && (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Payment successful. Taking you to your order…
          </p>
        )}

        <div className="grid gap-2">
          <Button
            onClick={() => decide("success")}
            disabled={status === "processing" || status === "paid"}
            size="lg"
          >
            {status === "processing" ? "Processing…" : "Approve payment"}
          </Button>
          <Button variant="outline" onClick={() => decide("fail")} disabled={status === "processing"}>
            Simulate a declined card
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MockPayPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MockPay />
    </Suspense>
  );
}
