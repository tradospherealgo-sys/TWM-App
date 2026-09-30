import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../lib/prisma';
import {
  runAtlasReview,
  runVectorReview,
  runOrionReview,
  runSentinelReview,
  runAegisReview,
  runNexusSynthesis,
  runCompleteSixAgentReview,
} from '../lib/signals/ai-team';
import {
  createSignal,
  runAiReviewForSignal,
  recordHumanDecision,
  publishSignal,
  closeSignal,
  getSignalsList,
  getSignalDetail,
  hasActiveSignalsSubscription,
} from '../lib/signals/service';

describe('TWM Signals & Market Intelligence Module', () => {
  let adminUser: any;
  let employeeUser: any;
  let clientUser: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'test-signals-admin@twm-test.internal',
          name: 'Test Signals Admin',
          passwordHash: 'dummy_hash',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
    }

    employeeUser = await prisma.user.findFirst({ where: { role: 'EMPLOYEE' } });
    if (!employeeUser) {
      employeeUser = await prisma.user.create({
        data: {
          email: 'test-signals-employee@twm-test.internal',
          name: 'Test Signals Employee',
          passwordHash: 'dummy_hash',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
        },
      });
    }

    clientUser = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
    if (!clientUser) {
      clientUser = await prisma.user.create({
        data: {
          email: 'test-signals-client@twm-test.internal',
          name: 'Test Signals Client',
          passwordHash: 'dummy_hash',
          role: 'CLIENT',
          status: 'ACTIVE',
        },
      });
    }
  });

  afterAll(async () => {
    if (clientUser) {
      await prisma.subscription.deleteMany({ where: { userId: clientUser.id } });
    }
    await prisma.activityLog.deleteMany({
      where: {
        actorUserId: {
          in: [adminUser?.id, employeeUser?.id, clientUser?.id].filter(Boolean),
        },
      },
    });
    await prisma.signalAiReview.deleteMany({});
    await prisma.signalVersion.deleteMany({});
    await prisma.signal.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@twm-test.internal' } },
    });
  });

  describe('1. Six-Agent AI Review Team Non-Advisory Behavior', () => {
    const validSignal = {
      title: 'HDFC Bank Credit Growth & Banking Liquidity',
      category: 'EQUITY',
      instrument: 'HDFCBANK Equity',
      exchange: 'NSE',
      symbol: 'HDFCBANK',
      summary: 'Deposit accretion and net interest margin trends in domestic private banking.',
      content: 'Detailed banking sector analysis regarding deposit mobilization and credit-to-deposit ratios.',
      source: 'Internal Research Desk',
      provider: 'Tradosphere Analytics Desk',
      author: 'Banking Analyst',
      validityType: 'SWING',
      riskLevel: 'LOW',
    };

    it('Atlas: should evaluate market context without producing buy/sell tips', async () => {
      const review = await runAtlasReview(validSignal);
      expect(review.agentName).toBe('ATLAS');
      expect(review.status).toBe('SUCCESS');
      expect(review.complianceStatus).toBe('PASS');
      expect(review.summary).toBeDefined();
      expect(review.summary.toLowerCase()).not.toContain('buy hdfc');
      expect(review.summary.toLowerCase()).not.toContain('sell hdfc');
      expect(review.analysis.supportingFactors).toBeDefined();
    });

    it('Vector: should assess technical structure without trade recommendations', async () => {
      const review = await runVectorReview(validSignal);
      expect(review.agentName).toBe('VECTOR');
      expect(review.status).toBe('SUCCESS');
      expect(review.summary.toLowerCase()).not.toContain('buy now');
      expect(review.summary.toLowerCase()).not.toContain('target price');
      expect(review.analysis.technicalObservations).toBeDefined();
    });

    it('Orion: should evaluate fundamentals and scheduled corporate events', async () => {
      const review = await runOrionReview(validSignal);
      expect(review.agentName).toBe('ORION');
      expect(review.status).toBe('SUCCESS');
      expect(review.analysis.upcomingEvents).toBeDefined();
    });

    it('Sentinel: should evaluate risk and data freshness', async () => {
      const review = await runSentinelReview(validSignal);
      expect(review.agentName).toBe('SENTINEL');
      expect(['SUCCESS', 'WARNING']).toContain(review.status);
      expect(review.analysis.riskObservations).toBeDefined();
    });

    it('Aegis: should PASS clean research and verify required source attribution', async () => {
      const review = await runAegisReview(validSignal);
      expect(review.agentName).toBe('AEGIS');
      expect(review.complianceStatus).toBe('PASS');
      expect(review.analysis.canPublish).toBe(true);
      expect(review.analysis.sourceAttributed).toBe(true);
    });

    it('Aegis: should BLOCK signals containing guaranteed return claims', async () => {
      const prohibitedSignal = {
        ...validSignal,
        title: 'Guaranteed 50% Profit in 3 Days',
        summary: 'This is a sure shot jackpot call with risk-free guaranteed return.',
        content: 'Invest now for 100% gain guaranteed return.',
      };

      const review = await runAegisReview(prohibitedSignal);
      expect(review.agentName).toBe('AEGIS');
      expect(review.complianceStatus).toBe('BLOCK');
      expect(review.status).toBe('BLOCK');
      expect(review.analysis.canPublish).toBe(false);
      expect(review.analysis.blockers.length).toBeGreaterThan(0);
    });

    it('Aegis: should BLOCK signals missing research source attribution', async () => {
      const unattributedSignal = {
        ...validSignal,
        source: '',
        provider: '',
        author: '',
      };

      const review = await runAegisReview(unattributedSignal);
      expect(review.complianceStatus).toBe('BLOCK');
      expect(review.analysis.canPublish).toBe(false);
    });

    it('Nexus: should synthesize all 5 agent reviews into unified consensus review', async () => {
      const allReviews = await runCompleteSixAgentReview(validSignal);
      expect(allReviews.length).toBe(6);

      const nexus = allReviews.find((r) => r.agentName === 'NEXUS');
      expect(nexus).toBeDefined();
      expect(nexus?.status).toBe('SUCCESS');
      expect(nexus?.analysis.recommendedHumanAction).toBe('REVIEW');
      expect(nexus?.analysis.canPublish).toBe(true);
      expect(nexus?.summary.toLowerCase()).not.toContain('buy now');
      expect(nexus?.summary.toLowerCase()).not.toContain('guaranteed');
    });

    it('Nexus: should recommend DO_NOT_PUBLISH_COMPLIANCE_BLOCK when Aegis blocks', async () => {
      const prohibitedSignal = {
        ...validSignal,
        content: 'Guaranteed returns 100% assured return without risk.',
      };

      const allReviews = await runCompleteSixAgentReview(prohibitedSignal);
      const nexus = allReviews.find((r) => r.agentName === 'NEXUS');
      expect(nexus?.analysis.complianceVerdict).toBe('BLOCK');
      expect(nexus?.analysis.recommendedHumanAction).toBe('DO_NOT_PUBLISH_COMPLIANCE_BLOCK');
      expect(nexus?.analysis.canPublish).toBe(false);
    });
  });

  describe('2. Full Signal Lifecycle & Decision Hardening', () => {
    let testSignalId: string;

    it('Step 1: should create draft signal in DRAFT state', async () => {
      const created = await createSignal(
        {
          title: 'Tata Motors EV Market Share Analysis',
          category: 'EQUITY',
          instrument: 'TATAMOTORS Equity',
          exchange: 'NSE',
          symbol: 'TATAMOTORS',
          summary: 'Commercial vehicle volume growth and EV passenger vehicle market dominance.',
          content: 'Detailed evaluation of Tata Motors passenger EV platform and margin expansion.',
          source: 'Automotive Sector Research Desk',
          provider: 'Tradosphere Analytics',
          author: 'Automotive Strategist',
          validityType: 'SWING',
          riskLevel: 'MODERATE',
        },
        adminUser.id
      );

      expect(created.id).toBeDefined();
      expect(created.status).toBe('DRAFT');
      expect(created.version).toBe(1);
      testSignalId = created.id;
    });

    it('Step 2: should run 6-Agent AI review and transition to HUMAN_REVIEW', async () => {
      const reviewed = await runAiReviewForSignal(testSignalId, adminUser.id);
      expect(reviewed.status).toBe('HUMAN_REVIEW');
      expect(reviewed.aiReviews.length).toBe(6);
    });

    it('Step 3: human decision should approve signal when compliance passes', async () => {
      const approved = await recordHumanDecision(
        testSignalId,
        { action: 'APPROVE', notes: 'Approved for publication.' },
        adminUser.id
      );
      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedByUserId).toBe(adminUser.id);
    });

    it('Step 4: should publish approved signal and broadcast notifications', async () => {
      const published = await publishSignal(testSignalId, adminUser.id);
      expect(published.status).toBe('PUBLISHED');
      expect(published.publishedAt).toBeDefined();
      expect(published.publishedByUserId).toBe(adminUser.id);
    });

    it('Step 5: should close active signal', async () => {
      const closed = await closeSignal(testSignalId, adminUser.id);
      expect(closed.status).toBe('CLOSED');
      expect(closed.closedAt).toBeDefined();
    });

    it('Hardening: should reject publishing a DRAFT signal that was not approved', async () => {
      const unapprovedDraft = await createSignal(
        {
          title: 'Unapproved Draft Signal',
          category: 'INDEX',
          summary: 'Draft summary',
          content: 'Draft content',
          source: 'Source',
          provider: 'Provider',
          author: 'Author',
        },
        adminUser.id
      );

      await expect(publishSignal(unapprovedDraft.id, adminUser.id)).rejects.toThrow(
        /Signal must be 'APPROVED' first/
      );
    });

    it('Hardening: human reviewer cannot approve a signal blocked by Aegis compliance', async () => {
      const blockedSignal = await createSignal(
        {
          title: 'Blocked Signal with Prohibited Claim',
          category: 'F_AND_O',
          summary: 'Guaranteed profit assured return sure shot',
          content: 'Guaranteed 100% profit risk-free',
          source: 'Source',
          provider: 'Provider',
          author: 'Author',
        },
        adminUser.id
      );

      // Run AI review -> Aegis blocks it
      await runAiReviewForSignal(blockedSignal.id, adminUser.id);

      // Attempt approval -> must throw compliance violation error
      await expect(
        recordHumanDecision(blockedSignal.id, { action: 'APPROVE' }, adminUser.id)
      ).rejects.toThrow(/Compliance Violation: Aegis Compliance Gatekeeper has BLOCKED this signal/);
    });
  });

  describe('3. Subscription Entitlements & Paywall Protection', () => {
    it('Non-subscriber client: should receive redacted teaser list with paywall flag', async () => {
      // Remove any existing subscription for test client
      await prisma.subscription.deleteMany({ where: { userId: clientUser.id } });

      const signals = await getSignalsList(clientUser, {});
      expect(signals.length).toBeGreaterThan(0);

      const first: any = signals[0];
      expect(first.requiresSubscription).toBe(true);
      expect(first.content).toBeNull(); // REDACTED server-side!
      expect(first.title).toBeDefined();
    });

    it('Non-subscriber client: detail view should redact full content payload', async () => {
      const published = await prisma.signal.findFirst({ where: { status: 'PUBLISHED' } });
      if (published) {
        const detail: any = await getSignalDetail(published.id, clientUser);
        expect(detail.requiresSubscription).toBe(true);
        expect(detail.content).toBeNull(); // Content is protected!
      }
    });

    it('Active subscriber client: should receive full research content and AI reviews', async () => {
      const plan = await prisma.subscriptionPlan.findFirst({ where: { code: 'SIGNALS_MONTHLY' } });
      if (!plan) return;

      // Create active 30-day subscription for client
      await prisma.subscription.create({
        data: {
          userId: clientUser.id,
          planId: plan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const isSubscribed = await hasActiveSignalsSubscription(clientUser.id);
      expect(isSubscribed).toBe(true);

      const signals = await getSignalsList(clientUser, {});
      const first: any = signals[0];
      expect(first.requiresSubscription).toBe(false);

      const published = await prisma.signal.findFirst({ where: { status: 'PUBLISHED' } });
      if (published) {
        const detail: any = await getSignalDetail(published.id, clientUser);
        expect(detail.requiresSubscription).toBeUndefined();
        expect(detail.content).toBeDefined(); // Unlocked!
        expect(detail.content?.length).toBeGreaterThan(10);
      }
    });

    it('Expired subscriber client: should be blocked by paywall', async () => {
      // Expire client subscription
      await prisma.subscription.updateMany({
        where: { userId: clientUser.id },
        data: {
          endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
          status: 'EXPIRED',
        },
      });

      const isSubscribed = await hasActiveSignalsSubscription(clientUser.id);
      expect(isSubscribed).toBe(false);

      const published = await prisma.signal.findFirst({ where: { status: 'PUBLISHED' } });
      if (published) {
        const detail: any = await getSignalDetail(published.id, clientUser);
        expect(detail.requiresSubscription).toBe(true);
        expect(detail.content).toBeNull();
      }
    });
  });

  describe('4. Server-Side RBAC & Audit Trail', () => {
    it('Employee: should be able to view approved signals for customer assistance', async () => {
      const signals = await getSignalsList(employeeUser, {});
      expect(Array.isArray(signals)).toBe(true);
      // All returned signals must be APPROVED, PUBLISHED, or CLOSED
      const unapproved = signals.filter((s) => s.status === 'DRAFT' || s.status === 'AI_REVIEW');
      expect(unapproved.length).toBe(0);
    });

    it('Audit Log: should record activity for signal creations and reviews', async () => {
      const logs = await prisma.activityLog.findMany({
        where: { entityType: 'Signal' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      expect(logs.length).toBeGreaterThan(0);
      const actions = logs.map((l) => l.action);
      expect(actions.some((a) => a.includes('SIGNAL_'))).toBe(true);
    });
  });
});
