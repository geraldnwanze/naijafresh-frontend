"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { CheckoutSummary } from "@/components/checkout-summary";
import { DeliveryWindowSelector } from "@/components/delivery-window-selector";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

import { apiFetch, ApiError } from "@/lib/api";
import { track } from "@/lib/analytics";
import type { DeliveryWindow, Order, StoreConfig } from "@/lib/types";
import { useCartPricing } from "@/lib/use-cart-pricing";
import { CheckoutSkeleton } from "@/components/skeletons/store";

interface OrderResponse {
  data: Order;
  checkout: {
    requires_redirect: boolean;
    authorization_url: string | null;
    is_mock: boolean;
    reference: string;
  };
}

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const { lines, toApiItems, clear } = useCart();
  const { toast } = useToast();
  const pricing = useCartPricing();

  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [windows, setWindows] = useState<DeliveryWindow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    street: "",
    area: "",
    city: "",
    state: "",
    notes: "",
    delivery_window_id: null as number | null,
    delivery_date: tomorrow(),
    payment_method: "" as string,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent("/checkout")}`);
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      const [firstName, ...rest] = user.name.split(" ");
      setForm((f) => ({
        ...f,
        first_name: f.first_name || firstName || "",
        last_name: f.last_name || rest.join(" "),
        email: f.email || user.email,
        phone: f.phone || user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    track("checkout_started");
    Promise.all([
      apiFetch<{ data: StoreConfig }>("/config"),
      apiFetch<{ data: DeliveryWindow[] }>("/delivery-windows"),
    ]).then(([cfg, win]) => {
      setConfig(cfg.data);
      setWindows(win.data);
      setForm((f) => ({
        ...f,
        payment_method: f.payment_method || cfg.data.payment.methods[0]?.value || "",
        delivery_window_id: f.delivery_window_id ?? win.data[0]?.id ?? null,
      }));
    });
  }, []);

  const canSubmit = useMemo(
    () => lines.length > 0 && !!form.delivery_window_id && !!form.payment_method && !submitting,
    [lines.length, form.delivery_window_id, form.payment_method, submitting],
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function placeOrder() {
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }
    setSubmitting(true);
    setErrors({});

    try {
      const res = await apiFetch<OrderResponse>("/orders", {
        method: "POST",
        token,
        body: {
          items: toApiItems(),
          contact: {
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
            email: form.email,
          },
          delivery: {
            street: form.street,
            area: form.area,
            city: form.city,
            state: form.state || null,
            country: "Nigeria",
            notes: form.notes || null,
          },
          delivery_window_id: form.delivery_window_id,
          delivery_date: form.delivery_date || null,
          payment_method: form.payment_method,
        },
      });

      track("order_placed", { reference: res.data.reference, total_kobo: res.data.total_kobo });

      if (res.checkout.requires_redirect && res.checkout.authorization_url) {
        clear();
        window.location.href = res.checkout.authorization_url;
        return;
      }

      if (res.checkout.is_mock) {
        clear();
        router.push(`/checkout/mock-pay?reference=${res.checkout.reference}`);
        return;
      }

      clear();
      toast("Order placed successfully", "success");
      router.push(`/orders/${res.data.id}?placed=1`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors);
        toast(error.firstError ?? error.message, "error");
      } else {
        toast("Could not place your order. Please try again.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return <CheckoutSkeleton />;
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-800">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <form
          className="space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            placeOrder();
          }}
        >
          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-brand-800">Contact details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" required error={errors["contact.first_name"]?.[0]}>
                <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} required />
              </Field>
              <Field label="Last name" required error={errors["contact.last_name"]?.[0]}>
                <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} required />
              </Field>
              <Field label="Phone number" required error={errors["contact.phone"]?.[0]}>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="080..." required />
              </Field>
              <Field label="Email" required error={errors["contact.email"]?.[0]}>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
              </Field>
            </div>
          </section>

          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-brand-800">Delivery address</h2>
            <div className="grid gap-4">
              <Field label="Street address" required error={errors["delivery.street"]?.[0]}>
                <Input value={form.street} onChange={(e) => set("street", e.target.value)} required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Area / neighbourhood" required error={errors["delivery.area"]?.[0]}>
                  <Input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Lekki Phase 1" required />
                </Field>
                <Field label="City" required error={errors["delivery.city"]?.[0]}>
                  <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Lagos" required />
                </Field>
                <Field label="State" error={errors["delivery.state"]?.[0]}>
                  <Input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="e.g. Lagos" />
                </Field>
                <Field label="Country">
                  <Input value="Nigeria" disabled />
                </Field>
              </div>
              <Field label="Delivery notes" hint="Landmarks, gate code, anything to help the rider.">
                <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
              </Field>
            </div>
          </section>

          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-brand-800">Delivery window</h2>
            <DeliveryWindowSelector
              windows={windows}
              value={form.delivery_window_id}
              onChange={(id) => set("delivery_window_id", id)}
            />
            <div className="mt-4 max-w-xs">
              <Field label="Preferred date" error={errors["delivery_date"]?.[0]}>
                <Input
                  type="date"
                  value={form.delivery_date}
                  min={tomorrow()}
                  onChange={(e) => set("delivery_date", e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-brand-800">Payment method</h2>
            <div className="space-y-2">
              {config?.payment.methods.map((method) => (
                <label
                  key={method.value}
                  className={
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm " +
                    (form.payment_method === method.value
                      ? "border-brand-700 bg-brand-50"
                      : "border-black/10 bg-white")
                  }
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={method.value}
                    checked={form.payment_method === method.value}
                    onChange={(e) => set("payment_method", e.target.value)}
                    className="accent-brand-700"
                  />
                  <span className="font-medium">{method.label}</span>
                  {method.value === "paystack" && config?.payment.is_mock && (
                    <span className="ml-auto rounded-full bg-accent-500/20 px-2 py-0.5 text-[11px] font-semibold text-accent-600">
                      TEST MODE
                    </span>
                  )}
                </label>
              ))}
            </div>
            {errors["payment_method"] && (
              <p className="mt-2 text-xs font-medium text-rose-600">{errors["payment_method"][0]}</p>
            )}
            {config?.payment.is_mock && form.payment_method === "paystack" && (
              <p className="mt-3 rounded-lg bg-accent-500/10 px-3 py-2 text-xs text-accent-600">
                Payments are running in test mode. No real card will be charged — you&apos;ll see a
                simulated payment screen.
              </p>
            )}
          </section>

          <Button type="submit" size="lg" fullWidth disabled={!canSubmit}>
            {submitting ? "Placing order…" : "Place order"}
          </Button>
        </form>

        <aside className="h-fit lg:sticky lg:top-24">
          <CheckoutSummary cart={pricing.data} loading={pricing.loading} />
          {pricing.data?.lines.some((line) => line.storage_type === "frozen") && (
            <div className="mt-3 rounded-card border border-sky-200 bg-sky-50 p-4 text-xs text-sky-900">
              <p className="font-semibold">❄️ Your order includes frozen items</p>
              <p className="mt-1">
                We pack them in an insulated cooler bag. Please be available during your delivery window
                so they reach you frozen, and put them in the freezer straight away.
              </p>
            </div>
          )}
          <div className="mt-3 rounded-card border border-black/5 bg-white p-4 text-xs text-ink-soft">
            Delivering to <span className="font-semibold text-ink">Nigeria</span> ·{" "}
            {windows.find((w) => w.id === form.delivery_window_id)?.label ?? "choose a window"}
          </div>
        </aside>
      </div>
    </div>
  );
}
