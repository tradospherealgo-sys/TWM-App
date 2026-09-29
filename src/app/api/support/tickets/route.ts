import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

const createTicketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  applicationId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let whereClause: any = {};

    if (user.role === 'CLIENT') {
      whereClause = { userId: user.id };
    } else if (user.role === 'EMPLOYEE' && user.employeeProfile) {
      // Employee sees tickets assigned to them or unassigned open tickets
      whereClause = {
        OR: [
          { assignedEmployeeId: user.employeeProfile.id },
          { assignedEmployeeId: null },
        ],
      };
    }
    // Admin sees all tickets (whereClause = {})

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        application: { select: { applicationNumber: true, productCode: true } },
        assignedEmployee: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid ticket data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { subject, description, priority, applicationId } = parsed.data;

    // Generate unique human-readable ticket number e.g. TWM-TCK-2026-1042
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TWM-TCK-${new Date().getFullYear()}-${randomSuffix}`;

    // Auto-assign to customer's relationship officer if available
    let assignedEmployeeId = null;
    if (user.customerProfile?.assignedEmployeeId) {
      assignedEmployeeId = user.customerProfile.assignedEmployeeId;
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: user.id,
        subject,
        description,
        priority,
        applicationId: applicationId || null,
        assignedEmployeeId,
        status: 'OPEN',
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'SUPPORT_TICKET_CREATE',
      entityType: 'SupportTicket',
      entityId: ticket.id,
      details: { ticketNumber, subject, priority },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 });
  }
}
