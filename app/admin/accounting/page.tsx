"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ProfitChart } from "@/components/admin/profit-chart";
import { ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { ErrorState } from "@/components/ui/states";
import { presetRange, RANGE_PRESETS, type RangePreset } from "@/lib/dates";
import { cn, formatNaira, formatPct, profitTextClass } from "@/lib/format";
import type { ProfitLossProductRow, ProfitLossReport, ReportBasis, ReportGroupBy } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { AdminAccountingSkeleton } from "@/components/skeletons/admin";

type ProductSort = "profit_desc" | "profit_asc" | "margin_desc" | "margin_asc";

const PRODUCT_SORTS: { value: ProductSort; label: string }[] = [
  { value: "profit_desc", label: "Highest profit" },
  { value: "profit_asc", label: "Lowest profit" },
  { value: "margin_desc", label: "Highest margin" },
  { value: "margin_asc", label: "Lowest margin" },
];

function sortProducts(rows: ProfitLossProductRow[], sort: ProductSort): ProfitLossProductRow[] {
  const margin = (r: ProfitLossProductRow, missing: number) => r.margin_pct ?? missing;

  return [...rows].sort((a, b) => {
    switch (sort) {
      case "profit_asc":
        return a.profit_kobo - b.profit_kobo;
      case "margin_desc":
        return margin(b, -Infinity) - margin(a, -Infinity);
      case "margin_asc":
        return margin(a, Infinity) - margin(b, Infinity);
      default:
        return b.profit_kobo - a.profit_kobo;
    }
  });
}

function Kpi({
  label,
  value,
  hint,
  valueClass,
}: {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-card border border-black/5 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className={cn("mt-1 text-2xl font-extrabold text-brand-800", valueClass)}>{value}</p>
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

function StatementRow({
  label,
  kobo,
  tone = "line",
  note,
  negate = false,
}: {
  label: string;
  kobo: number;
  tone?: "line" | "sub" | "total";
  note?: string;
  /** Show the amount as a deduction. */
  negate?: boolean;
}) {
  const shown = negate ? -kobo : kobo;

  return (
    <tr
      className={cn(
        tone === "sub" && "bg-cream-100 font-semibold",
        tone === "total" && "border-t-2 border-black/15 bg-brand-50 text-base font-extrabold",
      )}
    >
      <td className={cn("px-4 py-2", tone === "line" && "pl-8 text-ink-soft")}>
        {label}
        {note && <span className="ml-2 text-xs font-medium text-ink-soft">{note}</span>}
      </td>
      <td
        className={cn(
          "px-4 py-2 text-right tabular-nums",
          tone === "total" && profitTextClass(shown),
          tone === "sub" && shown < 0 && "text-rose-600",
        )}
      >
        {formatNaira(shown, { withDecimals: true })}
      </td>
    </tr>
  );
}

export default function AccountingPage() {
  const initial = presetRange("last_30");

  const [preset, setPreset] = useState<RangePreset>("last_30");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [basis, setBasis] = useState<ReportBasis>("delivered");
  const [groupBy, setGroupBy] = useState<ReportGroupBy | "auto">("auto");
  const [sort, setSort] = useState<ProductSort>("profit_desc");
  const [showAllProducts, setShowAllProducts] = useState(false);

  const path = useMemo(() => {
    const params = new URLSearchParams({ from, to, basis });
    if (groupBy !== "auto") params.set("group_by", groupBy);
    return `/admin/accounting/profit-loss?${params.toString()}`;
  }, [from, to, basis, groupBy]);

  const { data, loading, error } = useApi<{ data: ProfitLossReport }>(from <= to ? path : null);
  const report = data?.data;

  function choosePreset(next: Exclude<RangePreset, "custom">) {
    const range = presetRange(next);
    setPreset(next);
    setFrom(range.from);
    setTo(range.to);
  }

  const products = useMemo(() => (report ? sortProducts(report.by_product, sort) : []), [report, sort]);
  const visibleProducts = showAllProducts ? products : products.slice(0, 10);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-800">Accounting</h1>
          <p className="text-sm text-ink-soft">Profit &amp; loss, from your sales, cost prices and expenses.</p>
        </div>
        <ButtonLink href="/admin/expenses" variant="outline" size="sm">
          Manage expenses →
        </ButtonLink>
      </div>

      {/* Controls */}
      <div className="mt-5 space-y-3 rounded-card border border-black/5 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => choosePreset(p.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                preset === p.value ? "bg-brand-700 text-white" : "bg-cream-100 text-ink-soft hover:bg-brand-50",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-ink-soft">
            From
            <Input
              type="date"
              value={from}
              max={to}
              onChange={(e) => {
                setFrom(e.target.value);
                setPreset("custom");
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
                setPreset("custom");
              }}
              className="mt-1 w-40"
            />
          </label>

          <div
            className="flex rounded-full bg-cream-100 p-0.5"
            title="Delivered: orders delivered in the range. All placed: every non-cancelled order placed in the range."
          >
            {(
              [
                ["delivered", "Delivered orders"],
                ["placed", "All placed orders"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setBasis(value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  basis === value ? "bg-brand-700 text-white" : "text-ink-soft",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="text-xs font-medium text-ink-soft">
            Trend
            <Select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as ReportGroupBy | "auto")}
              className="mt-1 w-32"
            >
              <option value="auto">Auto</option>
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </Select>
          </label>
        </div>

        {from > to && <p className="text-sm text-rose-600">The start date must be on or before the end date.</p>}
      </div>

      {!report && loading && <AdminAccountingSkeleton />}
      {error && !report && (
        <div className="mt-5">
          <ErrorState message={error} />
        </div>
      )}

      {report && (
        <div className={cn("mt-5 space-y-6 transition-opacity", loading && "opacity-60")}>
          {report.cost_coverage.uncosted_lines > 0 && (
            <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong>
                {report.cost_coverage.uncosted_lines} sold item{report.cost_coverage.uncosted_lines === 1 ? "" : "s"}
              </strong>{" "}
              worth {formatNaira(report.cost_coverage.uncosted_sales_kobo)} had no cost price, so their cost is
              counted as ₦0 and profit is overstated.{" "}
              <Link href="/admin/products" className="font-semibold underline">
                Add cost prices →
              </Link>
            </div>
          )}

          {/* KPIs */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              label="Revenue"
              value={formatNaira(report.summary.revenue_kobo)}
              hint={`${report.summary.orders} order${report.summary.orders === 1 ? "" : "s"} · avg ${formatNaira(report.summary.average_order_value_kobo)}`}
            />
            <Kpi
              label="Gross profit"
              value={formatNaira(report.summary.gross_profit_kobo)}
              valueClass={profitTextClass(report.summary.gross_profit_kobo)}
              hint={`${formatPct(report.summary.gross_margin_pct)} margin`}
            />
            <Kpi
              label="Expenses"
              value={formatNaira(report.summary.expenses_kobo)}
              hint={`${report.expenses_by_category.length} categor${report.expenses_by_category.length === 1 ? "y" : "ies"}`}
            />
            <Kpi
              label={report.summary.net_profit_kobo < 0 ? "Net loss" : "Net profit"}
              value={formatNaira(report.summary.net_profit_kobo)}
              valueClass={profitTextClass(report.summary.net_profit_kobo)}
              hint={`${formatPct(report.summary.net_margin_pct)} net margin`}
            />
          </div>

          {/* Trend */}
          <section className="rounded-card border border-black/5 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold text-brand-800">Trend</h2>
            <ProfitChart series={report.series} groupBy={report.period.group_by} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* P&L statement */}
            <section className="overflow-hidden rounded-card border border-black/5 bg-white">
              <h2 className="px-5 pb-2 pt-5 text-lg font-bold text-brand-800">Profit &amp; loss statement</h2>
              <p className="px-5 pb-3 text-xs text-ink-soft">
                {report.period.from} to {report.period.to} ·{" "}
                {report.period.basis === "delivered" ? "delivered orders" : "all placed orders"}
              </p>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-black/5">
                  <StatementRow label="Product sales" kobo={report.summary.product_sales_kobo} />
                  <StatementRow label="Discounts given" kobo={report.summary.discounts_kobo} negate />
                  <StatementRow label="Delivery fees collected" kobo={report.summary.delivery_fees_kobo} />
                  <StatementRow label="Total revenue" kobo={report.summary.revenue_kobo} tone="sub" />
                  <StatementRow label="Cost of goods sold" kobo={report.summary.cogs_kobo} negate />
                  <StatementRow
                    label="Gross profit"
                    kobo={report.summary.gross_profit_kobo}
                    tone="sub"
                    note={formatPct(report.summary.gross_margin_pct)}
                  />
                  {report.expenses_by_category.map((expense) => (
                    <StatementRow key={expense.category} label={expense.label} kobo={expense.amount_kobo} negate />
                  ))}
                  <StatementRow label="Total expenses" kobo={report.summary.expenses_kobo} tone="sub" negate />
                  <StatementRow
                    label={report.summary.net_profit_kobo < 0 ? "Net loss" : "Net profit"}
                    kobo={report.summary.net_profit_kobo}
                    tone="total"
                    note={formatPct(report.summary.net_margin_pct)}
                  />
                </tbody>
              </table>
            </section>

            {/* Expense breakdown */}
            <section className="rounded-card border border-black/5 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-800">Where the money goes</h2>
                <Link href="/admin/expenses" className="text-sm font-semibold text-brand-700 hover:underline">
                  Expenses
                </Link>
              </div>
              {report.expenses_by_category.length === 0 ? (
                <p className="mt-3 text-sm text-ink-soft">No expenses recorded for this period.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {report.expenses_by_category.map((expense) => {
                    const share =
                      report.summary.expenses_kobo > 0
                        ? (expense.amount_kobo / report.summary.expenses_kobo) * 100
                        : 0;
                    return (
                      <li key={expense.category}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-ink">{expense.label}</span>
                          <span className="tabular-nums text-ink-soft">
                            {formatNaira(expense.amount_kobo)} · {Math.round(share)}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-black/5">
                          <div className="h-2 rounded-full bg-accent-500" style={{ width: `${share}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* Product profitability */}
          <section className="rounded-card border border-black/5 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
              <div>
                <h2 className="text-lg font-bold text-brand-800">Product profitability</h2>
                <p className="text-xs text-ink-soft">
                  Sales less cost price. Excludes delivery fees, discounts and overheads.
                </p>
              </div>
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value as ProductSort)}
                className="w-44"
                aria-label="Sort products"
              >
                {PRODUCT_SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            {products.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-ink-soft">No sales in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-cream-100 text-left text-xs uppercase tracking-wide text-ink-soft">
                    <tr>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2 text-right">Sold</th>
                      <th className="px-4 py-2 text-right">Revenue</th>
                      <th className="px-4 py-2 text-right">Cost</th>
                      <th className="px-4 py-2 text-right">Profit</th>
                      <th className="px-4 py-2 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {visibleProducts.map((row) => (
                      <tr key={`${row.product_id}-${row.name}`} className="hover:bg-cream-50">
                        <td className="px-4 py-2">
                          <span className="font-medium text-ink">{row.name}</span>
                          <span className="block text-xs text-ink-soft">{row.category}</span>
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{row.quantity_label}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatNaira(row.revenue_kobo)}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-ink-soft">{formatNaira(row.cost_kobo)}</td>
                        <td className={cn("px-4 py-2 text-right font-semibold tabular-nums", profitTextClass(row.profit_kobo))}>
                          {formatNaira(row.profit_kobo)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {row.margin_pct === null ? (
                            <span className="text-xs text-amber-700">no cost</span>
                          ) : (
                            <span className={profitTextClass(row.profit_kobo)}>{formatPct(row.margin_pct)}</span>
                          )}
                          {row.has_uncosted && row.margin_pct !== null && (
                            <span className="ml-1 text-amber-700" title="Some sales of this product had no cost price">
                              *
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {products.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllProducts((v) => !v)}
                className="w-full border-t border-black/5 px-5 py-3 text-left text-sm font-semibold text-brand-700 hover:bg-cream-50"
              >
                {showAllProducts ? "Show top 10 only" : `Show all ${products.length} products`}
              </button>
            )}
          </section>

          {/* Category profitability */}
          {report.by_category.length > 0 && (
            <section className="rounded-card border border-black/5 bg-white">
              <h2 className="p-5 pb-3 text-lg font-bold text-brand-800">Profit by category</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-cream-100 text-left text-xs uppercase tracking-wide text-ink-soft">
                    <tr>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2 text-right">Revenue</th>
                      <th className="px-4 py-2 text-right">Cost</th>
                      <th className="px-4 py-2 text-right">Profit</th>
                      <th className="px-4 py-2 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {report.by_category.map((row) => (
                      <tr key={row.category} className="hover:bg-cream-50">
                        <td className="px-4 py-2 font-medium text-ink">{row.category}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatNaira(row.revenue_kobo)}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-ink-soft">{formatNaira(row.cost_kobo)}</td>
                        <td className={cn("px-4 py-2 text-right font-semibold tabular-nums", profitTextClass(row.profit_kobo))}>
                          {formatNaira(row.profit_kobo)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatPct(row.margin_pct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
