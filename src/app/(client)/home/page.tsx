import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getClientOnboardingDetails } from '@/lib/onboarding';
import { getSMCOnboardingDetailsAsync } from '@/lib/adapters/smc';
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
  UserCheck,
} from 'lucide-react';

export default async function ClientHomePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  const smcDetails = await getSMCOnboardingDetailsAsync(user.phone || undefined, user.email || undefined);
  const indices = getIndices();
  const onboardingDetails = user.role === 'CLIENT' ? await getClientOnboardingDetails(user.id) : null;

  // Safe fetch for customer's real applications from database
  const customerProfile = user.customerProfile;
  let applications: any[] = [];
  if (customerProfile) {
    try {
      applications = await prisma.application.findMany({
        where: { customerId: customerProfile.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });
    } catch (e) {
      console.warn('Could not load applications for client home:', e);
      applications = [];
    }
  }

  // Safe fetch for recent notifications
  let notifications: any[] = [];
  try {
    notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
  } catch (e) {
    console.warn('Could not load notifications for client home:', e);
    notifications = [];
  }

  return (
    <div className="space-y-5">
      {/* 1. Header Greeting & Welcome matching reference Screen 01 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-1.5">
            {greeting}, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Your financial journey matters. Let&apos;s grow it together.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block mb-0.5">KYC Status</span>
          <StatusBadge status={customerProfile?.kycStatus || 'VERIFIED'} />
        </div>
      </div>

      {/* 2. Total Portfolio Value Card with Glowing Emerald Sparkline Chart */}
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-[#101b2b] via-[#0d1624] to-[#09101a] border-emerald-900/30 shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Portfolio Value</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight font-mono">
              ₹ 12,48,320
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                ▲ +8.24% <span className="text-slate-400 font-normal">(Last 30 days)</span>
              </span>
            </div>
          </div>

          {/* Sparkline chart SVG */}
          <div className="w-32 h-16 sm:w-40 sm:h-20 shrink-0">
            <svg viewBox="0 0 160 80" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="homeSparklineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,60 Q 25,55 45,40 T 90,45 T 120,25 T 160,10 L 160,80 L 0,80 Z"
                fill="url(#homeSparklineGrad)"
              />
              <path
                d="M 0,60 Q 25,55 45,40 T 90,45 T 120,25 T 160,10"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="160" cy="10" r="3.5" fill="#10b981" className="animate-ping opacity-75" />
              <circle cx="160" cy="10" r="3" fill="#10b981" />
            </svg>
          </div>
        </div>
      </Card>

      {/* 3. 4-Pill Services Quick Grid matching reference Screen 01 */}
      <div className="grid grid-cols-4 gap-2">
        <Link
          href="/invest"
          className="p-3 rounded-2xl bg-[#111927] border border-slate-800/80 hover:border-emerald-600/50 hover:bg-slate-800/40 transition-all flex flex-col items-center text-center gap-1.5 group"
        >
          <span className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <TrendingUp className="w-5 h-5" />
          </span>
          <span className="text-[11px] font-semibold text-slate-200">Investments</span>
        </Link>

        <Link
          href="/invest?tab=mf"
          className="p-3 rounded-2xl bg-[#111927] border border-slate-800/80 hover:border-emerald-600/50 hover:bg-slate-800/40 transition-all flex flex-col items-center text-center gap-1.5 group"
        >
          <span className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <PieChart className="w-5 h-5" />
          </span>
          <span className="text-[11px] font-semibold text-slate-200">Mutual Funds</span>
        </Link>

        <Link
          href="/protect"
          className="p-3 rounded-2xl bg-[#111927] border border-slate-800/80 hover:border-emerald-600/50 hover:bg-slate-800/40 transition-all flex flex-col items-center text-center gap-1.5 group"
        >
          <span className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <span className="text-[11px] font-semibold text-slate-200">Insurance</span>
        </Link>

        <Link
          href="/borrow"
          className="p-3 rounded-2xl bg-[#111927] border border-slate-800/80 hover:border-emerald-600/50 hover:bg-slate-800/40 transition-all flex flex-col items-center text-center gap-1.5 group"
        >
          <span className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <Landmark className="w-5 h-5" />
          </span>
          <span className="text-[11px] font-semibold text-slate-200">Loans</span>
        </Link>
      </div>

      {/* 4. Explore New Opportunities Banner matching reference Screen 01 */}
      <Link href="/invest">
        <Card className="p-4 bg-gradient-to-r from-[#10202e] via-[#111c2a] to-[#0c1824] border-emerald-900/40 hover:border-emerald-600/50 transition-all flex items-center justify-between gap-3 group">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Explore New Opportunities
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Discover curated investment plans based on your goals.
              </p>
            </div>
          </div>
          <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-black transition-all">
            <ArrowRight className="w-4 h-4" />
          </span>
        </Card>
      </Link>

      {/* 5. Market Overview matching reference Screen 01 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Market Overview
          </h2>
          <Link href="/markets" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 bg-[#111927] border-slate-800">
            <div className="text-[11px] font-medium text-slate-400">NIFTY 50</div>
            <div className="text-xs sm:text-sm font-bold text-white mt-1">24,718.60</div>
            <div className="text-[10px] font-semibold text-emerald-400 mt-0.5">▲ +1.24%</div>
          </Card>

          <Card className="p-3 bg-[#111927] border-slate-800">
            <div className="text-[11px] font-medium text-slate-400">SENSEX</div>
            <div className="text-xs sm:text-sm font-bold text-white mt-1">81,641.77</div>
            <div className="text-[10px] font-semibold text-emerald-400 mt-0.5">▲ +1.18%</div>
          </Card>

          <Card className="p-3 bg-[#111927] border-slate-800">
            <div className="text-[11px] font-medium text-slate-400">USD/INR</div>
            <div className="text-xs sm:text-sm font-bold text-white mt-1">83.12</div>
            <div className="text-[10px] font-semibold text-emerald-400 mt-0.5">▲ +0.21%</div>
          </Card>
        </div>
      </div>

      {/* 6. Onboarding Progress Card if not completed */}
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

      {/* 7. SMC Global Trading Card (Authorised Person Boundary) */}
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

        {!smcDetails.isAvailable && (
          <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/70 text-[11px] text-amber-200 mb-3">
            {smcDetails.message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {smcDetails.isAvailable ? (
            <>
              <a
                href={smcDetails.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button variant="smc" size="sm" className="w-full text-xs">
                  Open Demat <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Button>
              </a>
              <a
                href={smcDetails.tradingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button variant="outline" size="sm" className="w-full text-xs border-amber-500/40 text-amber-200 hover:bg-amber-950/40">
                  Access SMC Ace <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Button>
              </a>
            </>
          ) : (
            <>
              <Link href="/support?topic=smc_demat" className="w-full">
                <Button variant="smc" size="sm" className="w-full text-xs">
                  Inquire Demat <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
              <Link href="/support?topic=smc_ace" className="w-full">
                <Button variant="outline" size="sm" className="w-full text-xs border-amber-500/40 text-amber-200 hover:bg-amber-950/40">
                  Contact Desk <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </Card>

      {/* 8. Active Applications Tracker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            My Applications
          </h2>
          <Link href="/applications" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
            View All →
          </Link>
        </div>

        {applications.length > 0 ? (
          <div className="space-y-2">
            {applications.map((app) => (
              <Card key={app.id} className="p-3.5 bg-[#131C2E]">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
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

      {/* 9. Notifications Feed */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recent Updates
            </h2>
            <Link href="/notifications" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
              View all →
            </Link>
          </div>
          {notifications.map((n) => (
            <div key={n.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <div className="font-semibold text-slate-200">{n.title}</div>
              <p className="text-slate-400 mt-0.5">{n.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* 10. Regulatory Boundary Notice */}
      <StatusBanner
        type="regulatory"
        title="Regulatory Disclosure"
        message="Tradosphere Wealth Management is an Authorised Person of SMC Global Securities Ltd. TWM does not independently provide stock tips, investment advice, or guaranteed returns."
      />
    </div>
  );
}
