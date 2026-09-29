import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

const createLeadSchema = z.object({
  name: z.string().min(1, 'Lead name required'),
  phone: z.string().min(10, 'Valid phone required'),
  email: z.string().email().optional().or(z.literal('')),
  source: z.string().default('DIRECT'),
  productInterest: z.string().default('GENERAL'),
  notes: z.string().optional(),
  assignedEmployeeId: z.string().optional(),
});

const updateLeadSchema = z.object({
  id: z.string(),
  status: z
    .enum([
      'NEW_LEAD',
      'CONTACTED',
      'INTERESTED',
      'FOLLOW_UP',
      'DOCUMENTS_REQUIRED',
      'APPLICATION',
      'SUBMITTED',
      'COMPLETED',
      'LOST_CLOSED',
    ])
    .optional(),
  notes: z.string().optional(),
  assignedEmployeeId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const whereClause: Record<string, unknown> = {};

  if (user.role === 'EMPLOYEE' && user.employeeProfile) {
    // Optional filter: assigned to this employee or unassigned
    const viewAll = searchParams.get('all') === 'true';
    if (!viewAll) {
      whereClause.OR = [
        { assignedEmployeeId: user.employeeProfile.id },
        { assignedEmployeeId: null },
      ];
    }
  }

  if (status) {
    whereClause.status = status;
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where: whereClause,
    include: {
      assignedEmployee: {
        include: { user: { select: { name: true, email: true } } },
      },
      tasks: {
        where: { status: { not: 'COMPLETED' } },
        orderBy: { dueDate: 'asc' },
      },
      followUps: {
        orderBy: { scheduledAt: 'desc' },
        take: 3,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ leads });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid lead data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, phone, email, source, productInterest, notes, assignedEmployeeId } = parsed.data;

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email: email || null,
        source,
        productInterest,
        notes,
        assignedEmployeeId: assignedEmployeeId || (user.role === 'EMPLOYEE' ? user.employeeProfile?.id : null),
        status: 'NEW_LEAD',
      },
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'LEAD_CREATE',
      entityType: 'Lead',
      entityId: lead.id,
      details: { name: lead.name, productInterest: lead.productInterest },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { id, status, notes, assignedEmployeeId } = parsed.data;

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes && { notes: `${existing.notes || ''}\n[${new Date().toISOString()}] ${notes}` }),
        ...(assignedEmployeeId !== undefined && { assignedEmployeeId }),
      },
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'LEAD_UPDATE',
      entityType: 'Lead',
      entityId: updated.id,
      details: { previousStatus: existing.status, newStatus: status },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}
