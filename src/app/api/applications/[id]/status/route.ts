import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

const updateStatusSchema = z.object({
  status: z.enum([
    'NEW',
    'IN_PROGRESS',
    'DOCUMENTS_REQUIRED',
    'SUBMITTED',
    'UNDER_REVIEW',
    'COMPLETED',
    'REJECTED',
    'CANCELLED',
  ]),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only EMPLOYEE or ADMIN can update application status
  if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status update', details: parsed.error.flatten() }, { status: 400 });
    }

    const { status, notes } = parsed.data;

    const existing = await prisma.application.findUnique({
      where: { id: params.id },
      include: { customer: { include: { user: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Horizontal access control:
    // If EMPLOYEE, verify application is assigned to this employee
    if (
      user.role === 'EMPLOYEE' &&
      existing.assignedEmployeeId &&
      existing.assignedEmployeeId !== user.employeeProfile?.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden: You are not authorized to update applications assigned to other staff' },
        { status: 403 }
      );
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: {
        status,
        notes: notes ? `${existing.notes || ''}\n[${new Date().toISOString()}] ${notes}` : existing.notes,
      },
    });

    // Notify customer about the update
    if (existing.customer?.userId) {
      await prisma.notification.create({
        data: {
          userId: existing.customer.userId,
          title: `Application Status: ${status.replace(/_/g, ' ')}`,
          message: `Your application #${existing.applicationNumber} status has been updated to "${status.replace(/_/g, ' ')}".`,
          category: 'APPLICATION',
          linkUrl: '/applications',
        },
      });
    }

    // Write audit log
    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'APPLICATION_STATUS_UPDATE',
      entityType: 'Application',
      entityId: existing.id,
      details: {
        applicationNumber: existing.applicationNumber,
        previousStatus: existing.status,
        newStatus: status,
        notes,
      },
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
  }
}
