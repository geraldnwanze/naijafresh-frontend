import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/format";

const controlClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-ink-soft/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60";

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, "min-h-[90px]", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(controlClass, "appearance-none pr-9", className)} {...props} />;
}
