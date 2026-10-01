import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { applySecurityHeaders } from '@/lib/security-headers';

const SESSION_COOKIE_NAME = 'twm_session';
const JWT_SECRET_STRING = process.env.JWT_SECRET || 'twm_development_session_secret_change_in_production_min_32_chars!';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

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
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      user = payload as unknown as JWTPayload;
    } catch {
      user = null;
    }
  }

  // Authenticated users visiting /login or /register should be redirected to their respective dashboards
  if (user && (pathname === '/login' || pathname === '/register')) {
    if (user.role === 'ADMIN') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/admin', request.url)));
    }
    if (user.role === 'EMPLOYEE') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/employee', request.url)));
    }
    return applySecurityHeaders(NextResponse.redirect(new URL('/home', request.url)));
  }

  // Public pages bypass
  if (pathname === '/login' || pathname === '/register') {
    return applySecurityHeaders(NextResponse.next());
  }

  // Public API routes that do not require an active session
  const isPublicApi =
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/register' ||
    pathname === '/api/auth/logout' ||
    pathname.startsWith('/api/market') ||
    pathname === '/api/integrations/status';

  // Protected route checking
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isEmployeeRoute = pathname.startsWith('/employee') || pathname.startsWith('/api/employee');
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
    loginUrl.searchParams.set('redirect', pathname);
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

  return applySecurityHeaders(NextResponse.next());
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
