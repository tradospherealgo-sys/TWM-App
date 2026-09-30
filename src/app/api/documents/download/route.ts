import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { downloadVaultFile, isSafeStorageKey, sanitizeFilename } from '@/lib/storage';
import { canAccessDocument } from '@/lib/documents/authorization';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const docId = searchParams.get('id');
  const userProvidedKey = searchParams.get('key');
  const userProvidedPath = searchParams.get('path');

  // VULNERABILITY MITIGATION: Reject arbitrary user-controlled key/path access attempts
  if (!docId) {
    if (userProvidedKey || userProvidedPath) {
      return NextResponse.json(
        { error: 'Forbidden: Direct storage key access is prohibited. Provide valid document ID.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: 'Missing document ID parameter (?id=...)' }, { status: 400 });
  }

  // Validate format of document ID (cuid or alphanumeric)
  if (!/^[a-zA-Z0-9_-]{10,50}$/.test(docId)) {
    return NextResponse.json({ error: 'Invalid document ID format' }, { status: 400 });
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        customer: { select: { id: true, assignedEmployeeId: true } },
        application: { select: { id: true, assignedEmployeeId: true } },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Role and relationship ownership authorization check
    const auth = await canAccessDocument(user, doc);
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.reason || 'Forbidden: Access denied' }, { status: auth.status });
    }

    // Determine storage key from server-authoritative record
    let storageKey = doc.fileUrl;
    if (storageKey.startsWith('/api/documents/download?id=')) {
      // If legacy self-reference, derive from document parameters
      storageKey = `customers/${doc.userId}/${doc.id}_${sanitizeFilename(doc.title)}`;
    } else if (storageKey.includes('?key=')) {
      try {
        const u = new URL(storageKey, 'http://localhost');
        storageKey = u.searchParams.get('key') || doc.title;
      } catch {
        storageKey = doc.title;
      }
    }

    // Path traversal defense
    if (!isSafeStorageKey(storageKey)) {
      console.warn('Blocked path traversal attempt on document:', doc.id, storageKey);
      return NextResponse.json({ error: 'Malformed storage reference' }, { status: 400 });
    }

    // Download from private vault (Supabase Storage / local fallback)
    const file = await downloadVaultFile(storageKey, doc.mimeType);
    if (!file) {
      return NextResponse.json({ error: 'Document content unavailable in vault' }, { status: 404 });
    }

    // Log auditable access event
    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'DOCUMENT_DOWNLOAD',
      entityType: 'Document',
      entityId: doc.id,
      details: {
        title: doc.title,
        documentType: doc.documentType,
        targetUserId: doc.userId,
      },
    });

    const extension = doc.mimeType === 'application/pdf' ? 'pdf' : 'bin';
    const downloadName = sanitizeFilename(`${doc.title || 'document'}.${extension}`);

    return new NextResponse(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        'Content-Type': file.mimeType || doc.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });
  } catch (error: any) {
    console.error('Download route error:', error);
    return NextResponse.json({ error: 'Failed to process document request' }, { status: 500 });
  }
}
