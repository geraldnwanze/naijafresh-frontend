import type { NextConfig } from "next";

import { normalizeApiOrigin } from "./lib/api-origin";

// The API origin the Next server proxies browser calls to. Keep it pointing at
// the Laravel app; the browser never sees this — it calls the same-origin
// "/_api/*" path, which is rewritten here.
const API_ORIGIN = normalizeApiOrigin(process.env.API_ORIGIN);

// Platforms like Cloudflare Workers keep build variables and runtime variables
// apart, so without this the server-side pages could fall back to localhost even
// though the /_api proxy (resolved at build) works. When API_ORIGIN is known at
// build time it is also baked in as BUILT_API_ORIGIN, which lib/api.ts uses when
// no runtime API_ORIGIN exists. (It is only the API's public URL. A separate name
// is used on purpose: inlining API_ORIGIN itself stops the runtime value working.)
const bakedOrigin = process.env.API_ORIGIN ? { env: { BUILT_API_ORIGIN: API_ORIGIN } } : {};

const nextConfig: NextConfig = {
  ...bakedOrigin,

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
