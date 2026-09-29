import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

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

  // Static assets, public api, favicon bypass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname === '/login' ||
    pathname === '/register'
  ) {
    return NextResponse.next();
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

  // Protected route checking
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isEmployeeRoute = pathname.startsWith('/employee') || pathname.startsWith('/api/employee');
  const isClientRoute =
    pathname === '/' ||
    pathname.startsWith('/home') ||
    pathname.startsWith('/markets') ||
    pathname.startsWith('/invest') ||
    pathname.startsWith('/protect') ||
    pathname.startsWith('/borrow') ||
    pathname.startsWith('/applications') ||
    pathname.startsWith('/documents') ||
    pathname.startsWith('/support') ||
    pathname.startsWith('/account');

  // If not logged in and accessing protected routes
  if (!user && (isAdminRoute || isEmployeeRoute || isClientRoute)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role authorization
  if (user) {
    // Admin only routes
    if (isAdminRoute && user.role !== 'ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
      return NextResponse.redirect(new URL(user.role === 'EMPLOYEE' ? '/employee' : '/home', request.url));
    }

    // Employee routes (accessible to EMPLOYEE and ADMIN)
    if (isEmployeeRoute && user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
