import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getUserSubscriptionDetails } from '@/lib/signals/service';
import { logActivity } from '@/lib/audit';

export async function GET(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const details = await getUserSubscriptionDetails(user.id);
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { code: 'SIGNALS_MONTHLY', isActive: true },
    });

    return NextResponse.json({
      success: true,
      subscription: details,
      plan: plan
        ? {
            id: plan.id,
            name: plan.name,
            code: plan.code,
            price: plan.price,
            currency: plan.currency,
            billingPeriod: plan.billingPeriod,
            features: JSON.parse(plan.featuresJson || '[]'),
            disclaimer: plan.disclaimer,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error fetching subscription details:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch subscription' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body; // 'SUBSCRIBE' | 'CANCEL'

    const plan = await prisma.subscriptionPlan.findFirst({
      where: { code: 'SIGNALS_MONTHLY', isActive: true },
    });

    if (!plan) {
      return NextResponse.json({ error: 'No active subscription plan found' }, { status: 404 });
    }

    if (action === 'CANCEL') {
      const activeSub = await prisma.subscription.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
      });

      if (!activeSub) {
        return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 400 });
      }

      await prisma.subscription.update({
        where: { id: activeSub.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          autoRenew: false,
        },
      });

      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: activeSub.id,
          eventType: 'CANCELLED',
          detailsJson: JSON.stringify({ cancelledByUser: user.email }),
        },
      });

      await logActivity({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'SUBSCRIPTION_CANCEL',
        entityType: 'Subscription',
        entityId: activeSub.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Your subscription has been cancelled. Access will remain valid until the end of your billing cycle.',
      });
    }

    if (action === 'SUBSCRIBE') {
      return NextResponse.json(
        {
          error: 'Online payment gateway integration is currently pending activation. Direct subscription enrollment without payment verification is disabled in production.',
          code: 'PAYMENT_GATEWAY_PENDING',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: 'Invalid subscription action requested' }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling subscription action:', error);
    return NextResponse.json({ error: error.message || 'Subscription processing failed' }, { status: 500 });
  }
}
