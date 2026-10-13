import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createPasswordResetToken } from '@/lib/auth';
import { sanitizeApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Lookup user by email
    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (e) {
      console.warn('Database lookup error during password reset request:', e);
    }

    if (user && user.status !== 'SUSPENDED') {
      try {
        const token = await createPasswordResetToken(user);

        // Record security notification for the user
        try {
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: 'Password Reset Initiated',
              message:
                'A password reset request was initiated for your Tradosphere account. If you did not make this request, please contact support immediately.',
              category: 'SYSTEM',
            },
          });
        } catch {
          // Non-fatal notification failure
        }

        // Server-side audit log without leaking token to client
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
          console.info(`[Auth] Password reset token generated for ${user.email} (token length: ${token.length})`);
        }
      } catch (err) {
        console.error('Error generating reset token:', err);
      }
    }

    // Always return constant message to prevent account enumeration
    return NextResponse.json({
      success: true,
      message:
        'If an account matches that email address, password recovery instructions have been initiated. Please check your registered email or contact your relationship manager.',
    });
  } catch (error: any) {
    return NextResponse.json(
      sanitizeApiError(error, 'Failed to process password recovery request'),
      { status: 500 }
    );
  }
}
