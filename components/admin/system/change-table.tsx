import { formatNaira } from "@/lib/format";

/** One audit value, made readable: ₦ for kobo fields, JSON for objects. */
export function formatAuditValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number" && field.endsWith("_kobo")) return `${formatNaira(value, { withDecimals: true })} (${value})`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * The fields of an audit entry: before → after for an update, the stored
 * values for a create, the last values for a delete.
 */
export function ChangeTable({
  event,
  oldValues,
  newValues,
}: {
  event: "created" | "updated" | "deleted";
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}) {
  const fields = Array.from(new Set([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})]));

  if (fields.length === 0) {
    return <p className="text-xs text-ink-soft">No field values were recorded.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-black/5 bg-white">
      <table className="w-full text-xs">
        <thead className="bg-cream-100 text-left text-ink-soft">
          <tr>
            <th className="px-3 py-1.5 font-semibold">Field</th>
            {event === "updated" && <th className="px-3 py-1.5 font-semibold">Before</th>}
            <th className="px-3 py-1.5 font-semibold">{event === "updated" ? "After" : event === "created" ? "Value" : "Last value"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {fields.map((field) => (
            <tr key={field}>
              <td className="px-3 py-1.5 font-mono text-ink-soft">{field}</td>
              {event === "updated" && (
                <td className="px-3 py-1.5 text-rose-700 line-through decoration-rose-300">
                  {formatAuditValue(field, oldValues?.[field])}
                </td>
              )}
              <td className="break-all px-3 py-1.5 font-medium text-ink">
                {formatAuditValue(field, event === "deleted" ? oldValues?.[field] : newValues?.[field])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
