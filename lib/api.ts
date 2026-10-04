// Thin client for the NaijaFresh Laravel API. Works on the server (RSC, route
// handlers) and in the browser. The auth token is passed explicitly by callers
// so this module stays free of React/runtime assumptions.
//
// Base URL resolution:
//   - Browser: NEXT_PUBLIC_API_URL if set, otherwise the same-origin path
//     "/_api/v1" which next.config.ts rewrites to the real API. Using a
//     relative path means the browser only ever talks to the frontend origin,
//     so a single tunnel (ngrok) or single deployment works with no CORS and
//     no mixed-content issues.
//   - Server (RSC): must be absolute — INTERNAL_API_URL, else API_ORIGIN + /api/v1,
//     else localhost.
import { normalizeApiOrigin } from "./api-origin";

const trimSlash = (value: string) => value.replace(/\/$/, "");

const serverBase =
  process.env.INTERNAL_API_URL ??
  `${normalizeApiOrigin(process.env.API_ORIGIN || process.env.BUILT_API_ORIGIN)}/api/v1`;

const browserBase = process.env.NEXT_PUBLIC_API_URL || "/_api/v1";

/** Which setting decided the server-side API address (names only, never values). For /api/health. */
export const API_BASE_SOURCE =
  typeof window !== "undefined"
    ? "browser"
    : process.env.INTERNAL_API_URL
      ? "INTERNAL_API_URL"
      : process.env.API_ORIGIN
        ? "API_ORIGIN (runtime variable)"
        : process.env.BUILT_API_ORIGIN
          ? "API_ORIGIN (baked in at build)"
          : "default (localhost)";

export const API_BASE_URL = trimSlash(
  typeof window === "undefined" ? serverBase : browserBase,
);

export class ApiError extends Error {
  status: number;
  /** Laravel validation errors: { field: [messages] } */
  errors: Record<string, string[]>;
  payload: unknown;

  constructor(message: string, status: number, errors: Record<string, string[]> = {}, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.payload = payload;
  }

  /** First validation message, if any. */
  get firstError(): string | undefined {
    const key = Object.keys(this.errors)[0];
    return key ? this.errors[key]?.[0] : undefined;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  token?: string | null;
  body?: unknown;
  /** Next.js fetch caching hints (server only). */
  next?: { revalidate?: number | false; tags?: string[] };
}

async function requestOnce(path: string, options: RequestOptions): Promise<Response> {
  const { token, body, headers, next, ...rest } = options;

  return fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    // Default to no caching so authenticated data is always fresh; callers can
    // opt into caching for public catalogue reads.
    cache: rest.cache ?? (next ? undefined : "no-store"),
    next,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const isIdempotent = (method?: string) =>
  !method || ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

/**
 * Parse a JSON body that may be polluted with leading/trailing noise. Laravel's
 * `php artisan serve` dev server can prepend a PHP `<b>Notice</b>: … Broken pipe`
 * HTML fragment to an otherwise-valid JSON response under concurrent load. We
 * recover by parsing from the first `{`/`[` to the matching last `}`/`]`.
 * Returns `{ ok: true, value }` on success, `{ ok: false }` when unrecoverable.
 */
function parseJsonLenient(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    const firstBrace = text.indexOf("{");
    const firstBracket = text.indexOf("[");
    const start =
      firstBrace === -1
        ? firstBracket
        : firstBracket === -1
          ? firstBrace
          : Math.min(firstBrace, firstBracket);
    if (start === -1) return { ok: false };

    const open = text[start];
    const close = open === "{" ? "}" : "]";
    const end = text.lastIndexOf(close);
    if (end <= start) return { ok: false };

    try {
      return { ok: true, value: JSON.parse(text.slice(start, end + 1)) };
    } catch {
      return { ok: false };
    }
  }
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await requestOnce(path, options);
  } catch {
    // Network-level failure (API down, DNS, reset). Retry once for safe methods.
    if (isIdempotent(options.method)) {
      res = await requestOnce(path, options);
    } else {
      throw new ApiError(
        "Could not reach the server. Please check your connection and try again.",
        0,
      );
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  let text = await res.text();
  let parsed = text ? parseJsonLenient(text) : { ok: true as const, value: null };

  // Still unparseable and the method is safe to repeat: try once more.
  if (!parsed.ok && isIdempotent(options.method)) {
    const retry = await requestOnce(path, options);
    res = retry;
    text = await retry.text();
    parsed = text ? parseJsonLenient(text) : { ok: true as const, value: null };
  }

  if (!parsed.ok) {
    throw new ApiError(
      `The server returned an unexpected response (${res.status}). It may be overloaded — try again in a moment.`,
      res.status || 502,
      {},
      text.slice(0, 300),
    );
  }

  const json = parsed.value;

  if (!res.ok) {
    const asObj = json as { message?: string; errors?: Record<string, string[]> } | null;
    throw new ApiError(
      asObj?.message ?? `Request failed (${res.status})`,
      res.status,
      asObj?.errors ?? {},
      json,
    );
  }

  return json as T;
}

/** Unwrap a `{ data: ... }` envelope. */
export function unwrap<T>(res: { data: T }): T {
  return res.data;
}
