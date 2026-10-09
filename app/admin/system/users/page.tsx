"use client";

import { useMemo, useState } from "react";

import { Pager } from "@/components/admin/system/pager";
import { useDebounced } from "@/components/admin/system/use-debounced";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Paginated, User } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { TableSkeleton } from "@/components/ui/skeletons";

type UserList = Paginated<User> & { filters: { roles: { value: string; label: string }[] } };

const ROLE_STYLES: Record<string, string> = {
  super_admin: "bg-rose-100 text-rose-700",
  admin: "bg-brand-100 text-brand-700",
  customer: "bg-zinc-100 text-zinc-700",
};

export default function UsersAndRolesPage() {
  const { user: me, token } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState<number | null>(null);
  const debouncedSearch = useDebounced(search);

  const path = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), per_page: "25" });
    if (debouncedSearch.trim()) p.set("search", debouncedSearch.trim());
    if (role) p.set("role", role);
    return `/admin/system/users?${p.toString()}`;
  }, [debouncedSearch, role, page]);

  const { data, loading, error, refetch } = useApi<UserList>(path);
  const roles = data?.filters.roles ?? [];

  async function changeRole(target: User, next: string) {
    if (!token || next === target.role) return;
    const label = roles.find((r) => r.value === next)?.label ?? next;
    if (!confirm(`Make ${target.name} a ${label.toLowerCase()}?`)) return;

    setSaving(target.id);
    try {
      await apiFetch(`/admin/system/users/${target.id}/role`, { method: "PUT", token, body: { role: next } });
      toast(`${target.name} is now a ${label.toLowerCase()}`, "success");
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? (err.firstError ?? err.message) : "Could not change the role.", "error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-ink-soft">
        Admins run the shop. Super admins can also see this system area and change roles. Every change is recorded in the
        audit trail.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-ink-soft">
          Search
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Name or email…"
            className="mt-1 w-56"
          />
        </label>
        <label className="text-xs font-medium text-ink-soft">
          Role
          <Select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="mt-1 w-44"
          >
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="mt-4">
        {loading && !data ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState title="No accounts match" />
        ) : (
          <div className="overflow-x-auto rounded-card border border-black/5 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-left text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5">Account</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5">Orders</th>
                  <th className="px-4 py-2.5">Joined</th>
                  <th className="px-4 py-2.5">Change role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data.data.map((account) => {
                  const isMe = account.id === me?.id;
                  return (
                    <tr key={account.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">
                          {account.name} {isMe && <span className="text-xs font-normal text-ink-soft">(you)</span>}
                        </p>
                        <p className="text-xs text-ink-soft">{account.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={ROLE_STYLES[account.role]}>
                          {roles.find((r) => r.value === account.role)?.label ?? account.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{account.orders_count ?? 0}</td>
                      <td className="px-4 py-3 text-ink-soft">{formatDate(account.created_at)}</td>
                      <td className="px-4 py-3">
                        <Select
                          value={account.role}
                          disabled={isMe || saving === account.id}
                          onChange={(e) => changeRole(account, e.target.value)}
                          aria-label={`Role for ${account.name}`}
                          className="w-40"
                          title={isMe ? "You can't change your own role" : undefined}
                        >
                          {roles.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pager meta={data.meta} onPage={setPage} noun="accounts" />
          </div>
        )}
      </div>
    </div>
  );
}
