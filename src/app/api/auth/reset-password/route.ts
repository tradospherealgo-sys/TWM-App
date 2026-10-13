import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPasswordResetToken, hashPassword } from '@/lib/auth';
import { sanitizeApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

    if (!token) {
      return NextResponse.json(
        { error: 'Password reset token is required.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation do not match.' },
        { status: 400 }
      );
    }

    // Verify token cryptographic signature and expiry
    const payload = await verifyPasswordResetToken(token);
    if (!payload || !payload.userId || !payload.pwdPrefix) {
      return NextResponse.json(
        { error: 'The password reset link is invalid or has expired. Please request a new link.' },
        { status: 400 }
      );
    }

    // Lookup user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'The account associated with this reset link was not found.' },
        { status: 400 }
      );
    }

    // Single-use token verification: compare hash prefix
    // Once password is changed, user.passwordHash changes and token is permanently invalid
    if (user.passwordHash.slice(0, 12) !== payload.pwdPrefix) {
      return NextResponse.json(
        { error: 'This reset link has already been used or has expired. Please request a new link.' },
        { status: 400 }
      );
    }

    // Hash and update password
    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
      },
    });

    // Notify user of security change
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Password Successfully Changed',
          message: 'Your Tradosphere account password was updated. If you did not make this change, please contact operations immediately.',
          category: 'SYSTEM',
        },
      });
    } catch {
      // Non-fatal notification failure
    }

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully reset. You may now sign in with your new password.',
    });
  } catch (error: any) {
    return NextResponse.json(
      sanitizeApiError(error, 'Failed to reset password'),
      { status: 500 }
    );
  }
}
