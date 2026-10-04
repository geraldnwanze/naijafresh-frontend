"use client";

import { useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { apiFetch, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Category } from "@/lib/types";

const EMPTY = { name: "", description: "", is_active: true };

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const { data, loading, error, refetch } = useApi<{ data: Category[] }>("/admin/categories");

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const body = { ...form, description: form.description || null };
      await apiFetch(editingId ? `/admin/categories/${editingId}` : "/admin/categories", {
        method: editingId ? "PUT" : "POST",
        token,
        body,
      });
      toast(editingId ? "Category updated" : "Category created", "success");
      setForm(EMPTY);
      setEditingId(null);
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? (err.firstError ?? err.message) : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(category: Category) {
    if (!token || !confirm(`Delete "${category.name}"?`)) return;
    try {
      await apiFetch(`/admin/categories/${category.id}`, { method: "DELETE", token });
      toast("Category deleted", "info");
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", "error");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-800">Categories</h1>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : (
            <ul className="space-y-2">
              {data?.data.map((category) => (
                <li key={category.id} className="flex items-center justify-between gap-3 rounded-card border border-black/5 bg-white p-4">
                  <div>
                    <p className="font-semibold text-ink">
                      {category.name}
                      {!category.is_active && <Badge tone="cancelled" className="ml-2">Hidden</Badge>}
                    </p>
                    <p className="text-xs text-ink-soft">
                      /{category.slug} · {category.products_count ?? 0} products
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(category.id);
                        setForm({ name: category.name, description: category.description ?? "", is_active: category.is_active });
                      }}
                      className="text-xs font-medium text-brand-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button onClick={() => remove(category)} className="text-xs font-medium text-rose-600 hover:underline">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={save} className="h-fit space-y-3 rounded-card border border-black/5 bg-white p-5">
          <p className="text-sm font-semibold text-brand-800">{editingId ? "Edit category" : "New category"}</p>
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="accent-brand-700"
            />
            Visible in the storefront
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </Button>
            {editingId && (
              <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingId(null); setForm(EMPTY); }}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
