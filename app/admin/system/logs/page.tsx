"use client";

import { useEffect, useMemo, useState } from "react";

import { Pager } from "@/components/admin/system/pager";
import { useDebounced } from "@/components/admin/system/use-debounced";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { cn, formatTimestamp } from "@/lib/format";
import type { AppLogEntry, AppLogFile, LogLevel, Paginated } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { TableSkeleton } from "@/components/ui/skeletons";

type LogList = Paginated<AppLogEntry> & {
  file: string | null;
  files: AppLogFile[];
  levels: LogLevel[];
  counts: Record<LogLevel, number>;
  truncated: boolean;
};

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: "bg-zinc-100 text-zinc-600",
  info: "bg-sky-100 text-sky-800",
  notice: "bg-sky-100 text-sky-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-rose-100 text-rose-700",
  critical: "bg-rose-600 text-white",
  alert: "bg-rose-600 text-white",
  emergency: "bg-rose-800 text-white",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ApplicationLogsPage() {
  const [file, setFile] = useState("");
  const [level, setLevel] = useState<LogLevel | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [live, setLive] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const debouncedSearch = useDebounced(search);

  const path = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), per_page: "25" });
    if (file) p.set("file", file);
    if (level) p.set("level", level);
    if (debouncedSearch.trim()) p.set("search", debouncedSearch.trim());
    return `/admin/system/application-logs?${p.toString()}`;
  }, [file, level, debouncedSearch, page]);

  const { data, loading, error, refetch } = useApi<LogList>(path);

  // "Live" re-reads the file every 10 seconds, like tailing it.
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(refetch, 10_000);
    return () => clearInterval(timer);
  }, [live, refetch]);

  function reset<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
      setOpen(null);
    };
  }

  return (
    <div>
      <p className="mb-4 text-sm text-ink-soft">
        Errors, warnings and notices from the Laravel log (read-only). Newest first. Use it to see why a payment or an
        email failed.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        {data && data.files.length > 1 && (
          <label className="text-xs font-medium text-ink-soft">
            File
            <Select value={file || data.file || ""} onChange={(e) => reset(setFile)(e.target.value)} className="mt-1 w-60">
              {data.files.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name} ({formatBytes(f.size)})
                </option>
              ))}
            </Select>
          </label>
        )}
        <label className="text-xs font-medium text-ink-soft">
          Search
          <Input
            value={search}
            onChange={(e) => reset(setSearch)(e.target.value)}
            placeholder="Message or stack trace…"
            className="mt-1 w-64"
          />
        </label>
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} className="accent-brand-700" />
            Live
          </label>
          <Button size="sm" variant="outline" onClick={refetch}>
            Refresh
          </Button>
        </div>
      </div>

      {data && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by level">
          <button
            type="button"
            onClick={() => reset(setLevel)("")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              level === "" ? "bg-brand-700 text-white" : "bg-white text-ink-soft hover:bg-brand-50",
            )}
          >
            All
          </button>
          {data.levels.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => reset(setLevel)(level === l ? "" : l)}
              disabled={data.counts[l] === 0 && level !== l}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold capitalize disabled:opacity-40",
                level === l ? "bg-brand-700 text-white" : "bg-white text-ink-soft hover:bg-brand-50",
              )}
            >
              {l} <span className="opacity-70">{data.counts[l]}</span>
            </button>
          ))}
        </div>
      )}

      {data?.truncated && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          This file is large, so only the newest entries are shown.
        </p>
      )}

      <div className="mt-4">
        {loading && !data ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title={data?.file ? "No matching log entries" : "No log files yet"}
            description={data?.file ? "Try a different level or search." : "Nothing has been logged — that's a good sign."}
          />
        ) : (
          <div className="rounded-card border border-black/5 bg-white">
            <ul className="divide-y divide-black/5">
              {data.data.map((entry, index) => {
                const expanded = open === index;
                return (
                  <li key={`${entry.time}-${index}`} className={cn(expanded && "bg-brand-50/50")}>
                    <button
                      type="button"
                      disabled={!entry.details}
                      onClick={() => setOpen(expanded ? null : index)}
                      aria-expanded={expanded}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left disabled:cursor-default"
                    >
                      <span
                        className={cn(
                          "mt-0.5 w-20 shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-bold uppercase",
                          LEVEL_STYLES[entry.level] ?? "bg-zinc-100 text-zinc-600",
                        )}
                      >
                        {entry.level}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block break-words text-sm text-ink">{entry.message}</span>
                        <span className="mt-0.5 block text-xs text-ink-soft">
                          {formatTimestamp(entry.time)} · {entry.environment}
                          {entry.details && <span className="ml-2 font-semibold text-brand-700">{expanded ? "Hide details" : "Show details"}</span>}
                        </span>
                      </span>
                    </button>
                    {expanded && entry.details && (
                      <pre className="mx-4 mb-4 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-black/5 bg-white p-3 font-mono text-xs text-ink">
                        {entry.details}
                      </pre>
                    )}
                  </li>
                );
              })}
            </ul>
            <Pager meta={data.meta} onPage={(p) => { setPage(p); setOpen(null); }} noun="entries" />
          </div>
        )}
      </div>
    </div>
  );
}
