import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { apiFetch, ApiError } from "./api";
import { TOKEN_COOKIE } from "./auth-shared";
import type { User } from "./types";

export async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value ?? null;
}

/** Returns the signed-in user, or null. Never throws. */
export async function getCurrentUser(): Promise<User | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const res = await apiFetch<{ data: User }>("/auth/user", { token });
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/** Guards a page: redirects to /login (optionally admin-only). */
export async function requireUser(opts: { admin?: boolean; returnTo?: string } = {}): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    const target = opts.returnTo ? `?next=${encodeURIComponent(opts.returnTo)}` : "";
    redirect(`/login${target}`);
  }

  if (opts.admin && !user.is_admin) {
    redirect("/");
  }

  return user;
}
