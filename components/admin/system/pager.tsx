import { Button } from "@/components/ui/button";
import type { Paginated } from "@/lib/types";

export function Pager({
  meta,
  onPage,
  noun,
}: {
  meta: Paginated<unknown>["meta"];
  onPage: (page: number) => void;
  noun: string;
}) {
  if (meta.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-black/5 px-4 py-3 text-sm">
      <span className="text-ink-soft">
        Page {meta.current_page} of {meta.last_page} · {meta.total} {noun}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPage(meta.current_page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
