import { cn, formatNaira } from "@/lib/format";

export function PriceDisplay({
  kobo,
  compareAtKobo,
  suffix,
  className,
  size = "md",
}: {
  kobo: number;
  compareAtKobo?: number | null;
  /** Shown after the price, e.g. "/ kg". */
  suffix?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  };

  return (
    <span className={cn("inline-flex items-baseline gap-2 font-bold text-brand-800", sizes[size], className)}>
      <span>
        {formatNaira(kobo)}
        {suffix && <span className="ml-0.5 text-xs font-medium text-ink-soft">{suffix}</span>}
      </span>
      {compareAtKobo && compareAtKobo > kobo && (
        <span className="text-xs font-medium text-ink-soft line-through">{formatNaira(compareAtKobo)}</span>
      )}
    </span>
  );
}
