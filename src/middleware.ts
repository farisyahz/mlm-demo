import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware for route protection.
 * Better Auth handles actual session validation, this is just for redirects.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/about",
    "/api/auth",
    "/api/trpc",
    "/api/webhooks",
    "/api/cron",
  ];

  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  // Also handle /ref/ routes
  if (pathname.startsWith("/ref/")) {
    return NextResponse.next();
  }

  // Let everything pass through - actual auth is handled by Better Auth
  // and the dashboard layout server component
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
