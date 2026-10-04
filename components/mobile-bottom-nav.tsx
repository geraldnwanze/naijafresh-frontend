"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCart } from "@/components/providers/cart-provider";
import { cn } from "@/lib/format";

const ITEMS = [
  { href: "/", label: "Home", icon: "🏠", match: (p: string) => p === "/" },
  { href: "/products", label: "Shop", icon: "🛍️", match: (p: string) => p.startsWith("/products") || p.startsWith("/categories") },
  { href: "/cart", label: "Cart", icon: "🛒", match: (p: string) => p.startsWith("/cart") || p.startsWith("/checkout") },
  { href: "/orders", label: "Orders", icon: "📦", match: (p: string) => p.startsWith("/orders") },
  { href: "/account", label: "Account", icon: "👤", match: (p: string) => p.startsWith("/account") },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-brand-700" : "text-ink-soft",
                )}
              >
                <span className="relative text-lg">
                  {item.icon}
                  {item.label === "Cart" && count > 0 && (
                    <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent-500 px-1 text-[9px] font-bold text-brand-900">
                      {count}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
