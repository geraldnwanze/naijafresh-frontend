"use client";

import Link from "next/link";

import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/components/providers/cart-provider";
import { NotificationBell } from "@/components/notification-bell";
import { SearchBox } from "@/components/search-box";

const NAV_LINKS = [
  { href: "/products", label: "Shop all" },
  { href: "/products?type=meal_kit", label: "Meal kits" },
  { href: "/products?type=food_pack", label: "Food packs" },
  { href: "/categories/frozen-foods", label: "Frozen" },
  { href: "/categories/spices-seasonings", label: "Spices" },
  { href: "/#how-it-works", label: "How it works" },
];

export function Navbar() {
  const { count } = useCart();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-cream-100/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 text-lg">🥬</span>
          <span className="text-lg font-extrabold tracking-tight text-brand-800">
            Naija<span className="text-leaf-500">Fresh</span>
          </span>
        </Link>

        <SearchBox className="hidden max-w-md flex-1 md:block" />

        <nav className="ml-auto hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-ink-soft hover:text-brand-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-4">
          <Link
            href={user?.is_admin ? "/admin" : "/account"}
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-soft hover:bg-brand-50 hover:text-brand-700 sm:block"
          >
            {user ? (user.is_admin ? "Admin" : "Account") : "Sign in"}
          </Link>
          {user && <NotificationBell />}
          <Link
            href="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-brand-50"
            aria-label="Cart"
          >
            <span className="text-xl">🛒</span>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-brand-900">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="container-page pb-3 md:hidden">
        <SearchBox placeholder="Search NaijaFresh…" />
      </div>
    </header>
  );
}
