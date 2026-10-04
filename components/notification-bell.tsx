"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useNotifications } from "@/components/providers/notification-provider";
import { cn, timeAgo } from "@/lib/format";
import type { AppNotification } from "@/lib/types";

const ICONS: Record<string, string> = {
  order_placed: "🧾",
  order_status: "📦",
  payment_received: "✅",
  payment_failed: "⚠️",
  new_order: "🛒",
  low_stock: "📉",
};

/**
 * Bell icon with an unread badge and a dropdown of recent notifications.
 * State lives in NotificationProvider, so several bells can share one poller.
 */
export function NotificationBell({
  align = "right",
  className,
}: {
  /** Which edge of the bell the dropdown lines up with. */
  align?: "left" | "right";
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const boxRef = useRef<HTMLDivElement>(null);
  const { unreadCount, items, loaded, refresh, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  // Load the latest whenever the dropdown opens.
  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  // Close on navigation, outside click and Escape.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openNotification(notification: AppNotification) {
    markRead(notification);
    setOpen(false);
    if (notification.url) router.push(notification.url);
  }

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-brand-50"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
            <p className="text-sm font-bold text-brand-800">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {!loaded && items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-soft">Loading…</p>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl">🔔</p>
              <p className="mt-1 text-sm font-medium text-ink">You&apos;re all caught up</p>
              <p className="text-xs text-ink-soft">Order updates will show up here.</p>
            </div>
          ) : (
            <ul className="max-h-[24rem] divide-y divide-black/5 overflow-y-auto">
              {items.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left hover:bg-brand-50",
                      !notification.is_read && "bg-brand-50/60",
                    )}
                  >
                    <span className="mt-0.5 text-lg" aria-hidden>
                      {ICONS[notification.kind] ?? "🔔"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-sm text-ink",
                          notification.is_read ? "font-medium" : "font-bold",
                        )}
                      >
                        {notification.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-soft">{notification.body}</span>
                      <span className="mt-1 block text-[11px] text-ink-soft/80">{timeAgo(notification.created_at)}</span>
                    </span>
                    {!notification.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-600" aria-label="Unread" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
