import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { sanitizeApiError } from '@/lib/errors';
import { notifyEmployee } from '@/lib/notifications';

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
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
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
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to fetch leads'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user && user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid lead data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, phone, email, source, productInterest, notes, assignedEmployeeId } = parsed.data;

    const effectiveSource = user ? (source || 'DIRECT') : 'WEBSITE';
    const effectiveAssignedId = user
      ? (assignedEmployeeId || (user.role === 'EMPLOYEE' ? user.employeeProfile?.id : null))
      : null;

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email: email || null,
        source: effectiveSource,
        productInterest: productInterest || 'GENERAL',
        notes: notes || null,
        assignedEmployeeId: effectiveAssignedId,
        status: 'NEW_LEAD',
      },
    });

    await logActivity({
      actorUserId: user ? user.id : null,
      actorRole: user ? user.role : 'ANONYMOUS',
      action: 'LEAD_CREATE',
      entityType: 'Lead',
      entityId: lead.id,
      details: { name: lead.name, productInterest: lead.productInterest, source: effectiveSource },
    });

    if (lead.assignedEmployeeId && user?.employeeProfile?.id !== lead.assignedEmployeeId) {
      await notifyEmployee({
        employeeId: lead.assignedEmployeeId,
        title: 'New Lead Assigned',
        message: `Lead "${lead.name}" (${lead.productInterest}) has been assigned to you.`,
        category: 'LEAD',
        linkUrl: '/employee/leads',
      });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to create lead'), { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
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

    // Horizontal access & assignment permission rules:
    // 1. If assignedEmployeeId is provided:
    //    - ADMIN can assign or reassign any lead to any employee.
    //    - EMPLOYEE can only assign an unassigned lead (existing.assignedEmployeeId === null) to themselves.
    //    - EMPLOYEE cannot reassign another employee's lead to anyone else.
    const isReassigning = assignedEmployeeId !== undefined && assignedEmployeeId !== existing.assignedEmployeeId;
    if (isReassigning) {
      if (user.role === 'EMPLOYEE') {
        const myEmpId = user.employeeProfile?.id;
        const isClaimingUnassigned = existing.assignedEmployeeId === null && assignedEmployeeId === myEmpId;
        if (!isClaimingUnassigned) {
          return NextResponse.json(
            { error: 'Forbidden: Only administrators can reassign leads between staff' },
            { status: 403 }
          );
        }
      }
    }

    // 2. If employee is updating status or notes:
    //    - Must be assigned to this lead, or lead is unassigned, or user is ADMIN
    if (user.role === 'EMPLOYEE' && existing.assignedEmployeeId && existing.assignedEmployeeId !== user.employeeProfile?.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update leads assigned to you' },
        { status: 403 }
      );
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes && { notes: `${existing.notes || ''}\n[${new Date().toISOString()}] ${notes}` }),
        ...(assignedEmployeeId !== undefined && { assignedEmployeeId }),
      },
    });

    if (isReassigning) {
      await logActivity({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'LEAD_ASSIGN',
        entityType: 'Lead',
        entityId: updated.id,
        details: {
          previousAssignee: existing.assignedEmployeeId,
          newAssignee: assignedEmployeeId,
          leadName: existing.name,
        },
      });

      if (assignedEmployeeId && assignedEmployeeId !== user.employeeProfile?.id) {
        await notifyEmployee({
          employeeId: assignedEmployeeId,
          title: 'Lead Assigned to You',
          message: `Lead "${existing.name}" (${existing.productInterest}) has been assigned to you.`,
          category: 'LEAD',
          linkUrl: '/employee/leads',
        });
      }
    }

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
    return NextResponse.json(sanitizeApiError(error, 'Failed to update lead'), { status: 500 });
  }
}
