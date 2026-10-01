import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { sanitizeApiError } from '@/lib/errors';

const createFollowUpSchema = z.object({
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  scheduledAt: z.string(), // ISO string
  outcome: z.string().optional(),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'MISSED']).default('SCHEDULED'),
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
    const leadId = searchParams.get('leadId');
    const customerId = searchParams.get('customerId');

    const whereClause: Record<string, unknown> = {};
    if (leadId) whereClause.leadId = leadId;
    if (customerId) whereClause.customerId = customerId;

    if (user.role === 'EMPLOYEE' && user.employeeProfile) {
      whereClause.employeeId = user.employeeProfile.id;
    }

    const followUps = await prisma.followUp.findMany({
      where: whereClause,
      include: {
        lead: { select: { name: true, phone: true, productInterest: true } },
        customer: { include: { user: { select: { name: true, phone: true } } } },
        employee: { include: { user: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return NextResponse.json({ followUps });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to fetch follow-ups'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createFollowUpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid follow-up data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { leadId, customerId, scheduledAt, outcome, notes, nextAction, status } = parsed.data;

    let employeeId = user.employeeProfile?.id;
    if (!employeeId) {
      const defaultEmp = await prisma.employee.findFirst({ where: { status: 'ACTIVE' } });
      employeeId = defaultEmp?.id;
    }

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 400 });
    }

    const followUp = await prisma.followUp.create({
      data: {
        employeeId,
        leadId: leadId || null,
        customerId: customerId || null,
        scheduledAt: new Date(scheduledAt),
        outcome: outcome || null,
        notes: notes || null,
        nextAction: nextAction || null,
        status,
      },
    });

    // If next action is specified, auto-create a task
    if (nextAction && nextAction.trim().length > 0) {
      await prisma.task.create({
        data: {
          title: `Follow-up Task: ${nextAction}`,
          description: `Scheduled after interaction notes: ${notes || 'N/A'}`,
          leadId: leadId || null,
          customerId: customerId || null,
          assignedEmployeeId: employeeId,
          priority: 'MEDIUM',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'PENDING',
        },
      });
    }

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'FOLLOWUP_LOG',
      entityType: 'FollowUp',
      entityId: followUp.id,
      details: { leadId, customerId, status },
    });

    return NextResponse.json({ success: true, followUp });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to record follow-up'), { status: 500 });
  }
}
