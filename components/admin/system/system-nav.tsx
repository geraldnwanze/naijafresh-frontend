"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/format";

export const SYSTEM_LINKS = [
  { href: "/admin/system", label: "Overview", icon: "🛡️", exact: true },
  { href: "/admin/system/audit", label: "Audit trail", icon: "📝" },
  { href: "/admin/system/activity", label: "Activity", icon: "👣" },
  { href: "/admin/system/logs", label: "App logs", icon: "🪵" },
  { href: "/admin/system/users", label: "Users & roles", icon: "👥" },
];

export function SystemNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-5 flex gap-1 overflow-x-auto no-scrollbar" aria-label="System">
      {SYSTEM_LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold",
              active ? "bg-brand-700 text-white" : "bg-white text-ink-soft hover:bg-brand-50",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
