import crypto from 'crypto';

/**
 * TWM Application-Level Credential Encryption Vault
 * 
 * Complies with Section 7 of TWM Master Specification:
 * - Credentials entered through Admin -> Integrations are encrypted at rest using AES-256-GCM.
 * - Master key derived from deployment-level bootstrap secret (INTEGRATION_ENCRYPTION_KEY / JWT_SECRET).
 * - Master key itself is NEVER stored in the database.
 * - Masked representations (e.g. ••••••••••••abcd) are displayed in UI; plaintext is never returned over API.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

function getMasterKey(): Buffer {
  const secret =
    process.env.INTEGRATION_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'twm_production_default_master_encryption_key_change_in_env_32_bytes!';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns payload in format: `ivHex:authTagHex:encryptedHex`
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext || plaintext.trim().length === 0) return '';
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a ciphertext string using AES-256-GCM
 * Validates cryptographic auth tag to prevent tampering
 */
export function decryptSecret(payload: string): string {
  if (!payload || !payload.includes(':')) return '';
  const parts = payload.split(':');
  if (parts.length !== 3) return '';

  const [ivHex, authTagHex, encryptedHex] = parts;
  try {
    const key = getMasterKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // Decryption failure (tampered payload or invalid master key)
    return '';
  }
}

/**
 * Produce masked representation for safe display in Admin Panel
 * Example: `••••••••••••abcd` or `••••••••` for short tokens
 */
export function maskSecret(secret: string): string {
  if (!secret) return '';
  const trimmed = secret.trim();
  if (trimmed.length <= 4) {
    return '••••••••';
  }
  const last4 = trimmed.slice(-4);
  return `••••••••••••${last4}`;
}

/**
 * Check if a string is already in masked format (e.g. from UI input)
 */
export function isMaskedString(val: string): boolean {
  if (!val) return false;
  return val.startsWith('••••') || val.includes('••••••••');
}

/**
 * Encrypt a dictionary of secrets and return encrypted string + masked representation map
 */
export function encryptSecretsMap(secrets: Record<string, string>): {
  encryptedJson: string;
  maskedJson: string;
} {
  const plainJson = JSON.stringify(secrets);
  const encryptedPayload = encryptSecret(plainJson);

  const maskedMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(secrets)) {
    maskedMap[k] = maskSecret(v);
  }

  return {
    encryptedJson: encryptedPayload,
    maskedJson: JSON.stringify(maskedMap),
  };
}

/**
 * Decrypt an encrypted JSON string into a dictionary of secrets
 */
export function decryptSecretsMap(encryptedPayload: string): Record<string, string> {
  if (!encryptedPayload) return {};
  const decryptedJson = decryptSecret(encryptedPayload);
  if (!decryptedJson) return {};
  try {
    return JSON.parse(decryptedJson);
  } catch {
    return {};
  }
}
