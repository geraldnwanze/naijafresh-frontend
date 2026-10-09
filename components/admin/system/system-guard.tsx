"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { TableSkeleton } from "@/components/ui/skeletons";


/** Keeps ordinary admins out of the system area (the API refuses them too). */
export function SystemGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !user.is_super_admin) router.replace("/admin");
  }, [loading, user, router]);

  if (loading || !user?.is_super_admin) {
    return <TableSkeleton rows={6} />;
  }

  return <>{children}</>;
}
