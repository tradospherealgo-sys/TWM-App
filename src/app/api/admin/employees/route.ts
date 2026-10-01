import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { generateUniqueEmployeeCode } from '@/lib/employee';
import { logActivity } from '@/lib/audit';
import { sanitizeApiError } from '@/lib/errors';
import { notifyAdmins } from '@/lib/notifications';

const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Valid email required').max(100),
  phone: z.string().min(10, 'Mobile must be at least 10 digits').max(15).optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  department: z.string().min(2).default('Operations'),
  designation: z.string().min(2).default('Wealth Executive'),
  role: z.enum(['EMPLOYEE', 'ADMIN']).default('EMPLOYEE'),
});

const updateEmployeeSchema = z.object({
  id: z.string().min(1, 'Employee ID required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
        assignedLeads: { select: { id: true } },
        assignedTasks: { where: { status: { not: 'COMPLETED' } }, select: { id: true } },
        assignedApplications: { select: { id: true } },
        dailyReports: { orderBy: { submittedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, employees });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to fetch employees'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid employee data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, phone, password, department, designation, role } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Prevent duplicate accounts
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          phone: phone ? phone.trim() : null,
          passwordHash,
          role,
          status: 'ACTIVE',
        },
      });

      const employeeCode = await generateUniqueEmployeeCode(tx);

      const employee = await tx.employee.create({
        data: {
          userId: newUser.id,
          employeeCode,
          department: department.trim(),
          designation: designation.trim(),
          status: 'ACTIVE',
        },
      });

      return { user: newUser, employee };
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'EMPLOYEE_CREATE',
      entityType: 'Employee',
      entityId: result.employee.id,
      details: {
        employeeCode: result.employee.employeeCode,
        email: result.user.email,
        department: result.employee.department,
        designation: result.employee.designation,
        role: result.user.role,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'local',
    });

    // Notify active administrators about newly provisioned staff member
    await notifyAdmins({
      title: `Staff Account Provisioned: ${result.user.name}`,
      message: `${result.user.role} account created in ${result.employee.department} (${result.employee.designation}) with code ${result.employee.employeeCode}.`,
      category: 'STAFF',
      linkUrl: '/admin/employees',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Employee account provisioned successfully',
        employee: {
          id: result.employee.id,
          employeeCode: result.employee.employeeCode,
          department: result.employee.department,
          designation: result.employee.designation,
          status: result.employee.status,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            phone: result.user.phone,
            role: result.user.role,
            status: result.user.status,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to create employee'), { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, status, department, designation } = parsed.data;

    const existing = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Self-lockout check: If the employee user is the current admin and attempting deactivation
    if (existing.userId === user.id && status && status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot deactivate your own active account' },
        { status: 400 }
      );
    }

    // Atomic update of Employee and User status
    const updated = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(department && { department: department.trim() }),
          ...(designation && { designation: designation.trim() }),
        },
      });

      if (status) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { status },
        });
      }

      return emp;
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'EMPLOYEE_UPDATE',
      entityType: 'Employee',
      entityId: id,
      details: {
        previousStatus: existing.status,
        newStatus: status || existing.status,
        updatedDepartment: department || existing.department,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      employee: updated,
    });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to update employee'), { status: 500 });
  }
}
