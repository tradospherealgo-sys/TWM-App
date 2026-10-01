import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser, verifyPassword, hashPassword, signSessionToken, SESSION_COOKIE_NAME, UserRole } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { sanitizeApiError } from '@/lib/errors';
import { createNotification } from '@/lib/notifications';

// Production password policy: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
  });

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid password data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Fetch user with password hash
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, passwordHash: true, role: true, name: true, customerProfile: true, employeeProfile: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Disallow setting the same password
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password cannot be identical to the current password' },
        { status: 400 }
      );
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        updatedAt: new Date(),
      },
    });

    // Invalidate old session and issue refreshed session token
    const freshToken = await signSessionToken({
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role as UserRole,
      name: dbUser.name,
      employeeId: dbUser.employeeProfile?.id,
      customerId: dbUser.customerProfile?.id,
    });

    // Log security audit event (NEVER include passwords)
    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'AUTH_PASSWORD_CHANGE',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email },
      ipAddress: request.headers.get('x-forwarded-for') || 'local',
    });

    // In-app security notification
    await createNotification({
      userId: user.id,
      title: 'Security Alert: Password Changed',
      message: 'Your account password was updated successfully. If you did not make this change, please contact security immediately.',
      category: 'SECURITY',
      linkUrl: '/account',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });

    // Refresh HttpOnly session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: freshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to change password'), { status: 500 });
  }
}
