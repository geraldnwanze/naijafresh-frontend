import type { useRouter } from "next/navigation";

type AppRouter = ReturnType<typeof useRouter>;

/**
 * Navigate to `path` as a client-side (SPA) transition, with a hard-navigation
 * safety net. If the App Router hasn't committed the URL change within
 * `timeoutMs` — which can happen when the RSC request is blocked or stalls
 * behind a dev tunnel — we fall back to a full navigation so the user always
 * lands on the target page.
 */
export function goto(router: AppRouter, path: string, timeoutMs = 700): void {
  const target = path.startsWith("/") ? path : "/";

  if (typeof window === "undefined") {
    router.push(target);
    return;
  }

  const [wantPath, wantSearch = ""] = target.split(/(?=\?)/);
  const arrived = () =>
    window.location.pathname === wantPath &&
    (wantSearch === "" || window.location.search === wantSearch);

  router.push(target);

  window.setTimeout(() => {
    if (!arrived()) {
      window.location.assign(target);
    }
  }, timeoutMs);
}
