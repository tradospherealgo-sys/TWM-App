import { describe, it, expect } from 'vitest';
import {
  encryptSecret,
  decryptSecret,
  maskSecret,
  isMaskedString,
  encryptSecretsMap,
  decryptSecretsMap,
} from '../lib/encryption';

describe('TWM Credential Encryption Vault', () => {
  it('should encrypt and decrypt a plaintext secret accurately', () => {
    const rawSecret = 'upstox_live_api_token_9876543210_secret_key';
    const encrypted = encryptSecret(rawSecret);

    expect(encrypted).not.toBe(rawSecret);
    expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:ciphertext

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(rawSecret);
  });

  it('should reject tampered ciphertext with GCM auth tag verification', () => {
    const rawSecret = 'confidential_jwt_or_broker_secret';
    const encrypted = encryptSecret(rawSecret);
    const parts = encrypted.split(':');

    // Tamper with the encrypted ciphertext
    const tamperedCiphertext = parts[2].slice(0, -2) + (parts[2].endsWith('a') ? 'b' : 'a');
    const tamperedPayload = `${parts[0]}:${parts[1]}:${tamperedCiphertext}`;

    const decrypted = decryptSecret(tamperedPayload);
    expect(decrypted).toBe(''); // Tampering caught, returns empty string safely
  });

  it('should mask sensitive credentials without revealing the body', () => {
    expect(maskSecret('secret')).toBe('••••••••••••cret');
    expect(maskSecret('1234567890abcdef')).toBe('••••••••••••cdef');
    expect(maskSecret('abc')).toBe('••••••••');
    expect(isMaskedString('••••••••••••cdef')).toBe(true);
    expect(isMaskedString('normal_unmasked_text')).toBe(false);
  });

  it('should encrypt and decrypt multi-field credential dictionaries', () => {
    const secrets = {
      clientId: 'UPSTOX_CLIENT_123',
      clientSecret: 'secret_abc_xyz_789',
      accessToken: 'access_token_token_long_value_456',
    };

    const { encryptedJson, maskedJson } = encryptSecretsMap(secrets);
    expect(encryptedJson).not.toContain('UPSTOX_CLIENT_123');

    const maskedMap = JSON.parse(maskedJson);
    expect(maskedMap.clientId).toBe('••••••••••••_123');
    expect(maskedMap.clientSecret).toBe('••••••••••••_789');

    const decryptedSecrets = decryptSecretsMap(encryptedJson);
    expect(decryptedSecrets).toEqual(secrets);
  });
});
