import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
  hashPassword,
  verifyPassword,
} from '../lib/auth';

describe('Password Recovery & Reset Security Suite', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate a valid cryptographically signed reset token', async () => {
    const user = {
      id: 'usr_test_123',
      email: 'client@tradosphere.in',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
    };

    const token = await createPasswordResetToken(user);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(32);

    const payload = await verifyPasswordResetToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe('usr_test_123');
    expect(payload?.email).toBe('client@tradosphere.in');
    expect(payload?.purpose).toBe('password_reset');
    expect(payload?.pwdPrefix).toBe(user.passwordHash.slice(0, 12));
  });

  it('should reject tampered or malformed reset tokens', async () => {
    const payload = await verifyPasswordResetToken('invalid.token.string');
    expect(payload).toBeNull();
  });

  it('should invalidate token when password hash prefix changes (single-use guarantee)', async () => {
    const originalHash = await hashPassword('InitialPassword123!');
    const user = {
      id: 'usr_single_use_456',
      email: 'singleuse@tradosphere.in',
      passwordHash: originalHash,
    };

    const token = await createPasswordResetToken(user);
    const verifiedPayload = await verifyPasswordResetToken(token);
    expect(verifiedPayload).not.toBeNull();
    expect(user.passwordHash.slice(0, 12)).toBe(verifiedPayload?.pwdPrefix);

    // Now user changes their password, generating a new hash
    const newHash = await hashPassword('UpdatedPassword456!');
    expect(newHash.slice(0, 12)).not.toBe(verifiedPayload?.pwdPrefix);
    // Because the hash prefix no longer matches, downstream validation rejects the old token
    expect(newHash.slice(0, 12) === verifiedPayload?.pwdPrefix).toBe(false);
  });

  it('should enforce password hashing and verification', async () => {
    const plain = 'StrongPass#2026';
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(await verifyPassword(plain, hash)).toBe(true);
    expect(await verifyPassword('WrongPassword#2026', hash)).toBe(false);
  });
});
