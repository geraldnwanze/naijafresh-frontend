"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { LoadingState } from "@/components/ui/states";
import { apiFetch, ApiError } from "@/lib/api";
import type { Address } from "@/lib/types";

const EMPTY_ADDRESS = {
  label: "",
  first_name: "",
  last_name: "",
  phone: "",
  street: "",
  area: "",
  city: "",
  state: "",
  notes: "",
  is_default: false,
};

export default function AccountPage() {
  const { user, token, loading, logout, refresh } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState({ name: "", email: "", phone: "", password: "", password_confirmation: "", current_password: "" });
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<typeof EMPTY_ADDRESS>(EMPTY_ADDRESS);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile((p) => ({ ...p, name: user.name, email: user.email, phone: user.phone ?? "" }));
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    apiFetch<{ data: Address[] }>("/addresses", { token })
      .then((r) => setAddresses(r.data))
      .catch(() => setAddresses([]));
  }, [token]);

  if (loading) return <LoadingState />;
  if (!user) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-ink-soft">Please sign in to view your account.</p>
        <Link href="/login?next=/account" className="mt-3 inline-block font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingProfile(true);
    setProfileErrors({});
    try {
      await apiFetch("/account/profile", {
        method: "PUT",
        token,
        body: {
          name: profile.name,
          email: profile.email,
          phone: profile.phone || null,
          ...(profile.password
            ? { password: profile.password, password_confirmation: profile.password_confirmation, current_password: profile.current_password }
            : {}),
        },
      });
      await refresh();
      setProfile((p) => ({ ...p, password: "", password_confirmation: "", current_password: "" }));
      toast("Profile updated", "success");
    } catch (err) {
      if (err instanceof ApiError) {
        setProfileErrors(err.errors);
        toast(err.firstError ?? err.message, "error");
      }
    } finally {
      setSavingProfile(false);
    }
  }

  function editAddress(address: Address) {
    setEditingId(address.id);
    setForm({
      label: address.label ?? "",
      first_name: address.first_name,
      last_name: address.last_name,
      phone: address.phone,
      street: address.street,
      area: address.area,
      city: address.city,
      state: address.state ?? "",
      notes: address.notes ?? "",
      is_default: address.is_default,
    });
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingAddress(true);
    try {
      const body = { ...form, state: form.state || null, label: form.label || null, notes: form.notes || null };
      if (editingId) {
        await apiFetch(`/addresses/${editingId}`, { method: "PUT", token, body });
      } else {
        await apiFetch("/addresses", { method: "POST", token, body });
      }
      const r = await apiFetch<{ data: Address[] }>("/addresses", { token });
      setAddresses(r.data);
      setForm(EMPTY_ADDRESS);
      setEditingId(null);
      toast("Address saved", "success");
    } catch (err) {
      toast(err instanceof ApiError ? (err.firstError ?? err.message) : "Could not save address.", "error");
    } finally {
      setSavingAddress(false);
    }
  }

  async function deleteAddress(id: number) {
    if (!token) return;
    await apiFetch(`/addresses/${id}`, { method: "DELETE", token });
    setAddresses((a) => a.filter((x) => x.id !== id));
    toast("Address removed", "info");
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-800">My account</h1>
        <Button variant="outline" size="sm" onClick={logout}>Sign out</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-black/5 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-brand-800">Profile</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Full name" required error={profileErrors.name?.[0]}>
              <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required />
            </Field>
            <Field label="Email" required error={profileErrors.email?.[0]}>
              <Input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} required />
            </Field>
            <Field label="Phone" error={profileErrors.phone?.[0]}>
              <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
            </Field>

            <details className="rounded-lg bg-brand-50/60 p-3 text-sm">
              <summary className="cursor-pointer font-medium text-brand-800">Change password</summary>
              <div className="mt-3 space-y-3">
                <Field label="Current password" error={profileErrors.current_password?.[0]}>
                  <Input type="password" value={profile.current_password} onChange={(e) => setProfile((p) => ({ ...p, current_password: e.target.value }))} autoComplete="current-password" />
                </Field>
                <Field label="New password" error={profileErrors.password?.[0]}>
                  <Input type="password" value={profile.password} onChange={(e) => setProfile((p) => ({ ...p, password: e.target.value }))} autoComplete="new-password" />
                </Field>
                <Field label="Confirm new password">
                  <Input type="password" value={profile.password_confirmation} onChange={(e) => setProfile((p) => ({ ...p, password_confirmation: e.target.value }))} autoComplete="new-password" />
                </Field>
              </div>
            </details>

            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving…" : "Save profile"}
            </Button>
          </form>

          <Link href="/orders" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">
            View my orders →
          </Link>
        </section>

        <section className="rounded-card border border-black/5 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-brand-800">Saved addresses</h2>

          <ul className="space-y-2">
            {addresses.map((address) => (
              <li key={address.id} className="rounded-xl border border-black/10 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">
                      {address.label || `${address.first_name} ${address.last_name}`}
                      {address.is_default && (
                        <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="text-ink-soft">
                      {address.street}, {address.area}, {address.city}
                      {address.state ? `, ${address.state}` : ""}
                    </p>
                    <p className="text-ink-soft">{address.phone}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => editAddress(address)} className="text-xs font-medium text-brand-700 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => deleteAddress(address.id)} className="text-xs font-medium text-rose-600 hover:underline">
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {addresses.length === 0 && <li className="text-sm text-ink-soft">No saved addresses yet.</li>}
          </ul>

          <form onSubmit={saveAddress} className="mt-4 space-y-3 border-t border-black/10 pt-4">
            <p className="text-sm font-semibold text-ink">{editingId ? "Edit address" : "Add an address"}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Label"><Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Home" /></Field>
              <Field label="Phone" required><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required /></Field>
              <Field label="First name" required><Input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} required /></Field>
              <Field label="Last name" required><Input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} required /></Field>
            </div>
            <Field label="Street" required><Input value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} required /></Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Area" required><Input value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} required /></Field>
              <Field label="City" required><Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required /></Field>
              <Field label="State"><Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                className="accent-brand-700"
              />
              Set as default delivery address
            </label>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={savingAddress}>
                {savingAddress ? "Saving…" : editingId ? "Update address" : "Add address"}
              </Button>
              {editingId && (
                <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingId(null); setForm(EMPTY_ADDRESS); }}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
