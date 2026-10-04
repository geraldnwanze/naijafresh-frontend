"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { apiFetch } from "@/lib/api";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Authenticated GET with loading/error state and a manual refetch. */
export function useApi<T>(path: string | null): State<T> & { refetch: () => void } {
  const { token, loading: authLoading } = useAuth();
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });

  const load = useCallback(() => {
    if (authLoading) return;
    if (!path || !token) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    apiFetch<T>(path, { token })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => setState({ data: null, loading: false, error: err?.message ?? "Failed to load." }));
  }, [path, token, authLoading]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}
