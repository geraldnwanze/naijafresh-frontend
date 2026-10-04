"use client";

import { periodLabel } from "@/lib/dates";
import { formatNaira } from "@/lib/format";
import type { ProfitLossBucket, ReportGroupBy } from "@/lib/types";

const BAR_SLOT = 22; // px per period
const HEIGHT = 190;
const TOP = 10;
const BOTTOM = 26; // room for x labels

/**
 * Revenue (green-grey) and net profit (green, or red when a loss) per period.
 * Plain SVG so the page needs no charting dependency; scrolls sideways when
 * there are many periods.
 */
export function ProfitChart({ series, groupBy }: { series: ProfitLossBucket[]; groupBy: ReportGroupBy }) {
  if (series.length === 0) return null;

  const width = Math.max(series.length * BAR_SLOT, 320);
  const slot = width / series.length;
  const chartHeight = HEIGHT - TOP - BOTTOM;

  const top = Math.max(1, ...series.flatMap((b) => [b.revenue_kobo, b.net_profit_kobo]));
  const bottom = Math.min(0, ...series.map((b) => b.net_profit_kobo));
  const range = top - bottom;
  const zeroY = TOP + (top / range) * chartHeight;
  const scale = chartHeight / range;

  // Label roughly every ~56px so axis text never collides.
  const labelEvery = Math.max(1, Math.ceil(56 / slot));

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-200" /> Revenue
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" /> Net profit
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Net loss
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label="Revenue and net profit by period"
          viewBox={`0 0 ${width} ${HEIGHT}`}
          width={width}
          height={HEIGHT}
          className="block"
        >
          <line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke="currentColor" className="text-black/15" />

          {series.map((bucket, i) => {
            const x = i * slot;
            const barWidth = Math.max(4, slot / 2 - 3);
            const revenueHeight = Math.max(bucket.revenue_kobo * scale, bucket.revenue_kobo > 0 ? 1 : 0);
            const profit = bucket.net_profit_kobo;
            const profitHeight = Math.abs(profit) * scale;

            return (
              <g key={bucket.period_start}>
                <title>
                  {`${groupBy === "week" ? "Week of " : ""}${periodLabel(bucket.period_start, groupBy)}\nRevenue ${formatNaira(bucket.revenue_kobo)}\nExpenses ${formatNaira(bucket.expenses_kobo)}\nNet ${formatNaira(profit)}`}
                </title>
                {/* full-height hit area so the tooltip works on empty periods too */}
                <rect x={x} y={0} width={slot} height={HEIGHT - BOTTOM} fill="transparent" />
                <rect
                  x={x + 2}
                  y={zeroY - revenueHeight}
                  width={barWidth}
                  height={revenueHeight}
                  rx={1.5}
                  className="fill-brand-200"
                />
                <rect
                  x={x + 2 + barWidth + 2}
                  y={profit >= 0 ? zeroY - profitHeight : zeroY}
                  width={barWidth}
                  height={profitHeight}
                  rx={1.5}
                  className={profit >= 0 ? "fill-emerald-600" : "fill-rose-500"}
                />
                {i % labelEvery === 0 && (
                  <text
                    x={x + slot / 2}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    className="fill-ink-soft"
                    fontSize={10}
                  >
                    {periodLabel(bucket.period_start, groupBy)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
