import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { BULK_RFQ_COOLDOWN_MS } from "@/lib/validations";

const protectedPaths = ["/company/import", "/company/listings/new"];

type RateLimitRule = {
  test: (pathname: string, method: string) => boolean;
  intervalMs: number;
  maxRequests: number;
};

const rateLimitRules: RateLimitRule[] = [
  {
    test: (pathname, method) =>
      pathname === "/api/auth/login" && method === "POST",
    intervalMs: 15 * 60 * 1000,
    maxRequests: 20,
  },
  {
    test: (pathname, method) =>
      pathname === "/api/auth/signup" && method === "POST",
    intervalMs: 60 * 60 * 1000,
    maxRequests: 10,
  },
  {
    test: (pathname, method) =>
      pathname === "/api/auth/forgot-password" && method === "POST",
    intervalMs: 60 * 60 * 1000,
    maxRequests: 8,
  },
  {
    test: (pathname, method) =>
      pathname === "/api/auth/reset-password" && method === "POST",
    intervalMs: 60 * 60 * 1000,
    maxRequests: 15,
  },
  {
    test: (pathname, method) =>
      pathname === "/api/orders" && method === "POST",
    intervalMs: 60 * 60 * 1000,
    maxRequests: 30,
  },
  {
    test: (pathname, method) =>
      pathname === "/api/quotes" && method === "POST",
    intervalMs: 60 * 60 * 1000,
    maxRequests: 30,
  },
  {
    test: (pathname, method) =>
      pathname === "/api/search/bulk" && method === "POST",
    intervalMs: 60 * 1000,
    maxRequests: 30,
  },
  {
    test: (pathname, method) =>
      pathname === "/api/search/smart" && method === "POST",
    intervalMs: 60 * 1000,
    maxRequests: 15,
  },
  {
    test: (pathname, method) =>
      pathname === "/api/quotes/bulk" && method === "POST",
    intervalMs: BULK_RFQ_COOLDOWN_MS,
    maxRequests: 1,
  },
  {
    test: (pathname, method) =>
      pathname === "/api/support/contact" && method === "POST",
    intervalMs: 60 * 60 * 1000,
    maxRequests: 10,
  },
];

function applyRateLimit(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip = getClientIp(request.headers);

  for (const rule of rateLimitRules) {
    if (!rule.test(pathname, method)) {
      continue;
    }

    const result = rateLimit(`${ip}:${pathname}`, {
      intervalMs: rule.intervalMs,
      maxRequests: rule.maxRequests,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfterSec) },
        },
      );
    }
  }

  return null;
}

export function middleware(request: NextRequest) {
  const rateLimited = applyRateLimit(request);
  if (rateLimited) {
    return rateLimited;
  }

  const { pathname } = request.nextUrl;

  // Never advertise /admin or /api/admin: strangers get a normal 404, not a login wall.
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/")
  ) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.rewrite(new URL("/__admin_not_found", request.url));
    }
    return NextResponse.next();
  }

  if (!protectedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin",
    "/api/admin/:path*",
    "/company/import/:path*",
    "/company/listings/new/:path*",
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/orders",
    "/api/quotes",
    "/api/quotes/bulk",
    "/api/support/contact",
    "/api/search/bulk",
    "/api/search/smart",
  ],
};
