import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { sanitizeApiError } from '@/lib/errors';

const updateUserSchema = z.object({
  userId: z.string(),
  role: z.enum(['CLIENT', 'EMPLOYEE', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        customerProfile: { select: { id: true, customerCode: true, kycStatus: true, pan: true } },
        employeeProfile: { select: { id: true, employeeCode: true, department: true, designation: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to retrieve users'), { status: 500 });
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
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid user update', details: parsed.error.flatten() }, { status: 400 });
    }

    const { userId, role, status, department, designation } = parsed.data;

    // Self-lockout protection: Prevent admin from revoking their own admin role
    if (userId === user.id && role && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Cannot revoke your own administrator privileges' }, { status: 400 });
    }

    // Self-lockout protection: Prevent admin from deactivating or suspending their own account
    if (userId === user.id && status && status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Cannot deactivate or suspend your own administrator account' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { employeeProfile: true, customerProfile: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // System protection: Check if action would demote or deactivate the only remaining active admin
    const isTargetActiveAdmin = targetUser.role === 'ADMIN' && targetUser.status === 'ACTIVE';
    const wouldDemoteOrDeactivate =
      isTargetActiveAdmin && ((role && role !== 'ADMIN') || (status && status !== 'ACTIVE'));

    if (wouldDemoteOrDeactivate) {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', status: 'ACTIVE' },
      });

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot modify the only active administrator account. The system requires at least one active administrator.' },
          { status: 400 }
        );
      }
    }

    // Update user record
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
        ...(status && { status }),
      },
    });

    // If promoted to EMPLOYEE and doesn't have an employee profile yet, create one
    if (role === 'EMPLOYEE' && !targetUser.employeeProfile) {
      const empCount = await prisma.employee.count();
      await prisma.employee.create({
        data: {
          userId: targetUser.id,
          employeeCode: `TWM-EMP-${String(empCount + 1).padStart(3, '0')}`,
          department: department || 'Operations',
          designation: designation || 'Wealth Executive',
          status: 'ACTIVE',
        },
      });
    }

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'ADMIN_USER_UPDATE',
      entityType: 'User',
      entityId: userId,
      details: {
        targetEmail: targetUser.email,
        previousRole: targetUser.role,
        newRole: role,
        previousStatus: targetUser.status,
        newStatus: status,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to update user'), { status: 500 });
  }
}
