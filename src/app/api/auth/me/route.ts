import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { sanitizeApiError } from '@/lib/errors';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      customerProfile: user.customerProfile,
      employeeProfile: user.employeeProfile,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Check if client attempted to pass disallowed security-critical fields
    const disallowedFields = ['role', 'status', 'email', 'kycStatus', 'pan', 'id', 'userId', 'employeeCode', 'customerCode'];
    const attemptedDisallowed = disallowedFields.filter((f) => f in body);

    if (attemptedDisallowed.length > 0) {
      return NextResponse.json(
        { error: `Modifying security-restricted fields (${attemptedDisallowed.join(', ')}) is forbidden` },
        { status: 403 }
      );
    }

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid profile data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, phone } = parsed.data;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        customerProfile: true,
        employeeProfile: true,
      },
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'PROFILE_UPDATE',
      entityType: 'User',
      entityId: user.id,
      details: { updatedFields: Object.keys(parsed.data) },
      ipAddress: request.headers.get('x-forwarded-for') || 'local',
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to update profile'), { status: 500 });
  }
}
