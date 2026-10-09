import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { applySecurityHeaders } from '@/lib/security-headers';

const SESSION_COOKIE_NAME = 'twm_session';
const DEFAULT_DEV_JWT_SECRET = 'twm_development_session_secret_change_in_production_min_32_chars!';

function getEdgeJwtSecret(): Uint8Array | null {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (!secret || secret === DEFAULT_DEV_JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    return new TextEncoder().encode(DEFAULT_DEV_JWT_SECRET);
  }
  if (secret.length < 32 && process.env.NODE_ENV === 'production') {
    return null;
  }
  return new TextEncoder().encode(secret);
}

interface JWTPayload {
  userId: string;
  role: 'CLIENT' | 'EMPLOYEE' | 'ADMIN';
  email: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and PWA public files bypass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/favicon.svg') ||
    pathname.startsWith('/icons/') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/offline'
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let user: JWTPayload | null = null;

  if (token) {
    const jwtSecretKey = getEdgeJwtSecret();
    if (jwtSecretKey) {
      try {
        const { payload } = await jwtVerify(token, jwtSecretKey);
        user = payload as unknown as JWTPayload;
      } catch {
        user = null;
      }
    }
  }

  // Authenticated and public handling for /login or /register
  if (pathname === '/login' || pathname === '/register') {
    const hasRedirectQuery = request.nextUrl.searchParams.has('redirect');
    const hasReasonQuery = request.nextUrl.searchParams.has('reason');
    const hasErrorQuery = request.nextUrl.searchParams.has('error') || request.nextUrl.searchParams.has('auth_error');
    const hasLogoutQuery = request.nextUrl.searchParams.has('logout') || request.nextUrl.searchParams.has('clear');

    // If visiting /login or /register with redirect, reason, error, or logout parameters,
    // downstream server layouts or the user actively routed here to challenge or re-authenticate.
    // NEVER bounce them back to protected dashboards: doing so causes an infinite 307 redirect loop.
    // Instead, delete any stale/invalid session cookie and render the page.
    if (hasRedirectQuery || hasReasonQuery || hasErrorQuery || hasLogoutQuery) {
      const response = applySecurityHeaders(NextResponse.next());
      if (token) {
        response.cookies.delete(SESSION_COOKIE_NAME);
      }
      if (request.cookies.has('twm_nav_bounce')) {
        response.cookies.delete('twm_nav_bounce');
      }
      return response;
    }

    // Authenticated users visiting clean /login or /register without params
    if (user) {
      // Loop protection: check redirect bounce counter
      const bounceCount = parseInt(request.cookies.get('twm_nav_bounce')?.value || '0', 10);
      if (bounceCount >= 2) {
        // Break infinite loop: clear session cookie and render login page cleanly
        const response = applySecurityHeaders(NextResponse.next());
        response.cookies.delete(SESSION_COOKIE_NAME);
        response.cookies.delete('twm_nav_bounce');
        return response;
      }

      const destination =
        user.role === 'ADMIN' ? '/admin' : user.role === 'EMPLOYEE' ? '/employee' : '/home';
      const redirectRes = applySecurityHeaders(NextResponse.redirect(new URL(destination, request.url)));
      redirectRes.cookies.set('twm_nav_bounce', String(bounceCount + 1), {
        path: '/',
        maxAge: 10,
        sameSite: 'lax',
        httpOnly: true,
      });
      return redirectRes;
    }

    const response = applySecurityHeaders(NextResponse.next());
    if (request.cookies.has('twm_nav_bounce')) {
      response.cookies.delete('twm_nav_bounce');
    }
    return response;
  }

  // Public API routes that do not require an active session
  const isPublicApi =
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/register' ||
    pathname === '/api/auth/logout' ||
    pathname.startsWith('/api/market') ||
    pathname === '/api/integrations/status' ||
    (pathname === '/api/crm/leads' && request.method === 'POST');

  // Protected route checking
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isEmployeeRoute =
    pathname.startsWith('/employee') ||
    pathname.startsWith('/api/employee') ||
    (pathname.startsWith('/api/crm') && !isPublicApi);
  const isProtectedApiRoute = pathname.startsWith('/api/') && !isPublicApi;
  const isClientRoute =
    pathname === '/' ||
    pathname.startsWith('/home') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/markets') ||
    pathname.startsWith('/signals') ||
    pathname.startsWith('/invest') ||
    pathname.startsWith('/protect') ||
    pathname.startsWith('/borrow') ||
    pathname.startsWith('/applications') ||
    pathname.startsWith('/documents') ||
    pathname.startsWith('/support') ||
    pathname.startsWith('/account');

  // If not logged in and accessing protected routes
  if (!user && (isAdminRoute || isEmployeeRoute || isClientRoute || isProtectedApiRoute)) {
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 })
      );
    }
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/' && pathname !== '/login') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Role authorization
  if (user) {
    // Admin only routes
    if (isAdminRoute && user.role !== 'ADMIN') {
      if (pathname.startsWith('/api/')) {
        return applySecurityHeaders(
          NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
        );
      }
      return applySecurityHeaders(
        NextResponse.redirect(new URL(user.role === 'EMPLOYEE' ? '/employee' : '/home', request.url))
      );
    }

    // Employee routes (accessible to EMPLOYEE and ADMIN)
    if (isEmployeeRoute && user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
      if (pathname.startsWith('/api/')) {
        return applySecurityHeaders(
          NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 })
        );
      }
      return applySecurityHeaders(
        NextResponse.redirect(new URL('/home', request.url))
      );
    }

    // Client-only onboarding route (not accessible to staff or admin)
    if (pathname.startsWith('/onboarding') && user.role !== 'CLIENT') {
      return applySecurityHeaders(
        NextResponse.redirect(new URL(user.role === 'ADMIN' ? '/admin' : '/employee', request.url))
      );
    }
  }

  const response = applySecurityHeaders(NextResponse.next());
  if (request.cookies.has('twm_nav_bounce')) {
    response.cookies.delete('twm_nav_bounce');
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.svg
     * - icons
     * - manifest.json
     * - sw.js
     */
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|icons/|manifest.json|sw.js).*)',
  ],
};
