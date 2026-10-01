import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { canVerifyDocument } from '@/lib/documents/authorization';
import { sanitizeApiError } from '@/lib/errors';
import { createNotification } from '@/lib/notifications';

const verifySchema = z
  .object({
    status: z.enum(['VERIFIED', 'REJECTED']).optional(),
    verificationStatus: z.enum(['VERIFIED', 'REJECTED']).optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.status || data.verificationStatus, {
    message: 'Either status or verificationStatus is required',
  });

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid verification format' }, { status: 400 });
    }

    const status = (parsed.data.status || parsed.data.verificationStatus)!;
    const { notes } = parsed.data;

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { id: true, userId: true, assignedEmployeeId: true } },
        application: { select: { id: true, assignedEmployeeId: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const auth = await canVerifyDocument(user, document);
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.reason || 'Forbidden: Cannot verify document' }, { status: auth.status });
    }

    const updated = await prisma.document.update({
      where: { id: params.id },
      data: {
        status,
        notes,
        verifiedByEmployeeId: user.employeeProfile?.id || null,
      },
    });

    // Notify the customer about the verification outcome
    const targetUserId = document.userId || document.customer?.userId;
    if (targetUserId) {
      if (status === 'VERIFIED') {
        await createNotification({
          userId: targetUserId,
          title: 'Document Verified',
          message: `Your document "${document.title}" (${document.documentType}) has been verified successfully.`,
          category: 'KYC',
          linkUrl: '/documents',
        });
      } else if (status === 'REJECTED') {
        await createNotification({
          userId: targetUserId,
          title: 'Document Action Required',
          message: `Your document "${document.title}" (${document.documentType}) requires attention. Reason: ${notes || 'Please upload a clear copy.'}`,
          category: 'KYC',
          linkUrl: '/documents',
        });
      }
    }

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'DOC_VERIFY',
      entityType: 'Document',
      entityId: params.id,
      details: { documentType: document.documentType, status, notes },
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error: any) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to verify document'), { status: 500 });
  }
}
