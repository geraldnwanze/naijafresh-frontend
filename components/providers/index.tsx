"use client";

import type { User } from "@/lib/types";

import { AuthProvider } from "./auth-provider";
import { CartProvider } from "./cart-provider";
import { NotificationProvider } from "./notification-provider";
import { ToastProvider } from "./toast-provider";

export function Providers({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <AuthProvider initialUser={initialUser}>
        <NotificationProvider>
          <CartProvider>{children}</CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
