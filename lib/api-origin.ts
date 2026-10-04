/**
 * Cleans up the API_ORIGIN setting: trims whitespace and trailing slashes, and
 * drops a "/api/v1" (or "/api") suffix someone pasted by mistake. The app adds
 * "/api/v1" itself, so a suffixed value would call ".../api/v1/api/v1/..." (404s).
 */
export function normalizeApiOrigin(value: string | undefined, fallback = "http://localhost:8000"): string {
  const cleaned = (value ?? "").trim().replace(/\/+$/, "").replace(/\/api(\/v1)?$/i, "");

  return cleaned || fallback;
}
