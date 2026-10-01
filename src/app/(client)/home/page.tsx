import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getClientOnboardingDetails } from '@/lib/onboarding';
import { getSMCIntegrationStatus } from '@/lib/adapters/smc';
import { getIndices } from '@/lib/adapters/market-data';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { StatusBanner } from '@/components/ui/StatusBanner';
import {
  TrendingUp,
  PieChart,
  Repeat,
  Sparkles,
  ShieldCheck,
  Landmark,
  ArrowRight,
  Shield,
  Clock,
  ExternalLink,
  FileText,
} from 'lucide-react';

export default async function ClientHomePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const smcStatus = getSMCIntegrationStatus();
  const indices = getIndices();
  const onboardingDetails = user.role === 'CLIENT' ? await getClientOnboardingDetails(user.id) : null;

  // Fetch customer's real applications from database
  const customerProfile = user.customerProfile;
  const applications = customerProfile
    ? await prisma.application.findMany({
        where: { customerId: customerProfile.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
      })
    : [];

  // Fetch recent notifications
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 2,
  });

  return (
    <div className="space-y-5">
      {/* 1. Greeting & Relationship Badge */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400">Welcome back,</span>
          <h1 className="text-xl font-bold text-white tracking-tight">{user.name}</h1>
          <div className="text-[11px] text-slate-400 mt-0.5">
            ID: <span className="font-mono text-slate-300">{customerProfile?.customerCode || 'TWM-CUST'}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block mb-1">KYC Status</span>
          <StatusBadge status={customerProfile?.kycStatus || 'PENDING'} />
        </div>
      </div>

      {/* Onboarding Progress Card if not completed */}
      {onboardingDetails && onboardingDetails.stage !== 'COMPLETED' && (
        <Card className="bg-gradient-to-r from-blue-950/70 to-slate-900 border-blue-800/60 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-semibold text-blue-200">KYC Onboarding Incomplete</span>
            </div>
            <span className="text-xs font-bold text-blue-400">{onboardingDetails.progressPercentage}%</span>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            {onboardingDetails.nextAction.title}: {onboardingDetails.nextAction.description}
          </p>
          <Link href="/onboarding">
            <Button variant="primary" size="sm" className="w-full">
              {onboardingDetails.nextAction.actionLabel} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </Card>
      )}

      {/* 2. SMC Global Trading Card (Crucial AP Boundary) */}
      <Card className="bg-gradient-to-br from-[#131C2E] to-[#18233C] border-amber-600/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-bold text-amber-300 tracking-wide uppercase">
                Trade with SMC Global
              </div>
              <div className="text-[11px] text-slate-300">
                Authorised Person: Tradosphere
              </div>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80 font-medium">
            Broker Gateway
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Direct equity, derivatives, and commodity trading powered by SMC Global Securities. Trade executions occur directly on SMC Ace.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={smcStatus.onboardingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button variant="smc" size="sm" className="w-full text-xs">
              Open Demat <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </Button>
          </a>
          <a
            href={smcStatus.tradingPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button variant="outline" size="sm" className="w-full text-xs border-amber-500/40 text-amber-200 hover:bg-amber-950/40">
              Access SMC Ace <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </Button>
          </a>
        </div>
      </Card>

      {/* 3. Market Overview (Honest Status - NO FAKE DATA) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Market Snapshot
          </h2>
          <Link href="/markets" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
            Full Markets <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {indices.slice(0, 2).map((idx) => (
            <Card key={idx.symbol} className="p-3 bg-[#111927]">
              <div className="text-[11px] font-medium text-slate-400">{idx.name}</div>
              <div className="mt-1 text-sm font-semibold text-slate-300">
                {idx.lastPrice ? `₹${idx.lastPrice.toLocaleString()}` : 'Data Unavailable'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {idx.status === 'LIVE' ? 'Real-time feed' : 'Connect data provider'}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4. Quick Financial Services Grid */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Financial Services
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <Link href="/markets" className="p-3 rounded-xl bg-[#131C2E] border border-slate-800 text-center hover:border-slate-700 transition-all flex flex-col items-center gap-1.5">
            <span className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-xs font-medium text-slate-200">Stocks</span>
          </Link>

          <Link href="/invest" className="p-3 rounded-xl bg-[#131C2E] border border-slate-800 text-center hover:border-slate-700 transition-all flex flex-col items-center gap-1.5">
            <span className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </span>
            <span className="text-xs font-medium text-slate-200">Mutual Funds</span>
          </Link>

          <Link href="/invest?tab=sip" className="p-3 rounded-xl bg-[#131C2E] border border-slate-800 text-center hover:border-slate-700 transition-all flex flex-col items-center gap-1.5">
            <span className="w-9 h-9 rounded-xl bg-purple-600/10 text-purple-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </span>
            <span className="text-xs font-medium text-slate-200">SIP Hub</span>
          </Link>

          <Link href="/invest?tab=ipo" className="p-3 rounded-xl bg-[#131C2E] border border-slate-800 text-center hover:border-slate-700 transition-all flex flex-col items-center gap-1.5">
            <span className="w-9 h-9 rounded-xl bg-amber-600/10 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-medium text-slate-200">IPO Desk</span>
          </Link>

          <Link href="/protect" className="p-3 rounded-xl bg-[#131C2E] border border-slate-800 text-center hover:border-slate-700 transition-all flex flex-col items-center gap-1.5">
            <span className="w-9 h-9 rounded-xl bg-teal-600/10 text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-medium text-slate-200">Insurance</span>
          </Link>

          <Link href="/borrow" className="p-3 rounded-xl bg-[#131C2E] border border-slate-800 text-center hover:border-slate-700 transition-all flex flex-col items-center gap-1.5">
            <span className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </span>
            <span className="text-xs font-medium text-slate-200">Loans</span>
          </Link>
        </div>
      </div>

      {/* 5. Active Applications Tracker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            My Applications
          </h2>
          <Link href="/applications" className="text-xs text-blue-400 hover:text-blue-300">
            View All
          </Link>
        </div>

        {applications.length > 0 ? (
          <div className="space-y-2">
            {applications.map((app) => (
              <Card key={app.id} className="p-3.5 bg-[#131C2E]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-white">{app.productCode.replace(/_/g, ' ')}</span>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-slate-300">{app.applicationNumber}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {app.notes && (
                  <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 line-clamp-1">
                    {app.notes}
                  </p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-4 text-center text-xs text-slate-400">
            No active applications yet. Explore services above to get started.
          </Card>
        )}
      </div>

      {/* 6. Notifications Feed */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recent Updates
          </h2>
          {notifications.map((n) => (
            <div key={n.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <div className="font-semibold text-slate-200">{n.title}</div>
              <p className="text-slate-400 mt-0.5">{n.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* 7. Regulatory Boundary Notice */}
      <StatusBanner
        type="regulatory"
        title="Regulatory Disclosure"
        message="Tradosphere Wealth Management is an Authorised Person of SMC Global Securities Ltd. TWM does not independently provide stock tips, investment advice, or guaranteed returns."
      />
    </div>
  );
}
