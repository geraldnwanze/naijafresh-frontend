import type { ReactNode } from "react";

import { cn } from "@/lib/format";

import { ButtonLink } from "./button";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-black/[0.06]", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-card border border-black/5 bg-white p-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
      <Skeleton className="mt-3 h-9 w-full rounded-full" />
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-ink-soft">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-300 border-t-brand-700" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-card border border-dashed border-black/10 bg-white/60 px-6 py-14 text-center">
      <p className="text-lg font-semibold text-ink">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && (
        <ButtonLink href={action.href} className="mt-5" size="sm">
          {action.label}
        </ButtonLink>
      )}
    </div>
  );
}

export function ErrorState({ message, children }: { message?: string; children?: ReactNode }) {
  return (
    <div className="rounded-card border border-rose-200 bg-rose-50 px-6 py-10 text-center">
      <p className="font-semibold text-rose-700">Something went wrong</p>
      <p className="mt-1 text-sm text-rose-600">
        {message ?? "We couldn't load this right now. Please try again."}
      </p>
      {children}
    </div>
  );
}
