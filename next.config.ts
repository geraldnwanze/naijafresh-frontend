import type { NextConfig } from "next";

// The API origin the Next server proxies browser calls to. Keep it pointing at
// the Laravel app; the browser never sees this — it calls the same-origin
// "/_api/*" path, which is rewritten here.
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Dev-only. Next.js blocks cross-origin requests to /_next/* dev resources
  // (HMR + the App Router's client navigation) unless the host is listed here.
  // Without it, serving `next dev` through a tunnel (ngrok, cloudflared) or over
  // the LAN makes every <Link> fall back to a full page reload instead of an
  // SPA navigation. Ignored by `next build` / `next start`.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.io",
    "*.trycloudflare.com",
    "*.loca.lt",
    "*.local",
    // Add your machine's LAN IP here if you open the dev server from a phone,
    // e.g. "192.168.1.72".
  ],

  async rewrites() {
    return [
      {
        source: "/_api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
