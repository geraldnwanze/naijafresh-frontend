"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";

interface Settings {
  delivery_fee_kobo: number;
  free_delivery_threshold_kobo: number;
  cash_on_delivery_enabled: boolean;
  bank_transfer_enabled: boolean;
  store_open: boolean;
}

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const { data, loading, error, refetch } = useApi<{ data: Settings }>("/admin/settings");

  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data.data);
  }, [data]);

  if (loading || !form) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !form) return;
    setSaving(true);
    try {
      await apiFetch("/admin/settings", {
        method: "PUT",
        token,
        body: {
          delivery_fee_kobo: form.delivery_fee_kobo,
          free_delivery_threshold_kobo: form.free_delivery_threshold_kobo,
          cash_on_delivery_enabled: form.cash_on_delivery_enabled,
          bank_transfer_enabled: form.bank_transfer_enabled,
          store_open: form.store_open,
        },
      });
      toast("Settings saved", "success");
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? (err.firstError ?? err.message) : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-brand-800">Store settings</h1>
      <p className="mt-1 text-sm text-ink-soft">
        These control delivery pricing and which payment methods customers see at checkout.
      </p>

      <form onSubmit={save} className="mt-5 space-y-4 rounded-card border border-black/5 bg-white p-5">
        <Field label="Delivery fee (₦)" hint="Flat fee applied to every order.">
          <Input
            type="number"
            min="0"
            value={form.delivery_fee_kobo / 100}
            onChange={(e) => setForm({ ...form, delivery_fee_kobo: Math.round(Number(e.target.value) * 100) })}
          />
        </Field>
        <Field label="Free delivery threshold (₦)" hint="0 disables free delivery. Orders at or above this get free delivery.">
          <Input
            type="number"
            min="0"
            value={form.free_delivery_threshold_kobo / 100}
            onChange={(e) =>
              setForm({ ...form, free_delivery_threshold_kobo: Math.round(Number(e.target.value) * 100) })
            }
          />
        </Field>

        <div className="space-y-2 border-t border-black/10 pt-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.cash_on_delivery_enabled}
              onChange={(e) => setForm({ ...form, cash_on_delivery_enabled: e.target.checked })}
              className="accent-brand-700"
            />
            Offer cash on delivery
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.bank_transfer_enabled}
              onChange={(e) => setForm({ ...form, bank_transfer_enabled: e.target.checked })}
              className="accent-brand-700"
            />
            Offer bank transfer
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.store_open}
              onChange={(e) => setForm({ ...form, store_open: e.target.checked })}
              className="accent-brand-700"
            />
            Store is open for orders
          </label>
        </div>

        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
      </form>
    </div>
  );
}
