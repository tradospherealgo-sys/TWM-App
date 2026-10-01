import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, signSessionToken, SESSION_COOKIE_NAME, UserRole } from '@/lib/auth';
import { generateUniqueCustomerCode } from '@/lib/onboarding';
import { logActivity } from '@/lib/audit';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeApiError } from '@/lib/errors';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Please provide a valid email address').max(100),
    phone: z.string().min(10, 'Mobile number must be at least 10 digits').max(15).optional().or(z.literal('')),
    pan: z
      .string()
      .trim()
      .transform((val) => val.toUpperCase())
      .refine((val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), {
        message: 'Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F)',
      })
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    // If an attacker sends a role field, it will be strictly ignored server-side
    role: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export async function POST(request: NextRequest) {
  try {
    // 1. Abuse Protection: Rate limit registration by client IP (5 per minute)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
    const rateLimit = checkRateLimit(`register:${ip}`, 5, 60000);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(rateLimit.retryAfterMs / 1000);
      return NextResponse.json(
        { error: 'Too many registration attempts. Please wait a minute and try again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        }
      );
    }

    // 2. Parse & Validate input
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid registration details', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, phone, pan, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone ? phone.trim() : null;
    const normalizedPan = pan ? pan.toUpperCase().trim() : null;

    // 3. Duplicate Account Detection
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // 4. Secure Password Hashing
    const passwordHash = await hashPassword(password);

    // 5. Database Transaction: Create User + Customer atomically
    // CRITICAL SECURITY ENFORCEMENT: Server unconditionally assigns role = 'CLIENT'.
    // Any browser-supplied role is completely ignored.
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          phone: normalizedPhone,
          role: 'CLIENT', // Strict server-authoritative role assignment
          status: 'ACTIVE',
        },
      });

      // Find an active employee to assign as relationship manager
      const activeEmployee = await tx.employee.findFirst({
        where: { status: 'ACTIVE' },
      });

      // Generate collision-resistant customer code
      const customerCode = await generateUniqueCustomerCode(tx);

      // Create customer profile
      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          customerCode,
          pan: normalizedPan,
          kycStatus: 'PENDING',
          assignedEmployeeId: activeEmployee?.id || null,
        },
      });

      // Create initial welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to Tradosphere Wealth Management',
          message: `Your account (${customerCode}) has been registered. Please complete your regulatory KYC onboarding.`,
          category: 'KYC',
          linkUrl: '/onboarding',
        },
      });

      return { user, customer };
    });

    // 6. Security Audit Event
    await logActivity({
      actorUserId: result.user.id,
      actorRole: 'CLIENT',
      action: 'AUTH_REGISTER',
      entityType: 'User',
      entityId: result.user.id,
      details: {
        email: result.user.email,
        customerCode: result.customer.customerCode,
        hasInitialPan: Boolean(normalizedPan),
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'local',
    });

    // 7. Establish Authenticated Session Immediately
    const sessionToken = await signSessionToken({
      userId: result.user.id,
      email: result.user.email,
      role: 'CLIENT' as UserRole,
      name: result.user.name,
      customerId: result.customer.id,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account registered successfully',
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: 'CLIENT',
          customerCode: result.customer.customerCode,
        },
        redirectTo: '/onboarding',
      },
      { status: 201 }
    );

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Registration failed. Please try again later.'), {
      status: 500,
    });
  }
}
