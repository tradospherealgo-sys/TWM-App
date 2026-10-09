import fs from 'fs';
import path from 'path';

export interface UploadOptions {
  userId: string;
  filename: string;
  mimeType: string;
  docId?: string;
}

export interface UploadResult {
  storageKey: string;
  fileSize: number;
  mimeType: string;
}

export interface DownloadResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://wgoelyinlffgnzrbfrwx.supabase.co').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STORAGE_BUCKET = process.env.STORAGE_BUCKET_NAME || 'kyc-documents';
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'supabase';

/**
 * Sanitizes user-provided filename to prevent path traversal and malformed paths
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'document.pdf';
  // Strip null bytes, normalize backslashes to forward slashes, and take basename
  const normalized = filename.replace(/\0/g, '').replace(/\\/g, '/');
  const basename = path.posix.basename(normalized);
  const cleaned = basename
    .replace(/\.\.+/g, '.')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 100);

  return cleaned || 'document.pdf';
}

/**
 * Validates that a storage key does not attempt directory traversal
 */
export function isSafeStorageKey(storageKey: string): boolean {
  if (!storageKey || typeof storageKey !== 'string') return false;
  if (storageKey.includes('\0')) return false;
  if (storageKey.includes('..')) return false;
  if (path.isAbsolute(storageKey)) return false;
  return true;
}

/**
 * Upload a document buffer to the secure vault (Supabase Storage by default)
 */
export async function uploadVaultFile(
  buffer: Buffer,
  options: UploadOptions
): Promise<UploadResult> {
  const safeName = sanitizeFilename(options.filename);
  const docIdentifier = options.docId || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const relativePath = `customers/${options.userId}/${docIdentifier}_${safeName}`;

  if (STORAGE_DRIVER === 'supabase') {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'FATAL: Production KYC document vault requires valid SUPABASE_SERVICE_ROLE_KEY configured for Supabase cloud storage. Filesystem write is strictly disabled in production.'
        );
      }
    } else {
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${relativePath}`;

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': options.mimeType || 'application/pdf',
          'x-upsert': 'true',
        },
        body: new Uint8Array(buffer),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Supabase Storage Upload Error:', res.status, errText);
        throw new Error(`Failed to upload document to secure cloud vault: HTTP ${res.status}`);
      }

      return {
        storageKey: relativePath,
        fileSize: buffer.length,
        mimeType: options.mimeType || 'application/pdf',
      };
    }
  }

  // Local filesystem fallback (strictly permitted only in offline local development)
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: Production document storage requires an active cloud storage driver (Supabase) with valid credentials. Local filesystem write is strictly disabled in production.'
    );
  }

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localPath = path.join(uploadsDir, `${docIdentifier}_${safeName}`);
  fs.writeFileSync(localPath, buffer);

  return {
    storageKey: `${docIdentifier}_${safeName}`,
    fileSize: buffer.length,
    mimeType: options.mimeType || 'application/pdf',
  };
}

/**
 * Download a document buffer from the secure vault
 */
export async function downloadVaultFile(
  storageKey: string,
  fallbackMimeType = 'application/pdf'
): Promise<DownloadResult | null> {
  if (!isSafeStorageKey(storageKey)) {
    console.warn('Rejected unsafe storage key attempt:', storageKey);
    return null;
  }

  // Handle Supabase Storage path
  let objectPath = storageKey.trim();
  if (objectPath.startsWith(`${STORAGE_BUCKET}/`)) {
    objectPath = objectPath.substring(`${STORAGE_BUCKET}/`.length);
  }

  if (STORAGE_DRIVER === 'supabase' && SUPABASE_SERVICE_ROLE_KEY) {
    const downloadUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/${STORAGE_BUCKET}/${objectPath}`;

    const res = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const mime = res.headers.get('content-type') || fallbackMimeType;
      const filename = path.basename(objectPath) || 'document.pdf';

      return {
        buffer: Buffer.from(arrayBuffer),
        mimeType: mime,
        filename,
      };
    }

    // If cloud storage returned 404, check if it's a legacy local file before failing
    if (res.status !== 404) {
      console.error('Supabase Storage Download Error:', res.status, await res.text());
      return null;
    }
  }

  // Check local filesystem for backward compatibility in non-production environments only
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const safeLocalKey = path.basename(storageKey);
  const localFilePath = path.join(process.cwd(), 'uploads', safeLocalKey);

  if (fs.existsSync(localFilePath)) {
    const buffer = fs.readFileSync(localFilePath);
    return {
      buffer,
      mimeType: fallbackMimeType,
      filename: safeLocalKey,
    };
  }

  return null;
}

/**
 * Delete a document from the secure vault
 */
export async function deleteVaultFile(storageKey: string): Promise<boolean> {
  if (!isSafeStorageKey(storageKey)) {
    return false;
  }

  let objectPath = storageKey.trim();
  if (objectPath.startsWith(`${STORAGE_BUCKET}/`)) {
    objectPath = objectPath.substring(`${STORAGE_BUCKET}/`.length);
  }

  if (STORAGE_DRIVER === 'supabase' && SUPABASE_SERVICE_ROLE_KEY) {
    const deleteUrl = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}`;
    const res = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: [objectPath] }),
    });

    if (res.ok) {
      return true;
    }
  }

  // Also remove local file if present in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return true;
  }

  const safeLocalKey = path.basename(storageKey);
  const localFilePath = path.join(process.cwd(), 'uploads', safeLocalKey);
  if (fs.existsSync(localFilePath)) {
    try {
      fs.unlinkSync(localFilePath);
      return true;
    } catch {
      return false;
    }
  }

  return true;
}
