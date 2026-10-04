"use client";

import { Fragment, useMemo, useState } from "react";

import { ChangeTable } from "@/components/admin/system/change-table";
import { Pager } from "@/components/admin/system/pager";
import { useDebounced } from "@/components/admin/system/use-debounced";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { cn, formatTimestamp } from "@/lib/format";
import type { AuditLogEntry, Paginated } from "@/lib/types";
import { useApi } from "@/lib/use-api";

type AuditList = Paginated<AuditLogEntry> & { filters: { events: string[]; models: string[] } };

const EVENT_STYLES: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-800",
  updated: "bg-amber-100 text-amber-800",
  deleted: "bg-rose-100 text-rose-700",
};

export default function AuditTrailPage() {
  const [search, setSearch] = useState("");
  const [model, setModel] = useState("");
  const [event, setEvent] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<number | null>(null);
  const debouncedSearch = useDebounced(search);

  const path = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), per_page: "25" });
    if (debouncedSearch.trim()) p.set("search", debouncedSearch.trim());
    if (model) p.set("model", model);
    if (event) p.set("event", event);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return `/admin/system/audit-logs?${p.toString()}`;
  }, [debouncedSearch, model, event, from, to, page]);

  const { data, loading, error } = useApi<AuditList>(path);

  function filter<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div>
      <p className="mb-4 text-sm text-ink-soft">
        Every change to products, prices, stock, orders, payments, settings and roles: who made it, what it was before,
        and where from. This trail can&apos;t be edited or deleted.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-ink-soft">
          Search
          <Input
            value={search}
            onChange={(e) => filter(setSearch)(e.target.value)}
            placeholder="Record, person, email…"
            className="mt-1 w-56"
          />
        </label>
        <label className="text-xs font-medium text-ink-soft">
          Record type
          <Select value={model} onChange={(e) => filter(setModel)(e.target.value)} className="mt-1 w-44">
            <option value="">All</option>
            {data?.filters.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-xs font-medium text-ink-soft">
          Action
          <Select value={event} onChange={(e) => filter(setEvent)(e.target.value)} className="mt-1 w-36">
            <option value="">All</option>
            {(data?.filters.events ?? ["created", "updated", "deleted"]).map((e) => (
              <option key={e} value={e}>
                {e}
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
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState title="No changes recorded" description="Edits made by staff will appear here." />
        ) : (
          <div className="overflow-x-auto rounded-card border border-black/5 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-left text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5">When</th>
                  <th className="px-4 py-2.5">Who</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Record</th>
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
                          <p className={cn("font-medium", entry.actor.is_system ? "italic text-ink-soft" : "text-ink")}>
                            {entry.actor.name}
                          </p>
                          {entry.actor.email && <p className="text-xs text-ink-soft">{entry.actor.email}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={EVENT_STYLES[entry.event]}>{entry.event}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">{entry.label ?? `#${entry.model_id}`}</p>
                          <p className="text-xs text-ink-soft">
                            {entry.model} #{entry.model_id}
                          </p>
                        </td>
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
                          <td colSpan={5} className="space-y-3 px-4 pb-4">
                            <ChangeTable event={entry.event} oldValues={entry.old_values} newValues={entry.new_values} />
                            <p className="text-xs text-ink-soft">
                              From {entry.ip_address ?? "unknown IP"}
                              {entry.user_agent && <span className="break-all"> · {entry.user_agent}</span>}
                            </p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            <Pager meta={data.meta} onPage={setPage} noun="changes" />
          </div>
        )}
      </div>
    </div>
  );
}
