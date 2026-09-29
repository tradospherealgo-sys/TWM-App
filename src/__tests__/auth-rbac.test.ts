import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken, getRoleDashboardPath } from '../lib/auth';

describe('Authentication & RBAC Security Suite', () => {
  it('should hash and verify passwords correctly', async () => {
    const password = 'TestSecretPassword123!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('should sign and verify edge JWT session tokens', async () => {
    const payload = {
      userId: 'user_123',
      email: 'client@tradosphere.in',
      role: 'CLIENT' as const,
      name: 'Aditya Mehta',
    };

    const token = await signSessionToken(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.role).toBe('CLIENT');
  });

  it('should reject invalid or tampered tokens', async () => {
    const verified = await verifySessionToken('invalid.token.here');
    expect(verified).toBeNull();
  });

  it('should map roles to their distinct dashboard paths', () => {
    expect(getRoleDashboardPath('ADMIN')).toBe('/admin');
    expect(getRoleDashboardPath('EMPLOYEE')).toBe('/employee');
    expect(getRoleDashboardPath('CLIENT')).toBe('/home');
    expect(getRoleDashboardPath('UNKNOWN')).toBe('/home');
  });
});
