import type { Metadata } from "next";

import { SystemGuard } from "@/components/admin/system/system-guard";
import { SystemNav } from "@/components/admin/system/system-nav";

export const metadata: Metadata = {
  title: "System",
  robots: { index: false, follow: false },
};

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <SystemGuard>
      <div className="mb-1">
        <h1 className="text-2xl font-bold text-brand-800">System</h1>
        <p className="mb-4 text-sm text-ink-soft">Super admin only: who did what, what the app is doing, and who has access.</p>
        <SystemNav />
      </div>
      {children}
    </SystemGuard>
  );
}
