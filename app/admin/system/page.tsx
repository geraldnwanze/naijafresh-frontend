"use client";

import Link from "next/link";

import { ChangeTable } from "@/components/admin/system/change-table";
import { ACTIVITY_EVENT_STYLES } from "@/components/admin/system/event-styles";
import { Badge } from "@/components/ui/badge";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { cn, formatTimestamp, timeAgo } from "@/lib/format";
import type { SystemOverview } from "@/lib/types";
import { useApi } from "@/lib/use-api";


export default function SystemOverviewPage() {
  const { data: res, loading, error } = useApi<{ data: SystemOverview }>("/admin/system/overview");

  if (loading && !res) return <LoadingState />;
  if (error || !res) return <ErrorState message={error ?? undefined} />;

  const { stats, users_by_role, failed_sign_in_ips, recent_audit, recent_activity } = res.data;

  const cards = [
    { label: "Changes by staff", value: stats.audit_changes_24h, href: "/admin/system/audit", tone: "text-brand-800" },
    { label: "Sign-ins", value: stats.sign_ins_24h, href: "/admin/system/activity", tone: "text-brand-800" },
    {
      label: "Failed sign-ins",
      value: stats.failed_sign_ins_24h,
      href: "/admin/system/activity",
      tone: stats.failed_sign_ins_24h > 0 ? "text-amber-700" : "text-brand-800",
    },
    { label: "Orders placed", value: stats.orders_24h, href: "/admin/system/activity", tone: "text-brand-800" },
    {
      label: "App errors",
      value: stats.errors_24h,
      href: "/admin/system/logs",
      tone: stats.errors_24h > 0 ? "text-rose-600" : "text-emerald-700",
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-soft">Last 24 hours</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-card border border-black/5 bg-white p-4 transition hover:border-brand-300"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{card.label}</p>
              <p className={cn("mt-1 text-3xl font-extrabold", card.tone)}>{card.value}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-black/5 bg-white p-4">
          <h2 className="font-bold text-brand-800">Who has access</h2>
          <ul className="mt-3 space-y-2">
            {users_by_role.map((r) => (
              <li key={r.role} className="flex items-center justify-between text-sm">
                <span className="text-ink">{r.label}</span>
                <span className="font-bold text-brand-800">{r.count}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/system/users" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Manage roles →
          </Link>
        </section>

        <section className="rounded-card border border-black/5 bg-white p-4">
          <h2 className="font-bold text-brand-800">Repeated failed sign-ins</h2>
          {failed_sign_in_ips.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No IP address has failed to sign in 3+ times in the last day.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {failed_sign_in_ips.map((row) => (
                <li key={row.ip_address} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-ink">{row.ip_address}</span>
                  <Badge className="bg-amber-100 text-amber-800">{row.attempts} attempts</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-card border border-black/5 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-brand-800">Latest changes by staff</h2>
          <Link href="/admin/system/audit" className="text-sm font-semibold text-brand-700 hover:underline">
            Audit trail →
          </Link>
        </div>
        {recent_audit.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No changes recorded yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/5">
            {recent_audit.map((entry) => (
              <li key={entry.id} className="py-3 text-sm">
                <p className="text-ink">
                  <span className="font-semibold">{entry.actor.name}</span> {entry.event}{" "}
                  <span className="font-semibold">{entry.model}</span> {entry.label}
                </p>
                <p className="mb-2 text-xs text-ink-soft">{formatTimestamp(entry.created_at)}</p>
                <ChangeTable event={entry.event} oldValues={entry.old_values} newValues={entry.new_values} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-card border border-black/5 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-brand-800">Latest activity</h2>
          <Link href="/admin/system/activity" className="text-sm font-semibold text-brand-700 hover:underline">
            All activity →
          </Link>
        </div>
        {recent_activity.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No activity yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/5">
            {recent_activity.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                <Badge className={ACTIVITY_EVENT_STYLES[entry.event]}>{entry.event_label}</Badge>
                <span className="text-ink">{entry.description}</span>
                <span className="text-xs text-ink-soft">
                  {entry.user.name ?? entry.user.email ?? "System"} · {timeAgo(entry.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
