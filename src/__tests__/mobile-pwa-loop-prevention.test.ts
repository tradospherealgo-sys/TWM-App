import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';
import { signSessionToken } from '../lib/auth';
import fs from 'fs';
import path from 'path';

describe('Mobile PWA & Edge Middleware Redirect Loop Prevention Suite', () => {
  const rootDir = process.cwd();

  it('should ensure public manifest start_url is properly configured', () => {
    const manifestPath = path.join(rootDir, 'public', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(['/home', '/']).toContain(manifest.start_url);
    expect(manifest.display).toBe('standalone');
  });

  it('should break redirect loop when user reaches /login with reason=session_expired', async () => {
    // Generate valid session token
    const token = await signSessionToken({
      userId: 'test-user-id',
      email: 'client@example.com',
      role: 'CLIENT',
      name: 'Test Client',
    });

    const request = new NextRequest('http://localhost:3000/login?reason=session_expired', {
      headers: {
        cookie: `twm_session=${token}`,
      },
    });

    const response = await middleware(request);

    // Response should NOT be a 307 redirect back to /home
    expect(response.status).not.toBe(307);
    expect(response.status).not.toBe(308);

    // The stale session cookie must be deleted
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('twm_session=;');
  });

  it('should break redirect loop when user reaches /login with redirect=/home', async () => {
    const token = await signSessionToken({
      userId: 'test-user-id',
      email: 'client@example.com',
      role: 'CLIENT',
      name: 'Test Client',
    });

    const request = new NextRequest('http://localhost:3000/login?redirect=%2Fhome', {
      headers: {
        cookie: `twm_session=${token}`,
      },
    });

    const response = await middleware(request);

    // Should NOT redirect back to /home
    expect(response.status).not.toBe(307);
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('twm_session=;');
  });

  it('should break redirect loop when user reaches /login with error or logout query', async () => {
    const token = await signSessionToken({
      userId: 'test-user-id',
      email: 'client@example.com',
      role: 'CLIENT',
      name: 'Test Client',
    });

    const request = new NextRequest('http://localhost:3000/login?error=session_invalid', {
      headers: {
        cookie: `twm_session=${token}`,
      },
    });

    const response = await middleware(request);
    expect(response.status).not.toBe(307);
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('twm_session=;');
  });

  it('should break bounce loop if bounce counter exceeds limit on bare /login', async () => {
    const token = await signSessionToken({
      userId: 'test-user-id',
      email: 'client@example.com',
      role: 'CLIENT',
      name: 'Test Client',
    });

    // Request with bounce count already at 2
    const request = new NextRequest('http://localhost:3000/login', {
      headers: {
        cookie: `twm_session=${token}; twm_nav_bounce=2`,
      },
    });

    const response = await middleware(request);

    // Should NOT redirect to /home; must stop the bounce loop
    expect(response.status).not.toBe(307);
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('twm_session=;');
  });

  it('should redirect clean authenticated requests on /login to dashboard with bounce counter', async () => {
    const token = await signSessionToken({
      userId: 'test-user-id',
      email: 'client@example.com',
      role: 'CLIENT',
      name: 'Test Client',
    });

    const request = new NextRequest('http://localhost:3000/login', {
      headers: {
        cookie: `twm_session=${token}`,
      },
    });

    const response = await middleware(request);

    // Normal clean request redirects to /home
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/home');
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('twm_nav_bounce=1');
  });

  it('should redirect unauthenticated root / requests to /login without circular ?redirect=/', async () => {
    const request = new NextRequest('http://localhost:3000/');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toBe('http://localhost:3000/login');
    expect(location).not.toContain('redirect=%2F');
  });
});
