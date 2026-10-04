/** Format an integer number of kobo as Naira, e.g. 1250000 -> "₦12,500". */
export function formatNaira(kobo: number, opts: { withDecimals?: boolean } = {}): string {
  const sign = kobo < 0 ? "−" : "";
  const naira = Math.abs(kobo) / 100;
  const fractionDigits = opts.withDecimals || !Number.isInteger(naira) ? 2 : 0;
  return `${sign}₦${naira.toLocaleString("en-NG", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  })}`;
}

/** 18 -> "18%", 52.4 -> "52.4%", null -> "—". */
export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value < 0 ? "−" : ""}${Math.abs(value)}%`;
}

/** Tailwind text colour for a profit/loss figure. */
export function profitTextClass(kobo: number | null | undefined): string {
  if (kobo === null || kobo === undefined || kobo === 0) return "text-ink";
  return kobo > 0 ? "text-emerald-700" : "text-rose-600";
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "4 Oct 2026, 14:03:09" — logs need the year and seconds. */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** "just now", "5m ago", "3h ago", "2d ago", otherwise the date. */
export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "";
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-brand-100 text-brand-700",
  processing: "bg-brand-100 text-brand-700",
  preparing: "bg-brand-100 text-brand-700",
  ready_for_pickup: "bg-sky-100 text-sky-800",
  out_for_delivery: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-700",
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-700",
  refunded: "bg-zinc-200 text-zinc-700",
};

export function statusBadgeClass(status: string): string {
  return STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-700";
}
