"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { ButtonLink } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import { apiFetch } from "@/lib/api";
import type { Order } from "@/lib/types";

function VerifyPayment() {
  const router = useRouter();
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");
  const { token, loading: authLoading } = useAuth();
  const started = useRef(false);

  const [state, setState] = useState<"verifying" | "paid" | "unpaid" | "error">("verifying");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (authLoading || !token || !reference || started.current) return;
    started.current = true;

    apiFetch<{ paid: boolean; order: Order }>("/payments/verify", {
      method: "POST",
      token,
      body: { reference },
    })
      .then((res) => {
        setOrder(res.order);
        setState(res.paid ? "paid" : "unpaid");
        if (res.paid) setTimeout(() => router.replace(`/orders/${res.order.id}?paid=1`), 1200);
      })
      .catch(() => setState("error"));
  }, [authLoading, token, reference, router]);

  if (state === "verifying") return <LoadingState label="Confirming your payment…" />;

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-card border border-black/5 bg-white p-6 text-center shadow-sm">
        {state === "paid" && (
          <>
            <p className="text-2xl">✅</p>
            <h1 className="mt-2 text-lg font-bold text-brand-800">Payment confirmed</h1>
            <p className="mt-1 text-sm text-ink-soft">Redirecting to your order…</p>
          </>
        )}
        {state === "unpaid" && (
          <>
            <p className="text-2xl">⏳</p>
            <h1 className="mt-2 text-lg font-bold text-brand-800">Payment not completed</h1>
            <p className="mt-1 text-sm text-ink-soft">
              We couldn&apos;t confirm this payment yet. You can retry from your order.
            </p>
            {order && (
              <ButtonLink href={`/orders/${order.id}`} className="mt-4">
                View order
              </ButtonLink>
            )}
          </>
        )}
        {state === "error" && (
          <>
            <p className="text-2xl">⚠️</p>
            <h1 className="mt-2 text-lg font-bold text-brand-800">Something went wrong</h1>
            <p className="mt-1 text-sm text-ink-soft">Please check your orders page in a moment.</p>
            <ButtonLink href="/orders" className="mt-4">My orders</ButtonLink>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={<LoadingState label="Confirming your payment…" />}>
      <VerifyPayment />
    </Suspense>
  );
}
