import { API_BASE_URL } from "@/lib/api";

// Reports whether this server can reach the Laravel API, and which setting it
// is using. Handy after a deploy: open /api/health. It exposes no secrets (the
// API URL is public anyway).
export const dynamic = "force-dynamic";

interface Probe {
  ok: boolean;
  status?: number;
  error?: string;
  ms: number;
}

async function probe(init: RequestInit & { next?: { revalidate: number } }): Promise<Probe> {
  const started = Date.now();

  try {
    const res = await fetch(`${API_BASE_URL}/config`, { ...init, headers: { Accept: "application/json" } });
    return { ok: res.ok, status: res.status, ms: Date.now() - started };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? `${error.name}: ${error.message}` : String(error), ms: Date.now() - started };
  }
}

export async function GET() {
  // Two probes: a plain fetch, and one with Next's data cache (what the shop
  // pages use), so a platform that can't do the latter shows up separately.
  const plain = await probe({ cache: "no-store" });
  const cached = await probe({ next: { revalidate: 120 } });

  return Response.json(
    { apiBase: API_BASE_URL, plain, cached },
    { status: plain.ok && cached.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
