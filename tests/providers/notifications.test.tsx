import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationBell } from "@/components/notification-bell";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import type { AppNotification } from "@/lib/types";
import { makeNotification } from "../factories";

const push = vi.fn();
let token: string | null = "tok";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/",
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({ token }),
}));

// A tiny in-memory stand-in for the notifications API.
let notifications: AppNotification[];
let calls: string[];

function mockApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace("/_api/v1", "");
      const method = init?.method ?? "GET";
      calls.push(`${method} ${path}`);

      const unread = () => notifications.filter((n) => !n.is_read).length;

      if (path === "/notifications/unread-count") {
        return new Response(JSON.stringify({ data: { unread_count: unread() } }));
      }
      if (path === "/notifications") {
        return new Response(JSON.stringify({ data: notifications, unread_count: unread() }));
      }
      if (path === "/notifications/read-all") {
        notifications = notifications.map((n) => ({ ...n, is_read: true }));
        return new Response(null, { status: 204 });
      }
      if (path.endsWith("/read")) {
        const id = path.split("/")[2];
        notifications = notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
        return new Response(null, { status: 204 });
      }
      return new Response("{}", { status: 404 });
    }),
  );
}

function renderBell() {
  return render(
    <ToastProvider>
      <NotificationProvider>
        <NotificationBell />
      </NotificationProvider>
    </ToastProvider>,
  );
}

beforeEach(() => {
  token = "tok";
  calls = [];
  push.mockReset();
  notifications = [
    makeNotification({ id: "a", title: "Order confirmed" }),
    makeNotification({ id: "b", title: "Out for delivery", url: "/orders/NF-2" }),
    makeNotification({ id: "c", title: "Old news", is_read: true }),
  ];
  mockApi();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NotificationBell", () => {
  it("shows the unread count on the bell", async () => {
    renderBell();

    expect(await screen.findByLabelText("Notifications, 2 unread")).toBeInTheDocument();
  });

  it("caps the badge at 9+", async () => {
    notifications = Array.from({ length: 12 }, (_, i) => makeNotification({ id: `n${i}` }));
    renderBell();

    expect(await screen.findByText("9+")).toBeInTheDocument();
  });

  it("does not poll without a signed-in user", async () => {
    token = null;
    renderBell();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(calls).toEqual([]);
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });

  it("loads and lists notifications when opened", async () => {
    renderBell();
    await userEvent.click(await screen.findByLabelText(/Notifications/));

    expect(await screen.findByText("Order confirmed")).toBeInTheDocument();
    expect(screen.getByText("Out for delivery")).toBeInTheDocument();
    expect(screen.getByText("Old news")).toBeInTheDocument();
  });

  it("marks one as read, closes and navigates to its page", async () => {
    renderBell();
    await userEvent.click(await screen.findByLabelText(/Notifications/));
    await userEvent.click(await screen.findByText("Out for delivery"));

    expect(push).toHaveBeenCalledWith("/orders/NF-2");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Notifications, 1 unread")).toBeInTheDocument();
    await waitFor(() => expect(calls).toContain("POST /notifications/b/read"));
  });

  it("marks everything read", async () => {
    renderBell();
    await userEvent.click(await screen.findByLabelText(/Notifications/));
    await userEvent.click(await screen.findByRole("button", { name: "Mark all as read" }));

    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
    await waitFor(() => expect(calls).toContain("POST /notifications/read-all"));
  });

  it("closes on Escape and on an outside click", async () => {
    renderBell();
    await userEvent.click(await screen.findByLabelText(/Notifications/));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/Notifications/));
    await userEvent.click(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("shows an all-caught-up message when there is nothing", async () => {
    notifications = [];
    renderBell();
    await userEvent.click(await screen.findByLabelText("Notifications"));

    expect(await screen.findByText("You're all caught up")).toBeInTheDocument();
  });
});

describe("NotificationProvider polling", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it("toasts when a new notification arrives on a later poll", async () => {
    renderBell();
    await screen.findByLabelText("Notifications, 2 unread");

    notifications = [makeNotification({ id: "new", title: "Payment received" }), ...notifications];

    await act(async () => {
      await vi.advanceTimersByTimeAsync(46_000);
    });

    expect(await screen.findByText("Payment received")).toBeInTheDocument();
    expect(screen.getByLabelText("Notifications, 3 unread")).toBeInTheDocument();
  });

  it("stays quiet when a later poll finds nothing new", async () => {
    renderBell();
    await screen.findByLabelText("Notifications, 2 unread");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(46_000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not toast for notifications that were already there on the first load", async () => {
    renderBell();
    await screen.findByLabelText("Notifications, 2 unread");

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
