"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/components/providers/auth-provider";
import { LoadingState } from "@/components/ui/states";
import { cn } from "@/lib/format";

import { SYSTEM_LINKS } from "./system/system-nav";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/orders", label: "Orders", icon: "🧾" },
  { href: "/admin/products", label: "Products", icon: "🥕" },
  { href: "/admin/categories", label: "Categories", icon: "🗂️" },
  { href: "/admin/inventory", label: "Inventory", icon: "📦" },
  { href: "/admin/accounting", label: "Accounting", icon: "📈" },
  { href: "/admin/expenses", label: "Expenses", icon: "💸" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

function isActive(pathname: string, link: { href: string; exact?: boolean }): boolean {
  return link.exact ? pathname === link.href : pathname.startsWith(link.href);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/admin");
    else if (!loading && user && !user.is_admin) router.replace("/");
  }, [loading, user, router]);

  if (loading || !user || !user.is_admin) {
    return <LoadingState label="Checking access…" />;
  }

  // Super admins also get the system area (audit trail, activity, logs, roles).
  const systemLinks = user.is_super_admin ? SYSTEM_LINKS : [];

  return (
    <div className="min-h-screen bg-cream-100 md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-black/5 bg-white p-4 md:block">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 px-2 text-lg font-extrabold text-brand-800">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-base">🥬</span>
            NaijaFresh
          </Link>
          <NotificationBell align="left" />
        </div>
        <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Admin</p>
        <nav className="mt-2 space-y-1">
          {LINKS.map((link) => (
            <SideLink key={link.href} link={link} active={isActive(pathname, link)} />
          ))}
        </nav>
        {systemLinks.length > 0 && (
          <>
            <p className="mt-5 px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">System</p>
            <nav className="mt-2 space-y-1">
              {systemLinks.map((link) => (
                <SideLink
                  key={link.href}
                  link={link}
                  active={isActive(pathname, link) && (link.exact || pathname.startsWith(link.href))}
                />
              ))}
            </nav>
          </>
        )}
        <button
          onClick={logout}
          className="mt-6 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          Sign out
        </button>
      </aside>

      <div className="flex flex-col">
        <header className="flex items-center gap-3 border-b border-black/5 bg-white px-4 py-3 md:hidden">
          <span className="font-extrabold text-brand-800">NaijaFresh Admin</span>
          <NotificationBell className="ml-auto" />
          <button onClick={logout} className="text-sm font-medium text-rose-600">
            Sign out
          </button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-black/5 bg-white px-2 py-2 no-scrollbar md:hidden">
          {[...LINKS, ...systemLinks.map((link) => ({ ...link, label: link.exact ? "System" : link.label }))].map((link) => {
            const active = isActive(pathname, link);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                  active ? "bg-brand-700 text-white" : "bg-cream-100 text-ink-soft",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function SideLink({ link, active }: { link: { href: string; label: string; icon: string }; active: boolean }) {
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
        active ? "bg-brand-700 text-white" : "text-ink-soft hover:bg-brand-50",
      )}
    >
      <span>{link.icon}</span>
      {link.label}
    </Link>
  );
}
