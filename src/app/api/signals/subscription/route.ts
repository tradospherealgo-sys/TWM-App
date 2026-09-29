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

    // Activate 30-day subscription
    const startDate = new Date();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: 'ACTIVE',
        startDate,
        endDate,
        autoRenew: false,
      },
    });

    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        eventType: 'ACTIVATED',
        detailsJson: JSON.stringify({
          planCode: plan.code,
          price: plan.price,
          currency: plan.currency,
          channel: 'DIRECT_ENROLLMENT',
        }),
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'TWM Signals Subscription Activated',
        message: `Welcome to TWM Signals & Market Intelligence. You now have full access to research and 6-Agent AI reviews.`,
        category: 'MARKET_DATA',
        linkUrl: '/signals',
      },
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'SUBSCRIPTION_ACTIVATE',
      entityType: 'Subscription',
      entityId: subscription.id,
      details: { planCode: plan.code, amount: plan.price },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription successfully activated. You now have full access to TWM Signals.',
      subscription,
    });
  } catch (error: any) {
    console.error('Error handling subscription action:', error);
    return NextResponse.json({ error: error.message || 'Subscription processing failed' }, { status: 500 });
  }
}
