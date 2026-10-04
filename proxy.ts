import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { TOKEN_COOKIE } from "@/lib/auth-shared";

// Next.js 16 renamed the `middleware` convention to `proxy`.
const PROTECTED = [/^\/orders(\/|$)/, /^\/account(\/|$)/, /^\/checkout(\/|$)/, /^\/admin(\/|$)/];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!PROTECTED.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  const hasToken = request.cookies.has(TOKEN_COOKIE);
  if (hasToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/orders/:path*", "/account/:path*", "/checkout/:path*", "/admin/:path*"],
};
