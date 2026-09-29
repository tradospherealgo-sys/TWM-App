import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    let whereClause: any = {};

    if (user.role === 'CLIENT') {
      whereClause = { userId: user.id };
    } else if (customerId) {
      whereClause = { customerId };
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true } },
        application: { select: { applicationNumber: true, productCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const title = (formData.get('title') as string) || 'Document';
    const documentType = (formData.get('documentType') as string) || 'PAN';
    const applicationId = (formData.get('applicationId') as string) || null;
    const file = formData.get('file') as File | null;

    let fileSize = 0;
    let mimeType = 'application/pdf';
    let fileKey = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.pdf`;

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (file && typeof file.arrayBuffer === 'function') {
      const buffer = Buffer.from(await file.arrayBuffer());
      fileSize = buffer.length;
      mimeType = file.type || 'application/pdf';
      fileKey = `doc_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      fs.writeFileSync(path.join(uploadsDir, fileKey), buffer);
    } else {
      // Create a secure placeholder receipt file
      const dummyContent = `TWM Secure Document Record\nTitle: ${title}\nType: ${documentType}\nUploaded By: ${user.email}\nDate: ${new Date().toISOString()}`;
      fs.writeFileSync(path.join(uploadsDir, fileKey), dummyContent);
      fileSize = dummyContent.length;
      mimeType = 'text/plain';
    }

    const customerId = user.customerProfile?.id || null;

    const document = await prisma.document.create({
      data: {
        userId: user.id,
        customerId,
        applicationId,
        title,
        documentType,
        fileUrl: `/api/documents/download?key=${encodeURIComponent(fileKey)}`,
        fileSize,
        mimeType,
        status: 'PENDING',
      },
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'DOCUMENT_UPLOAD',
      entityType: 'Document',
      entityId: document.id,
      details: { title, documentType, fileSize },
    });

    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
