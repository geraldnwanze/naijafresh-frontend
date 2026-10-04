import { cn, statusBadgeClass } from "@/lib/format";

export function Badge({
  children,
  className,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone ? statusBadgeClass(tone) : "bg-brand-100 text-brand-700",
        className,
      )}
    >
      {children}
    </span>
  );
}
