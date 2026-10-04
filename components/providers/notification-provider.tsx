"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { apiFetch } from "@/lib/api";
import type { AppNotification } from "@/lib/types";

const POLL_MS = 45_000;

interface NotificationContextValue {
  unreadCount: number;
  items: AppNotification[];
  /** True once the list has been fetched at least once (so "empty" is real). */
  loaded: boolean;
  loading: boolean;
  /** Reload the list (used when the dropdown opens). */
  refresh: () => Promise<void>;
  markRead: (notification: AppNotification) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * Owns the bell's state for the whole app so there is exactly one polling
 * loop, however many bells are on screen (storefront navbar, admin header…).
 * Polls a cheap unread-count endpoint while the tab is visible, and surfaces a
 * toast when something new arrives.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { toast } = useToast();

  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const previousCount = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ data: AppNotification[]; unread_count: number }>("/notifications", { token });
      setItems(res.data);
      setUnreadCount(res.unread_count);
      previousCount.current = res.unread_count;
      setLoaded(true);
    } catch {
      /* keep what we have; the next poll will retry */
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Poll the unread count; announce new notifications with a toast.
  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      setItems([]);
      setLoaded(false);
      previousCount.current = null;
      return;
    }

    let cancelled = false;

    async function poll(force = false) {
      if (!force && document.visibilityState !== "visible") return;
      try {
        const res = await apiFetch<{ data: { unread_count: number } }>("/notifications/unread-count", { token });
        if (cancelled) return;

        const count = res.data.unread_count;
        const before = previousCount.current;
        setUnreadCount(count);
        previousCount.current = count;

        if (before !== null && count > before) {
          const list = await apiFetch<{ data: AppNotification[]; unread_count: number }>("/notifications", { token });
          if (cancelled) return;
          setItems(list.data);
          setLoaded(true);
          const newest = list.data.find((n) => !n.is_read);
          if (newest) toast(newest.title, "info");
        }
      } catch {
        /* offline or API restarting — try again next tick */
      }
    }

    // First fetch always runs so the badge is right even in a background tab;
    // later ticks only run while the tab is visible.
    poll(true);
    const timer = setInterval(() => poll(), POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, toast]);

  const markRead = useCallback(
    async (notification: AppNotification) => {
      if (!token || notification.is_read) return;

      // Optimistic: the badge drops immediately.
      setItems((current) => current.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
      setUnreadCount((count) => {
        const next = Math.max(0, count - 1);
        previousCount.current = next;
        return next;
      });

      try {
        await apiFetch(`/notifications/${notification.id}/read`, { method: "POST", token });
      } catch {
        refresh();
      }
    },
    [token, refresh],
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;

    setItems((current) => current.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    previousCount.current = 0;

    try {
      await apiFetch("/notifications/read-all", { method: "POST", token });
    } catch {
      refresh();
    }
  }, [token, refresh]);

  const value = useMemo(
    () => ({ unreadCount, items, loaded, loading, refresh, markRead, markAllRead }),
    [unreadCount, items, loaded, loading, refresh, markRead, markAllRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
