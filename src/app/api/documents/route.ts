import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { uploadVaultFile, deleteVaultFile, sanitizeFilename } from '@/lib/storage';
import { canDeleteDocument } from '@/lib/documents/authorization';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'text/plain',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    let whereClause: any = {};

    if (user.role === 'CLIENT') {
      whereClause = { userId: user.id };
    } else if (user.role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { id: true, department: true, designation: true },
      });

      if (!employee) {
        return NextResponse.json({ error: 'Employee profile not found' }, { status: 403 });
      }

      const dept = (employee.department || '').toLowerCase();
      const isComplianceOrOps = dept.includes('compliance') || dept.includes('operations');

      if (customerId) {
        if (!isComplianceOrOps) {
          // Verify assignment
          const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { assignedEmployeeId: true },
          });
          if (!customer || customer.assignedEmployeeId !== employee.id) {
            return NextResponse.json(
              { error: 'Forbidden: You are not assigned to this customer' },
              { status: 403 }
            );
          }
        }
        whereClause = { customerId };
      } else if (!isComplianceOrOps) {
        // Staff without specific customer filter only see documents of assigned customers
        whereClause = {
          customer: { assignedEmployeeId: employee.id },
        };
      }
    } else if (customerId) {
      // ADMIN with customer filter
      whereClause = { customerId };
    }

    const rawDocuments = await prisma.document.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true } },
        application: { select: { applicationNumber: true, productCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mask internal storage keys: return authoritative download URL
    const documents = rawDocuments.map((doc) => ({
      ...doc,
      fileUrl: `/api/documents/download?id=${doc.id}`,
    }));

    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const rawTitle = (formData.get('title') as string) || '';
    const documentType = (formData.get('documentType') as string) || 'PAN';
    const applicationId = (formData.get('applicationId') as string) || null;
    const targetCustomerId = (formData.get('customerId') as string) || null;
    const file = formData.get('file') as File | null;

    const title = rawTitle.trim() || `${documentType} Document`;

    // Determine target user and customer ID
    let targetUserId = user.id;
    let customerId = user.customerProfile?.id || null;

    if (user.role === 'EMPLOYEE' || user.role === 'ADMIN') {
      if (targetCustomerId) {
        const customer = await prisma.customer.findUnique({
          where: { id: targetCustomerId },
          select: { id: true, userId: true, assignedEmployeeId: true },
        });

        if (!customer) {
          return NextResponse.json({ error: 'Specified customer does not exist' }, { status: 404 });
        }

        if (user.role === 'EMPLOYEE') {
          const employee = await prisma.employee.findUnique({
            where: { userId: user.id },
            select: { id: true, department: true },
          });

          const isComplianceOrOps = (employee?.department || '').toLowerCase().includes('operations');
          if (!isComplianceOrOps && customer.assignedEmployeeId !== employee?.id) {
            return NextResponse.json(
              { error: 'Forbidden: You are not assigned to upload for this customer' },
              { status: 403 }
            );
          }
        }

        customerId = customer.id;
        targetUserId = customer.userId;
      }
    }

    let buffer: Buffer;
    let mimeType = 'application/pdf';
    let filename = `${documentType.toLowerCase()}.pdf`;

    if (file && typeof file.arrayBuffer === 'function') {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB` },
          { status: 400 }
        );
      }

      mimeType = file.type || 'application/pdf';
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${mimeType}. Allowed: PDF, PNG, JPEG.` },
          { status: 400 }
        );
      }

      filename = sanitizeFilename(file.name || filename);
      buffer = fileBuffer;
    } else {
      // Empty content or metadata receipt
      const receiptContent = `TWM Verified Document Upload Receipt\nDocument: ${title}\nType: ${documentType}\nAccount: ${targetUserId}\nTimestamp: ${new Date().toISOString()}`;
      buffer = Buffer.from(receiptContent, 'utf-8');
      mimeType = 'text/plain';
      filename = `${documentType.toLowerCase()}_receipt.txt`;
    }

    // Upload to private Supabase Storage vault
    const uploadResult = await uploadVaultFile(buffer, {
      userId: targetUserId,
      filename,
      mimeType,
    });

    // Create database Document record
    const document = await prisma.document.create({
      data: {
        userId: targetUserId,
        customerId,
        applicationId,
        title,
        documentType,
        fileUrl: uploadResult.storageKey,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        status: 'PENDING',
      },
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'DOCUMENT_UPLOAD',
      entityType: 'Document',
      entityId: document.id,
      details: { title, documentType, fileSize: uploadResult.fileSize },
    });

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        fileUrl: `/api/documents/download?id=${document.id}`,
      },
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document to secure vault' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const docId = searchParams.get('id');

  if (!docId) {
    return NextResponse.json({ error: 'Missing document ID parameter (?id=...)' }, { status: 400 });
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        customer: { select: { id: true, assignedEmployeeId: true } },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const auth = await canDeleteDocument(user, doc);
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.reason || 'Forbidden: Cannot delete document' }, { status: auth.status });
    }

    // Delete object from vault
    await deleteVaultFile(doc.fileUrl);

    // Delete database record
    await prisma.document.delete({ where: { id: doc.id } });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'DOCUMENT_DELETE',
      entityType: 'Document',
      entityId: doc.id,
      details: { title: doc.title, documentType: doc.documentType },
    });

    return NextResponse.json({ success: true, message: 'Document deleted from vault' });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
