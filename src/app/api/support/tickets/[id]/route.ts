import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { sanitizeApiError } from '@/lib/errors';

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assignedEmployeeId: z.string().nullable().optional(),
  resolutionNotes: z.string().optional(),
});

export async function PATCH(
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
    const parsed = updateTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update format', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, assignedEmployeeId, resolutionNotes } = parsed.data;

    const existing = await prisma.supportTicket.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(assignedEmployeeId !== undefined && { assignedEmployeeId }),
        ...(resolutionNotes !== undefined && { resolutionNotes }),
      },
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'SUPPORT_TICKET_UPDATE',
      entityType: 'SupportTicket',
      entityId: params.id,
      details: {
        previousStatus: existing.status,
        newStatus: status || existing.status,
        hasNotes: Boolean(resolutionNotes),
      },
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error: any) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to update ticket'), { status: 500 });
  }
}
