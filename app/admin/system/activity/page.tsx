"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";

import { ACTIVITY_EVENT_STYLES } from "@/components/admin/system/event-styles";
import { Pager } from "@/components/admin/system/pager";
import { useDebounced } from "@/components/admin/system/use-debounced";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { cn, formatTimestamp } from "@/lib/format";
import type { ActivityLogEntry, Paginated } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { TableSkeleton } from "@/components/ui/skeletons";

type ActivityList = Paginated<ActivityLogEntry> & { filters: { events: { value: string; label: string }[] } };

export default function ActivityLogPage() {
  const [search, setSearch] = useState("");
  const [event, setEvent] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<number | null>(null);
  const debouncedSearch = useDebounced(search);

  const path = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), per_page: "25" });
    if (debouncedSearch.trim()) p.set("search", debouncedSearch.trim());
    if (event) p.set("event", event);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return `/admin/system/activity-logs?${p.toString()}`;
  }, [debouncedSearch, event, from, to, page]);

  const { data, loading, error } = useApi<ActivityList>(path);

  function filter<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div>
      <p className="mb-4 text-sm text-ink-soft">
        What people did in the app: sign-ins (and failed ones), registrations, orders and payments. Kept for 90 days.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-ink-soft">
          Search
          <Input
            value={search}
            onChange={(e) => filter(setSearch)(e.target.value)}
            placeholder="Name, email, IP, order…"
            className="mt-1 w-56"
          />
        </label>
        <label className="text-xs font-medium text-ink-soft">
          Event
          <Select value={event} onChange={(e) => filter(setEvent)(e.target.value)} className="mt-1 w-52">
            <option value="">All events</option>
            {data?.filters.events.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-xs font-medium text-ink-soft">
          From
          <Input type="date" value={from} onChange={(e) => filter(setFrom)(e.target.value)} className="mt-1" />
        </label>
        <label className="text-xs font-medium text-ink-soft">
          To
          <Input type="date" value={to} onChange={(e) => filter(setTo)(e.target.value)} className="mt-1" />
        </label>
      </div>

      <div className="mt-4">
        {loading && !data ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState title="No activity yet" description="Sign-ins, orders and payments will appear here." />
        ) : (
          <div className="overflow-x-auto rounded-card border border-black/5 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-left text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5">When</th>
                  <th className="px-4 py-2.5">Who</th>
                  <th className="px-4 py-2.5">Event</th>
                  <th className="px-4 py-2.5">What</th>
                  <th className="px-4 py-2.5">IP</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data.data.map((entry) => {
                  const expanded = open === entry.id;
                  return (
                    <Fragment key={entry.id}>
                      <tr className={cn("align-top", expanded && "bg-brand-50/50")}>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-soft">{formatTimestamp(entry.created_at)}</td>
                        <td className="px-4 py-3">
                          {entry.user.name || entry.user.email ? (
                            <>
                              {entry.event === "login_failed" && (
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">Tried to sign in as</p>
                              )}
                              <p className="font-medium text-ink">{entry.user.name ?? entry.user.email}</p>
                              {entry.user.name && entry.user.email && <p className="text-xs text-ink-soft">{entry.user.email}</p>}
                            </>
                          ) : (
                            <p className="italic text-ink-soft">System</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={ACTIVITY_EVENT_STYLES[entry.event]}>{entry.event_label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-ink">
                          {entry.subject?.type === "Order" && entry.subject.id ? (
                            <Link href={`/admin/orders/${entry.subject.id}`} className="hover:underline">
                              {entry.description}
                            </Link>
                          ) : (
                            entry.description
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-soft">{entry.ip_address ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setOpen(expanded ? null : entry.id)}
                            className="text-xs font-semibold text-brand-700 hover:underline"
                            aria-expanded={expanded}
                          >
                            {expanded ? "Hide" : "Details"}
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-brand-50/50">
                          <td colSpan={6} className="space-y-2 px-4 pb-4 text-xs text-ink-soft">
                            {entry.properties && (
                              <pre className="overflow-x-auto rounded-lg border border-black/5 bg-white p-3 font-mono text-ink">
                                {JSON.stringify(entry.properties, null, 2)}
                              </pre>
                            )}
                            <p className="break-all">{entry.user_agent ?? "No browser information"}</p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            <Pager meta={data.meta} onPage={setPage} noun="events" />
          </div>
        )}
      </div>
    </div>
  );
}
