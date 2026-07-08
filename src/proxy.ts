import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

/**
 * Public routes that do NOT require authentication.
 * All other routes are protected.
 */
const PUBLIC_ROUTES = ['/login'];

/**
 * API routes that are always public (health checks, auth endpoints).
 */
const PUBLIC_API_PREFIXES = ['/api/auth/'];

/**
 * Next.js Proxy (formerly Middleware)
 * Runs on every request before rendering. Verifies the session JWT from the
 * HttpOnly cookie and redirects unauthenticated users to /login.
 *
 * NOTE: In Next.js 16+, the file is named proxy.ts and the exported function
 * is named `proxy` (middleware.ts / export function middleware is deprecated).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Normalize pathname to remove trailing slash for exact matches
  const normalizedPathname = pathname.endsWith('/') && pathname.length > 1 
    ? pathname.slice(0, -1) 
    : pathname;

  // Allow public routes without authentication
  if (PUBLIC_ROUTES.includes(normalizedPathname)) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Skip Next.js internals and static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Read the session cookie
  const sessionToken = request.cookies.get('session')?.value;

  // Attempt to decrypt and validate the JWT
  const session = await decrypt(sessionToken);

  if (!session) {
    // No valid session — redirect to login
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Check if the session has expired
  if (new Date(session.expiresAt) < new Date()) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Session is valid — allow the request to proceed
  return NextResponse.next();
}

/**
 * Matcher: run proxy on all routes except Next.js internals.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
