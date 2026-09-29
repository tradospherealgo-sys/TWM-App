import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  assignedEmployeeId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional(), // ISO date string
});

const updateTaskSchema = z.object({
  id: z.string(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');

  const whereClause: Record<string, unknown> = {};

  if (user.role === 'EMPLOYEE' && user.employeeProfile) {
    whereClause.assignedEmployeeId = user.employeeProfile.id;
  }

  if (status) {
    whereClause.status = status;
  }
  if (priority) {
    whereClause.priority = priority;
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      customer: {
        include: { user: { select: { name: true, phone: true } } },
      },
      lead: {
        select: { id: true, name: true, phone: true, productInterest: true },
      },
      assignedEmployee: {
        include: { user: { select: { name: true } } },
      },
    },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid task input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { title, description, customerId, leadId, assignedEmployeeId, priority, dueDate } = parsed.data;

    let assignee = assignedEmployeeId;
    if (!assignee && user.employeeProfile) {
      assignee = user.employeeProfile.id;
    }

    if (!assignee) {
      const defaultEmp = await prisma.employee.findFirst({ where: { status: 'ACTIVE' } });
      assignee = defaultEmp?.id;
    }

    if (!assignee) {
      return NextResponse.json({ error: 'No active employee found for assignment' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        customerId: customerId || null,
        leadId: leadId || null,
        assignedEmployeeId: assignee,
        priority,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update', details: parsed.error.flatten() }, { status: 400 });
    }

    const { id, status, priority, description } = parsed.data;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const completedAt = status === 'COMPLETED' ? new Date() : existing.completedAt;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(status && { status, completedAt }),
        ...(priority && { priority }),
        ...(description && { description }),
      },
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'TASK_UPDATE',
      entityType: 'Task',
      entityId: id,
      details: { previousStatus: existing.status, newStatus: status },
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
