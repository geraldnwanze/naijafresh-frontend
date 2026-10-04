"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export function CompletePaymentButton({ orderReference }: { orderReference: string }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch<{
        checkout: { requires_redirect: boolean; authorization_url: string | null; is_mock: boolean; reference: string };
      }>("/payments/initialize", {
        method: "POST",
        token,
        body: { order_reference: orderReference },
      });

      if (res.checkout.requires_redirect && res.checkout.authorization_url) {
        window.location.href = res.checkout.authorization_url;
      } else if (res.checkout.is_mock) {
        router.push(`/checkout/mock-pay?reference=${res.checkout.reference}`);
      } else {
        toast("This order doesn't need an online payment.", "info");
      }
    } catch {
      toast("Could not start the payment. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={start} disabled={loading} size="sm">
      {loading ? "Starting…" : "Complete payment"}
    </Button>
  );
}
