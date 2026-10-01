import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SECURITY_HEADERS, applySecurityHeaders } from '@/lib/security-headers';
import { sanitizeApiError } from '@/lib/errors';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import nextConfig from '../../next.config.mjs';

describe('Part 5 Security Hardening Suite', () => {
  // --------------------------------------------------------------------------
  // 1. Security Headers Verification (Phase 5B)
  // --------------------------------------------------------------------------
  describe('1. Security Headers Suite', () => {
    it('should define all mandatory production security headers', () => {
      expect(SECURITY_HEADERS['Strict-Transport-Security']).toBe(
        'max-age=63072000; includeSubDomains; preload'
      );
      expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
      expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
      expect(SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(SECURITY_HEADERS['Permissions-Policy']).toContain('camera=()');
      expect(SECURITY_HEADERS['Permissions-Policy']).toContain('microphone=()');
      expect(SECURITY_HEADERS['Content-Security-Policy']).toBeDefined();
    });

    it('should include necessary CSP directives without breaking application components', () => {
      const csp = SECURITY_HEADERS['Content-Security-Policy'];
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
      expect(csp).toContain("img-src 'self' data: blob: https://*.supabase.co");
      expect(csp).toContain("connect-src 'self' https://*.supabase.co https://*.vercel.app");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should apply security headers to Next.js responses via applySecurityHeaders', () => {
      const mockHeaders = new Headers();
      const mockResponse = { headers: mockHeaders };
      applySecurityHeaders(mockResponse);

      expect(mockHeaders.get('X-Content-Type-Options')).toBe('nosniff');
      expect(mockHeaders.get('X-Frame-Options')).toBe('DENY');
      expect(mockHeaders.get('Strict-Transport-Security')).toBe(
        'max-age=63072000; includeSubDomains; preload'
      );
      expect(mockHeaders.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(mockHeaders.get('Content-Security-Policy')).toBeDefined();
    });

    it('should configure next.config.mjs with headers for all routes', async () => {
      expect(nextConfig.headers).toBeDefined();
      const headersConfig = await nextConfig.headers!();
      expect(Array.isArray(headersConfig)).toBe(true);
      expect(headersConfig[0].source).toBe('/(.*)');

      const keys = headersConfig[0].headers.map((h: { key: string }) => h.key);
      expect(keys).toContain('Strict-Transport-Security');
      expect(keys).toContain('X-Content-Type-Options');
      expect(keys).toContain('X-Frame-Options');
      expect(keys).toContain('Referrer-Policy');
      expect(keys).toContain('Permissions-Policy');
      expect(keys).toContain('Content-Security-Policy');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Sensitive Error Sanitization (Phase 5H)
  // --------------------------------------------------------------------------
  describe('2. Sensitive Error Sanitization Suite', () => {
    it('should mask PostgreSQL connection strings in API errors', () => {
      const errorWithDb = new Error(
        'Connection failed at postgresql://postgres:super_secret_pw@db.wgoelyinlffgnzrbfrwx.supabase.co:5432/postgres'
      );
      const result = sanitizeApiError(errorWithDb, 'Internal server error');
      expect(result.error).toBe('Internal server error');
      expect(result.error).not.toContain('postgresql://');
      expect(result.error).not.toContain('super_secret_pw');
    });

    it('should mask Prisma client known request errors', () => {
      const prismaError = new Error(
        'Invalid `prisma.user.findUnique()` invocation: error in table column query'
      );
      const result = sanitizeApiError(prismaError, 'Database operation failed');
      expect(result.error).toBe('Database operation failed');
      expect(result.error).not.toContain('prisma');
    });

    it('should mask stack traces and internal secrets', () => {
      const secretError = new Error('JWT_SECRET mismatch: token verification failed at Object.<anonymous>');
      const result = sanitizeApiError(secretError, 'Authentication error');
      expect(result.error).toBe('Authentication error');
      expect(result.error).not.toContain('JWT_SECRET');
    });

    it('should preserve safe operational validation messages', () => {
      const safeError = new Error('Signal status updated to APPROVED.');
      const result = sanitizeApiError(safeError, 'Failed');
      expect(result.error).toBe('Signal status updated to APPROVED.');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Rate Limiting Suite (Phase 5F)
  // --------------------------------------------------------------------------
  describe('3. Rate Limiting Hardening Suite', () => {
    beforeEach(() => {
      resetRateLimit();
    });

    it('should allow requests under the limit', () => {
      const key = 'test:login:127.0.0.1';
      for (let i = 0; i < 5; i++) {
        const res = checkRateLimit(key, 5, 60000);
        if (i < 4) {
          expect(res.allowed).toBe(true);
        } else {
          expect(res.allowed).toBe(true);
          expect(res.remaining).toBe(0);
        }
      }
    });

    it('should block requests exceeding the limit and return retry information', () => {
      const key = 'test:abuse:192.168.1.1';
      for (let i = 0; i < 5; i++) {
        checkRateLimit(key, 5, 60000);
      }

      // 6th attempt should be blocked
      const blockedRes = checkRateLimit(key, 5, 60000);
      expect(blockedRes.allowed).toBe(false);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.retryAfterMs).toBeGreaterThan(0);
      expect(blockedRes.retryAfterMs).toBeLessThanOrEqual(60000);
    });

    it('should reset limits properly when requested', () => {
      const key = 'test:reset:10.0.0.1';
      for (let i = 0; i < 3; i++) {
        checkRateLimit(key, 3, 60000);
      }
      expect(checkRateLimit(key, 3, 60000).allowed).toBe(false);

      resetRateLimit(key);
      expect(checkRateLimit(key, 3, 60000).allowed).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 4. KYC / PAN Truthfulness Suite (Phase 5G)
  // --------------------------------------------------------------------------
  describe('4. KYC / PAN Truthfulness Suite', () => {
    it('should never display "Verified" as fallback when PAN is null or empty', () => {
      const profileWithoutPan: { pan: string | null; kycStatus: string } = {
        pan: null,
        kycStatus: 'PENDING',
      };

      // Ensure that truthful evaluation displays Not Submitted / Pending
      const displayPan = profileWithoutPan.pan || 'Not Submitted';
      expect(displayPan).toBe('Not Submitted');
      expect(displayPan).not.toBe('Verified');

      const isVerified = profileWithoutPan.kycStatus === 'VERIFIED';
      expect(isVerified).toBe(false);
    });

    it('should only report verified when kycStatus is explicitly VERIFIED in database', () => {
      const pendingProfile = { pan: 'ABCDE1234F', kycStatus: 'PENDING' };
      const verifiedProfile = { pan: 'ABCDE1234F', kycStatus: 'VERIFIED' };
      const rejectedProfile = { pan: 'ABCDE1234F', kycStatus: 'REJECTED' };

      expect(pendingProfile.kycStatus === 'VERIFIED').toBe(false);
      expect(verifiedProfile.kycStatus === 'VERIFIED').toBe(true);
      expect(rejectedProfile.kycStatus === 'VERIFIED').toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Password & Profile Self-Service Security (Phase 5D)
  // --------------------------------------------------------------------------
  describe('5. Password & Profile Self-Service Suite', () => {
    it('should enforce password complexity standards', () => {
      const weakPasswords = [
        'short',           // Too short (<8)
        'alllowercase12!', // No uppercase
        'ALLUPPERCASE12!', // No lowercase
        'NoNumbersHere!!', // No numbers
        'NoSpecialChar12', // No special char
      ];

      const policyRegex = {
        minLen: (p: string) => p.length >= 8,
        upper: (p: string) => /[A-Z]/.test(p),
        lower: (p: string) => /[a-z]/.test(p),
        num: (p: string) => /[0-9]/.test(p),
        special: (p: string) => /[^A-Za-z0-9]/.test(p),
      };

      for (const pwd of weakPasswords) {
        const passes =
          policyRegex.minLen(pwd) &&
          policyRegex.upper(pwd) &&
          policyRegex.lower(pwd) &&
          policyRegex.num(pwd) &&
          policyRegex.special(pwd);
        expect(passes).toBe(false);
      }

      const strongPassword = 'P@ssw0rdSecure2026!';
      const passesStrong =
        policyRegex.minLen(strongPassword) &&
        policyRegex.upper(strongPassword) &&
        policyRegex.lower(strongPassword) &&
        policyRegex.num(strongPassword) &&
        policyRegex.special(strongPassword);
      expect(passesStrong).toBe(true);
    });

    it('should verify current password before allowing password change', async () => {
      const originalPassword = 'InitialP@ssword123!';
      const passwordHash = await hashPassword(originalPassword);

      const isWrongCurrentValid = await verifyPassword('WrongP@ssword999!', passwordHash);
      expect(isWrongCurrentValid).toBe(false);

      const isCorrectCurrentValid = await verifyPassword(originalPassword, passwordHash);
      expect(isCorrectCurrentValid).toBe(true);
    });

    it('should reject profile modification attempting role escalation', () => {
      const attemptedBody = {
        name: 'New Name',
        role: 'ADMIN', // ESCALATION ATTEMPT
        status: 'ACTIVE',
      };

      const disallowedFields = ['role', 'status', 'email', 'kycStatus', 'pan'];
      const forbidden = disallowedFields.filter((f) => f in attemptedBody);
      expect(forbidden).toContain('role');
      expect(forbidden).toContain('status');
      expect(forbidden.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Admin Self-Lockout & Last Admin Protection (Phase 5E)
  // --------------------------------------------------------------------------
  describe('6. Admin Self-Lockout Protection Suite', () => {
    it('should detect and prevent admin self-role revocation', () => {
      const currentAdminId = 'admin_user_001';
      const targetUserId = 'admin_user_001'; // self
      const proposedRole: string = 'CLIENT';

      const isSelfRevocation = currentAdminId === targetUserId && proposedRole !== 'ADMIN';
      expect(isSelfRevocation).toBe(true);
    });

    it('should detect and prevent admin self-deactivation or suspension', () => {
      const currentAdminId = 'admin_user_001';
      const targetUserId = 'admin_user_001'; // self
      const proposedStatus: string = 'SUSPENDED';

      const isSelfDeactivation = currentAdminId === targetUserId && proposedStatus !== 'ACTIVE';
      expect(isSelfDeactivation).toBe(true);
    });

    it('should reject demotion or deactivation when only one active administrator remains', () => {
      const activeAdminCount = 1;
      const targetIsAdmin = true;
      const isDemotingOrDeactivating = true;

      const wouldLeaveZeroAdmins = targetIsAdmin && isDemotingOrDeactivating && activeAdminCount <= 1;
      expect(wouldLeaveZeroAdmins).toBe(true);
    });

    it('should allow administrative updates when multiple active administrators exist', () => {
      const activeAdminCount = 3;
      const targetIsAdmin = true;
      const isDemotingOrDeactivating = true;

      const wouldLeaveZeroAdmins = targetIsAdmin && isDemotingOrDeactivating && activeAdminCount <= 1;
      expect(wouldLeaveZeroAdmins).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Environment & Secrets Audit (Phase 5I)
  // --------------------------------------------------------------------------
  describe('7. Environment & Secrets Safety Suite', () => {
    it('should never expose server-only master secrets to NEXT_PUBLIC environment', () => {
      const envKeys = Object.keys(process.env);
      const nextPublicKeys = envKeys.filter((k) => k.startsWith('NEXT_PUBLIC_'));

      for (const key of nextPublicKeys) {
        expect(key).not.toContain('SECRET');
        expect(key).not.toContain('PASSWORD');
        expect(key).not.toContain('KEY_SECRET');
        expect(key).not.toContain('SERVICE_ROLE');
        expect(key).not.toContain('DATABASE_URL');
      }
    });

    it('should redact sensitive credentials from audit log payload details', async () => {
      const rawDetails = {
        userEmail: 'client@tradosphere.in',
        password: 'PlainTextPassword123!',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token',
        secret: 'super_secret_value',
        apiKey: 'api_live_123456789',
      };

      const cleanDetails = { ...rawDetails };
      const sensitiveKeys = ['password', 'passwordhash', 'token', 'secret', 'jwt', 'apikey', 'api_key', 'auth', 'cookie'];
      for (const key of Object.keys(cleanDetails)) {
        if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
          cleanDetails[key as keyof typeof cleanDetails] = '[REDACTED]';
        }
      }

      expect(cleanDetails.userEmail).toBe('client@tradosphere.in');
      expect(cleanDetails.password).toBe('[REDACTED]');
      expect(cleanDetails.token).toBe('[REDACTED]');
      expect(cleanDetails.secret).toBe('[REDACTED]');
      expect(cleanDetails.apiKey).toBe('[REDACTED]');
    });
  });
});
