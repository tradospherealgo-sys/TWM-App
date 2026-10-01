import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getClientOnboardingDetails } from '@/lib/onboarding';
import { logActivity } from '@/lib/audit';
import { sanitizeApiError } from '@/lib/errors';

const updateOnboardingProfileSchema = z.object({
  phone: z.string().min(10, 'Mobile number must be at least 10 digits').max(15).optional(),
  pan: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase())
    .refine((val) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), {
      message: 'Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F)',
    })
    .optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  if (user.role !== 'CLIENT') {
    return NextResponse.json(
      { error: 'Forbidden: Onboarding is intended for client accounts only' },
      { status: 403 }
    );
  }

  try {
    const details = await getClientOnboardingDetails(user.id);
    if (!details) {
      return NextResponse.json({ error: 'Customer onboarding profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, onboarding: details });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to fetch onboarding status'), {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  if (user.role !== 'CLIENT') {
    return NextResponse.json(
      { error: 'Forbidden: Onboarding is intended for client accounts only' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Privilege escalation mitigation: strictly reject attempts to modify protected fields
    const restrictedFields = ['role', 'status', 'email', 'kycStatus', 'customerCode', 'id', 'assignedEmployeeId'];
    const attemptedRestricted = restrictedFields.filter((f) => f in body);
    if (attemptedRestricted.length > 0) {
      return NextResponse.json(
        { error: `Modifying restricted security fields (${attemptedRestricted.join(', ')}) is forbidden` },
        { status: 403 }
      );
    }

    const parsed = updateOnboardingProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid profile details', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { phone, pan } = parsed.data;

    // Update User phone if provided
    if (phone) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: phone.trim() },
      });
    }

    // Update Customer PAN if provided
    if (pan) {
      const normalizedPan = pan.toUpperCase().trim();
      await prisma.customer.update({
        where: { userId: user.id },
        data: { pan: normalizedPan },
      });
    }

    await logActivity({
      actorUserId: user.id,
      actorRole: 'CLIENT',
      action: 'ONBOARDING_PROFILE_UPDATE',
      entityType: 'Customer',
      entityId: user.customerProfile?.id || user.id,
      details: {
        updatedPhone: Boolean(phone),
        updatedPan: Boolean(pan),
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'local',
    });

    const updatedDetails = await getClientOnboardingDetails(user.id);

    return NextResponse.json({
      success: true,
      message: 'Onboarding profile updated successfully',
      onboarding: updatedDetails,
    });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to update onboarding profile'), {
      status: 500,
    });
  }
}
