import type { ReactNode } from "react";

import { cn } from "@/lib/format";

import { ProductCardSkeleton, Skeleton } from "./states";

const card = "rounded-card border border-black/5 bg-white";

/**
 * Wraps a skeleton so screen readers announce "loading" once instead of reading
 * a pile of empty boxes. Every skeleton below renders inside one.
 */
export function LoadingRegion({
  label = "Loading…",
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** A page heading and an optional subtitle line. */
export function TitleSkeleton({ subtitle = true, className }: { subtitle?: boolean; className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="h-8 w-56 max-w-full" />
      {subtitle && <Skeleton className="mt-2 h-4 w-80 max-w-full" />}
    </div>
  );
}

/** Same grid as <ProductGrid>, so the cards land where the skeletons were. */
export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** A row of rounded pills (filters, tabs). */
export function PillsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
      ))}
    </div>
  );
}

/** A bordered table card: a header strip and `rows` rows of `cols` cells. */
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <LoadingRegion label="Loading…">
      <div className={cn(card, "overflow-hidden")}>
        <div className="flex gap-4 bg-cream-100 px-4 py-3">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className="h-3 flex-1 bg-black/[0.08]" />
          ))}
        </div>
        <div className="divide-y divide-black/5">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex items-center gap-4 px-4 py-3.5">
              {Array.from({ length: cols }, (_, c) => (
                <Skeleton key={c} className={cn("h-4 flex-1", c === 0 && "max-w-[40%]")} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

/** A row of KPI tiles. */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn(card, "p-4")}>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-8 w-28" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/** A stack of cards with a title line and a few text lines (lists of orders, etc.). */
export function CardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={cn(card, "flex items-center justify-between gap-4 p-4")}>
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="mt-2 h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** A card of labelled inputs. */
export function FormSkeleton({ fields = 5, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn(card, "space-y-4 p-5", className)}>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-10 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-11 w-36 rounded-full" />
    </div>
  );
}

/** A summary card: a heading, several label/value lines and a button. */
export function SummarySkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className={cn(card, "p-5")}>
      <Skeleton className="h-5 w-32" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="flex justify-between gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-5 h-11 w-full rounded-full" />
    </div>
  );
}
