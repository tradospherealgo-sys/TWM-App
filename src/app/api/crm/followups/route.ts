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

const updateFollowUpSchema = z.object({
  id: z.string().min(1, 'Follow-up ID required'),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'MISSED']).optional(),
  outcome: z.string().optional(),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  scheduledAt: z.string().optional(),
});

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
    const parsed = updateFollowUpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid follow-up update data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, status, outcome, notes, nextAction, scheduledAt } = parsed.data;

    const existing = await prisma.followUp.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, name: true } },
        customer: { select: { id: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    // Horizontal access control:
    // Only the assigned employee or an administrator may update/complete a follow-up
    if (user.role === 'EMPLOYEE' && existing.employeeId !== user.employeeProfile?.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update follow-up calls assigned to you' },
        { status: 403 }
      );
    }

    const updated = await prisma.followUp.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(outcome !== undefined && { outcome }),
        ...(notes !== undefined && { notes: notes ? `${existing.notes || ''}\n[${new Date().toISOString()}] ${notes}` : existing.notes }),
        ...(nextAction !== undefined && { nextAction }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      },
    });

    // If next action is specified on completion, auto-create a task
    if (nextAction && nextAction.trim().length > 0) {
      await prisma.task.create({
        data: {
          title: `Next Action: ${nextAction.trim()}`,
          description: `Outcome from follow-up: ${outcome || 'Completed'}. Notes: ${notes || 'N/A'}`,
          leadId: existing.leadId,
          customerId: existing.customerId,
          assignedEmployeeId: existing.employeeId,
          priority: 'MEDIUM',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'PENDING',
        },
      });
    }

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: status === 'COMPLETED' ? 'FOLLOWUP_COMPLETE' : 'FOLLOWUP_UPDATE',
      entityType: 'FollowUp',
      entityId: id,
      details: {
        previousStatus: existing.status,
        newStatus: status || existing.status,
        outcome: outcome || existing.outcome,
      },
    });

    return NextResponse.json({
      success: true,
      message: status === 'COMPLETED' ? 'Follow-up completed successfully' : 'Follow-up updated successfully',
      followUp: updated,
    });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to update follow-up'), { status: 500 });
  }
}
