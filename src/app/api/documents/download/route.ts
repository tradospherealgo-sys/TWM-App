import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const docId = searchParams.get('id');

  if (!key && !docId) {
    return NextResponse.json({ error: 'Missing document key or ID' }, { status: 400 });
  }

  try {
    let fileKeyToUse = key;

    // If docId is provided, check role permissions
    if (docId) {
      const doc = await prisma.document.findUnique({
        where: { id: docId },
      });

      if (!doc) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      // Role check: Client can only download their own documents
      if (user.role === 'CLIENT' && doc.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
      }

      if (!fileKeyToUse && doc.fileUrl) {
        try {
          const u = new URL(doc.fileUrl, 'http://localhost');
          fileKeyToUse = u.searchParams.get('key');
        } catch {
          fileKeyToUse = path.basename(doc.fileUrl);
        }
      }
    }

    const safeKey = path.basename(fileKeyToUse || 'doc.pdf');
    const filePath = path.join(process.cwd(), 'uploads', safeKey);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found in storage vault' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeKey}"`,
      },
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
