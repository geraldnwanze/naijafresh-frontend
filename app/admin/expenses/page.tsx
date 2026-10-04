"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { apiFetch, ApiError } from "@/lib/api";
import { presetRange, RANGE_PRESETS, toYmd, type RangePreset } from "@/lib/dates";
import { cn, formatNaira } from "@/lib/format";
import type { Expense, Paginated } from "@/lib/types";
import { useApi } from "@/lib/use-api";

interface ExpenseList extends Paginated<Expense> {
  summary: { total_kobo: number };
  categories: { value: string; label: string }[];
}

type Filter = RangePreset | "all";

interface FormState {
  category: string;
  description: string;
  amount_naira: string;
  incurred_on: string;
  notes: string;
}

const blankForm = (category = "other"): FormState => ({
  category,
  description: "",
  amount_naira: "",
  incurred_on: toYmd(new Date()),
  notes: "",
});

export default function AdminExpensesPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const initial = presetRange("this_month");
  const [filter, setFilter] = useState<Filter>("this_month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Expense | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const path = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), per_page: "25" });
    if (filter !== "all") {
      params.set("from", from);
      params.set("to", to);
    }
    if (category) params.set("category", category);
    if (search.trim()) params.set("search", search.trim());
    return `/admin/expenses?${params.toString()}`;
  }, [filter, from, to, category, search, page]);

  const { data, loading, error, refetch } = useApi<ExpenseList>(path);
  const categories = data?.categories ?? [];

  function choose(next: Filter) {
    setFilter(next);
    setPage(1);
    if (next !== "all" && next !== "custom") {
      const range = presetRange(next);
      setFrom(range.from);
      setTo(range.to);
    }
  }

  function openNew() {
    setEditing(null);
    setForm(blankForm(categories[0]?.value));
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditing(expense);
    setForm({
      category: expense.category,
      description: expense.description,
      amount_naira: String(expense.amount_kobo / 100),
      incurred_on: expense.incurred_on,
      notes: expense.notes ?? "",
    });
    setErrors({});
    setFormOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setErrors({});
    try {
      await apiFetch(editing ? `/admin/expenses/${editing.id}` : "/admin/expenses", {
        method: editing ? "PUT" : "POST",
        token,
        body: {
          category: form.category,
          description: form.description,
          amount_kobo: Math.round(Number(form.amount_naira) * 100),
          incurred_on: form.incurred_on,
          notes: form.notes || null,
        },
      });
      toast(editing ? "Expense updated" : "Expense recorded", "success");
      setFormOpen(false);
      setEditing(null);
      refetch();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors);
        toast(err.firstError ?? err.message, "error");
      } else {
        toast("Could not save the expense.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(expense: Expense) {
    if (!token || !confirm(`Delete "${expense.description}" (${formatNaira(expense.amount_kobo)})?`)) return;
    try {
      await apiFetch(`/admin/expenses/${expense.id}`, { method: "DELETE", token });
      toast("Expense deleted", "info");
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", "error");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-800">Expenses</h1>
          <p className="text-sm text-ink-soft">
            Rent, riders, packaging and other running costs. They feed the{" "}
            <Link href="/admin/accounting" className="font-semibold text-brand-700 hover:underline">
              profit &amp; loss
            </Link>
            .
          </p>
        </div>
        {!formOpen && (
          <Button size="sm" onClick={openNew}>
            + Add expense
          </Button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={save} className="mt-5 space-y-4 rounded-card border border-black/5 bg-white p-5">
          <h2 className="text-lg font-bold text-brand-800">{editing ? "Edit expense" : "New expense"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" required error={errors.category?.[0]}>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date" required error={errors.incurred_on?.[0]}>
              <Input
                type="date"
                value={form.incurred_on}
                onChange={(e) => setForm({ ...form, incurred_on: e.target.value })}
                required
              />
            </Field>
            <Field label="Description" required error={errors.description?.[0]}>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Rider payouts, week 40"
                required
              />
            </Field>
            <Field label="Amount (₦)" required error={errors.amount_kobo?.[0]}>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={form.amount_naira}
                onChange={(e) => setForm({ ...form, amount_naira: e.target.value })}
                required
              />
            </Field>
          </div>
          <Field label="Notes" error={errors.notes?.[0]}>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Record expense"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFormOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="mt-5 space-y-3 rounded-card border border-black/5 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => choose(p.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                filter === p.value ? "bg-brand-700 text-white" : "bg-cream-100 text-ink-soft hover:bg-brand-50",
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => choose("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              filter === "all" ? "bg-brand-700 text-white" : "bg-cream-100 text-ink-soft hover:bg-brand-50",
            )}
          >
            All time
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {filter !== "all" && (
            <>
              <label className="text-xs font-medium text-ink-soft">
                From
                <Input
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setFilter("custom");
                    setPage(1);
                  }}
                  className="mt-1 w-40"
                />
              </label>
              <label className="text-xs font-medium text-ink-soft">
                To
                <Input
                  type="date"
                  value={to}
                  min={from}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setFilter("custom");
                    setPage(1);
                  }}
                  className="mt-1 w-40"
                />
              </label>
            </>
          )}
          <label className="text-xs font-medium text-ink-soft">
            Category
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-48"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-xs font-medium text-ink-soft">
            Search
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Description…"
              className="mt-1 w-48"
            />
          </label>
          {data && (
            <p className="ml-auto text-sm text-ink-soft">
              Total <span className="text-lg font-extrabold text-brand-800">{formatNaira(data.summary.total_kobo)}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        {!data && loading ? (
          <LoadingState />
        ) : error && !data ? (
          <ErrorState message={error} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="No expenses found"
            description="Record your rent, rider payouts, packaging and other running costs to see true profit."
          />
        ) : (
          <div className={cn("overflow-x-auto rounded-card border border-black/5 bg-white", loading && "opacity-60")}>
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-left text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data.data.map((expense) => (
                  <tr key={expense.id} className="hover:bg-cream-50">
                    <td className="whitespace-nowrap px-4 py-2 text-ink-soft">
                      {new Date(`${expense.incurred_on}T00:00:00`).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2">
                      <Badge>{expense.category_label}</Badge>
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-medium text-ink">{expense.description}</span>
                      {expense.notes && <span className="block text-xs text-ink-soft">{expense.notes}</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right font-semibold tabular-nums">
                      {formatNaira(expense.amount_kobo)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      <button onClick={() => openEdit(expense)} className="text-xs font-medium text-brand-700 hover:underline">
                        Edit
                      </button>
                      <button onClick={() => remove(expense)} className="ml-3 text-xs font-medium text-rose-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data.meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-black/5 px-4 py-3 text-sm">
                <span className="text-ink-soft">
                  Page {data.meta.current_page} of {data.meta.last_page} · {data.meta.total} expenses
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= data.meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
