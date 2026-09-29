/**
 * Signals Management Service
 * Tradosphere Wealth Management (TWM)
 */

import prisma from '../prisma';
import { logActivity } from '../audit';
import { runCompleteSixAgentReview } from './ai-team';
import {
  CreateSignalInput,
  UpdateSignalInput,
  HumanDecisionInput,
  SubscriptionStatusInfo,
} from './types';

// Helper: Slug generator
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `${base}-${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------------------
// 1. SUBSCRIPTION VERIFICATION (Server-Side Entitlement Guard)
// ---------------------------------------------------------------------------
export async function hasActiveSignalsSubscription(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
  });
  return Boolean(sub);
}

export async function getUserSubscriptionDetails(userId: string): Promise<SubscriptionStatusInfo> {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { code: 'SIGNALS_MONTHLY', isActive: true },
  });

  const sub = await prisma.subscription.findFirst({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!sub) {
    return {
      hasActiveSubscription: false,
      status: 'NONE',
      monthlyPrice: plan?.price || 499,
      canAccessPaidContent: false,
    };
  }

  const now = new Date();
  const isActive = sub.status === 'ACTIVE' && sub.endDate >= now;
  const daysRemaining = Math.max(0, Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    hasActiveSubscription: isActive,
    status: isActive ? 'ACTIVE' : (sub.status as any),
    planName: sub.plan.name,
    monthlyPrice: sub.plan.price,
    startDate: sub.startDate.toISOString(),
    endDate: sub.endDate.toISOString(),
    daysRemaining,
    canAccessPaidContent: isActive,
  };
}

// ---------------------------------------------------------------------------
// 2. SIGNAL CRUD & LIFECYCLE
// ---------------------------------------------------------------------------
export async function createSignal(input: CreateSignalInput, adminUserId: string) {
  const slug = generateSlug(input.title);

  const signal = await prisma.signal.create({
    data: {
      slug,
      title: input.title,
      category: input.category,
      subcategory: input.subcategory || null,
      instrument: input.instrument || null,
      exchange: input.exchange || 'NSE',
      symbol: input.symbol || null,
      summary: input.summary,
      content: input.content,
      source: input.source,
      provider: input.provider,
      author: input.author,
      supportingInfo: input.supportingInfo || null,
      validityType: input.validityType || 'SESSION',
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      riskLevel: input.riskLevel || 'MODERATE',
      status: 'DRAFT',
      version: 1,
      createdByUserId: adminUserId,
    },
  });

  await logActivity({
    actorUserId: adminUserId,
    actorRole: 'ADMIN',
    action: 'SIGNAL_CREATE',
    entityType: 'Signal',
    entityId: signal.id,
    details: { title: signal.title, category: signal.category, status: 'DRAFT' },
  });

  return signal;
}

export async function updateSignal(input: UpdateSignalInput, adminUserId: string) {
  const existing = await prisma.signal.findUnique({
    where: { id: input.id },
  });

  if (!existing) {
    throw new Error('Signal not found');
  }

  // Create immutable version snapshot
  await prisma.signalVersion.create({
    data: {
      signalId: existing.id,
      versionNumber: existing.version,
      title: existing.title,
      content: existing.content,
      changedByUserId: adminUserId,
      changeReason: input.changeReason || 'Content revision',
      snapshotJson: JSON.stringify(existing),
    },
  });

  const updated = await prisma.signal.update({
    where: { id: input.id },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.category && { category: input.category }),
      ...(input.subcategory !== undefined && { subcategory: input.subcategory }),
      ...(input.instrument !== undefined && { instrument: input.instrument }),
      ...(input.exchange !== undefined && { exchange: input.exchange }),
      ...(input.symbol !== undefined && { symbol: input.symbol }),
      ...(input.summary && { summary: input.summary }),
      ...(input.content && { content: input.content }),
      ...(input.source && { source: input.source }),
      ...(input.provider && { provider: input.provider }),
      ...(input.author && { author: input.author }),
      ...(input.supportingInfo !== undefined && { supportingInfo: input.supportingInfo }),
      ...(input.validityType && { validityType: input.validityType }),
      ...(input.validUntil !== undefined && { validUntil: input.validUntil ? new Date(input.validUntil) : null }),
      ...(input.riskLevel && { riskLevel: input.riskLevel }),
      version: existing.version + 1,
    },
  });

  await logActivity({
    actorUserId: adminUserId,
    actorRole: 'ADMIN',
    action: 'SIGNAL_UPDATE',
    entityType: 'Signal',
    entityId: updated.id,
    details: { version: updated.version, changeReason: input.changeReason },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// 3. AI REVIEW TEAM EXECUTION
// ---------------------------------------------------------------------------
export async function runAiReviewForSignal(signalId: string, adminUserId: string) {
  const signal = await prisma.signal.findUnique({
    where: { id: signalId },
  });

  if (!signal) {
    throw new Error('Signal not found');
  }

  // Set status to AI_REVIEW
  await prisma.signal.update({
    where: { id: signalId },
    data: { status: 'AI_REVIEW' },
  });

  // Run the complete 6-agent review (Atlas, Vector, Orion, Sentinel, Aegis, Nexus)
  const reviews = await runCompleteSixAgentReview(signal);

  // Clear any existing reviews for this signal
  await prisma.signalAiReview.deleteMany({
    where: { signalId },
  });

  // Persist structured reviews for all 6 agents
  for (const review of reviews) {
    await prisma.signalAiReview.create({
      data: {
        signalId,
        agentName: review.agentName,
        agentRole: review.agentRole,
        model: review.model,
        status: review.status,
        complianceStatus: review.complianceStatus,
        summary: review.summary,
        analysisJson: JSON.stringify(review.analysis),
        latencyMs: review.latencyMs,
      },
    });
  }

  // Determine transition: Move to HUMAN_REVIEW
  const updatedSignal = await prisma.signal.update({
    where: { id: signalId },
    data: { status: 'HUMAN_REVIEW' },
    include: { aiReviews: true },
  });

  await logActivity({
    actorUserId: adminUserId,
    actorRole: 'ADMIN',
    action: 'SIGNAL_AI_REVIEW_COMPLETED',
    entityType: 'Signal',
    entityId: signalId,
    details: {
      agentCount: reviews.length,
      aegisVerdict: reviews.find((r) => r.agentName === 'AEGIS')?.complianceStatus,
      nexusAction: (reviews.find((r) => r.agentName === 'NEXUS')?.analysis as any)?.recommendedHumanAction,
    },
  });

  return updatedSignal;
}

// ---------------------------------------------------------------------------
// 4. HUMAN DECISION (Approve, Reject, Send Back)
// ---------------------------------------------------------------------------
export async function recordHumanDecision(
  signalId: string,
  decision: HumanDecisionInput,
  adminUserId: string
) {
  const signal = await prisma.signal.findUnique({
    where: { id: signalId },
    include: { aiReviews: true },
  });

  if (!signal) {
    throw new Error('Signal not found');
  }

  if (decision.action === 'APPROVE') {
    // CRITICAL REGULATORY GUARD: Check if Aegis Compliance blocked this signal!
    const aegisReview = signal.aiReviews.find((r) => r.agentName === 'AEGIS');
    if (aegisReview && aegisReview.complianceStatus === 'BLOCK') {
      throw new Error(
        'Compliance Violation: Aegis Compliance Gatekeeper has BLOCKED this signal. It cannot be approved until violations are corrected.'
      );
    }

    const updated = await prisma.signal.update({
      where: { id: signalId },
      data: {
        status: 'APPROVED',
        approvedByUserId: adminUserId,
        rejectionReason: null,
      },
    });

    await logActivity({
      actorUserId: adminUserId,
      actorRole: 'ADMIN',
      action: 'SIGNAL_HUMAN_APPROVE',
      entityType: 'Signal',
      entityId: signalId,
      details: { notes: decision.notes },
    });

    return updated;
  }

  if (decision.action === 'REJECT') {
    const updated = await prisma.signal.update({
      where: { id: signalId },
      data: {
        status: 'REJECTED',
        rejectionReason: decision.notes || 'Rejected by reviewer',
      },
    });

    await logActivity({
      actorUserId: adminUserId,
      actorRole: 'ADMIN',
      action: 'SIGNAL_HUMAN_REJECT',
      entityType: 'Signal',
      entityId: signalId,
      details: { reason: decision.notes },
    });

    return updated;
  }

  if (decision.action === 'SEND_BACK') {
    const updated = await prisma.signal.update({
      where: { id: signalId },
      data: {
        status: 'SENT_BACK',
        rejectionReason: decision.notes || 'Sent back for revisions',
      },
    });

    await logActivity({
      actorUserId: adminUserId,
      actorRole: 'ADMIN',
      action: 'SIGNAL_SEND_BACK',
      entityType: 'Signal',
      entityId: signalId,
      details: { notes: decision.notes },
    });

    return updated;
  }

  throw new Error(`Invalid decision action: ${(decision as any).action}`);
}

// ---------------------------------------------------------------------------
// 5. PUBLISH SIGNAL (Admin Only)
// ---------------------------------------------------------------------------
export async function publishSignal(signalId: string, adminUserId: string) {
  const signal = await prisma.signal.findUnique({
    where: { id: signalId },
    include: { aiReviews: true },
  });

  if (!signal) {
    throw new Error('Signal not found');
  }

  if (signal.status !== 'APPROVED') {
    throw new Error(`Cannot publish a signal with status '${signal.status}'. Signal must be 'APPROVED' first.`);
  }

  // Safety check: Aegis Compliance
  const aegisReview = signal.aiReviews.find((r) => r.agentName === 'AEGIS');
  if (aegisReview && aegisReview.complianceStatus === 'BLOCK') {
    throw new Error('Publication Blocked: Aegis compliance review is in BLOCK status.');
  }

  const updated = await prisma.signal.update({
    where: { id: signalId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedByUserId: adminUserId,
    },
  });

  // Notify active subscribers in-app
  const activeSubscribers = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      endDate: { gte: new Date() },
    },
    select: { userId: true },
  });

  for (const sub of activeSubscribers) {
    await prisma.notification.create({
      data: {
        userId: sub.userId,
        title: `Market Intelligence: ${signal.instrument || signal.title}`,
        message: `New approved market intelligence published in [${signal.category}]. Review context and operational guidance.`,
        category: 'MARKET_DATA',
        linkUrl: `/signals/${signal.id}`,
      },
    });
  }

  await logActivity({
    actorUserId: adminUserId,
    actorRole: 'ADMIN',
    action: 'SIGNAL_PUBLISH',
    entityType: 'Signal',
    entityId: signalId,
    details: {
      title: signal.title,
      subscribersNotified: activeSubscribers.length,
    },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// 6. CLOSE SIGNAL
// ---------------------------------------------------------------------------
export async function closeSignal(signalId: string, adminUserId: string) {
  const updated = await prisma.signal.update({
    where: { id: signalId },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
    },
  });

  await logActivity({
    actorUserId: adminUserId,
    actorRole: 'ADMIN',
    action: 'SIGNAL_CLOSE',
    entityType: 'Signal',
    entityId: signalId,
  });

  return updated;
}

// ---------------------------------------------------------------------------
// 7. GET SIGNALS LIST (Protected with Role & Subscription Boundaries)
// ---------------------------------------------------------------------------
export async function getSignalsList(
  user: { id: string; role: string },
  filters: { category?: string; status?: string; search?: string }
) {
  const where: any = {};

  if (filters.category && filters.category !== 'ALL') {
    where.category = filters.category;
  }

  if (filters.search && filters.search.trim().length > 0) {
    where.OR = [
      { title: { contains: filters.search } },
      { summary: { contains: filters.search } },
      { instrument: { contains: filters.search } },
      { symbol: { contains: filters.search } },
    ];
  }

  if (user.role === 'CLIENT') {
    // Clients only see PUBLISHED or CLOSED content
    where.status = { in: ['PUBLISHED', 'ACTIVE', 'CLOSED'] };
    const isSubscribed = await hasActiveSignalsSubscription(user.id);

    const signals = await prisma.signal.findMany({
      where,
      include: {
        aiReviews: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    if (!isSubscribed) {
      // Non-subscriber: REDACT paid content, return teaser metadata with paywall flag
      return signals.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        category: s.category,
        subcategory: s.subcategory,
        instrument: s.instrument,
        exchange: s.exchange,
        symbol: s.symbol,
        summary: s.summary,
        content: null, // REDACTED
        source: s.source,
        provider: s.provider,
        validityType: s.validityType,
        riskLevel: s.riskLevel,
        status: s.status,
        publishedAt: s.publishedAt,
        requiresSubscription: true,
        aiReviewsSummary: 'Subscription required to view 6-Agent AI review and research breakdown.',
      }));
    }

    // Subscribed client: Return full content with transparent AI review summaries
    return signals.map((s) => ({
      ...s,
      requiresSubscription: false,
    }));
  }

  // Employee: Sees published and approved signals to assist clients
  if (user.role === 'EMPLOYEE') {
    where.status = { in: ['PUBLISHED', 'ACTIVE', 'APPROVED', 'CLOSED'] };
    return prisma.signal.findMany({
      where,
      include: { aiReviews: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: Full visibility across all lifecycle stages
  if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status;
  }

  return prisma.signal.findMany({
    where,
    include: { aiReviews: true },
    orderBy: { createdAt: 'desc' },
  });
}

// ---------------------------------------------------------------------------
// 8. GET SIGNAL DETAIL (Protected)
// ---------------------------------------------------------------------------
export async function getSignalDetail(signalId: string, user: { id: string; role: string }) {
  const signal = await prisma.signal.findUnique({
    where: { id: signalId },
    include: {
      aiReviews: true,
      versions: {
        orderBy: { versionNumber: 'desc' },
      },
    },
  });

  if (!signal) {
    throw new Error('Signal not found');
  }

  if (user.role === 'CLIENT') {
    if (signal.status !== 'PUBLISHED' && signal.status !== 'ACTIVE' && signal.status !== 'CLOSED') {
      throw new Error('Signal not available');
    }

    const isSubscribed = await hasActiveSignalsSubscription(user.id);
    if (!isSubscribed) {
      return {
        id: signal.id,
        title: signal.title,
        category: signal.category,
        instrument: signal.instrument,
        exchange: signal.exchange,
        symbol: signal.symbol,
        summary: signal.summary,
        content: null, // Redacted
        source: signal.source,
        provider: signal.provider,
        riskLevel: signal.riskLevel,
        status: signal.status,
        publishedAt: signal.publishedAt,
        requiresSubscription: true,
        paywallMessage: 'Active TWM Signals subscription required to unlock full research and AI reviews.',
      };
    }
  }

  return signal;
}

// ---------------------------------------------------------------------------
// 9. SIGNALS SETTINGS
// ---------------------------------------------------------------------------
export async function getSignalSettings() {
  let settings = await prisma.signalSettings.findUnique({
    where: { id: 'default' },
  });

  if (!settings) {
    settings = await prisma.signalSettings.create({
      data: {
        id: 'default',
        monthlyPrice: 499,
        billingPeriod: 'MONTHLY',
        enabledCategoriesJson: JSON.stringify([
          'F_AND_O', 'EQUITY', 'INDEX', 'COMMODITY', 'IPO', 'MUTUAL_FUNDS',
          'SIP', 'MARKET_OUTLOOK', 'CORPORATE_ACTIONS', 'MACRO_EVENTS', 'RISK_ALERTS', 'EDUCATIONAL'
        ]),
        subscriptionRequired: true,
        notificationsEnabled: true,
        aiProvider: 'heuristic',
        aiModel: 'twm-compliance-engine-v1',
        disclaimer: 'All market intelligence is non-advisory. Verify suitability with your advisor.',
      },
    });
  }

  return settings;
}

export async function updateSignalSettings(updates: Partial<any>, adminUserId: string) {
  const updated = await prisma.signalSettings.update({
    where: { id: 'default' },
    data: {
      ...(updates.monthlyPrice !== undefined && { monthlyPrice: Number(updates.monthlyPrice) }),
      ...(updates.billingPeriod !== undefined && { billingPeriod: updates.billingPeriod }),
      ...(updates.enabledCategoriesJson !== undefined && { enabledCategoriesJson: updates.enabledCategoriesJson }),
      ...(updates.subscriptionRequired !== undefined && { subscriptionRequired: Boolean(updates.subscriptionRequired) }),
      ...(updates.notificationsEnabled !== undefined && { notificationsEnabled: Boolean(updates.notificationsEnabled) }),
      ...(updates.disclaimer !== undefined && { disclaimer: updates.disclaimer }),
    },
  });

  // Also update price in default subscription plan
  if (updates.monthlyPrice !== undefined) {
    await prisma.subscriptionPlan.updateMany({
      where: { code: 'SIGNALS_MONTHLY' },
      data: { price: Number(updates.monthlyPrice) },
    });
  }

  await logActivity({
    actorUserId: adminUserId,
    actorRole: 'ADMIN',
    action: 'SIGNAL_SETTINGS_UPDATE',
    entityType: 'SignalSettings',
    entityId: 'default',
    details: updates,
  });

  return updated;
}
