'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { calculateSIP } from '@/lib/calculators';
import {
  PieChart,
  Repeat,
  Sparkles,
  Calculator,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
  TrendingUp,
  ArrowLeft,
  Shield,
  ExternalLink,
} from 'lucide-react';

function InvestContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const initialTab =
    urlTab === 'sip'
      ? 'sip'
      : urlTab === 'mf'
      ? 'mf'
      : urlTab === 'stocks'
      ? 'stocks'
      : 'overview';

  const [activeTab, setActiveTab] = useState<'overview' | 'mf' | 'sip' | 'stocks'>(initialTab);
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('1Y');

  // SIP Calculator State
  const [monthlyAmount, setMonthlyAmount] = useState<number>(5000);
  const [years, setYears] = useState<number>(10);
  const [expectedRate, setExpectedRate] = useState<number>(12);

  // Application Modal States
  const [submittingProduct, setSubmittingProduct] = useState<string | null>(null);
  const [applicantNotes, setApplicantNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Pure calculation logic via shared calculators library
  const { totalInvested, estimatedFutureValue, estimatedGain } = calculateSIP({
    monthlyAmount,
    years,
    expectedRate,
  });

  async function handleApply(productCategory: 'MUTUAL_FUND' | 'SIP' | 'IPO', productCode: string) {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCategory,
          productCode,
          details: {
            monthlyAmount: productCategory === 'SIP' ? monthlyAmount : undefined,
            tenureYears: productCategory === 'SIP' ? years : undefined,
            submittedVia: 'Client Portal',
          },
          notes: applicantNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmissionSuccess(data.application.applicationNumber);
        setSubmittingProduct(null);
        setApplicantNotes('');
      } else {
        alert(data.error || 'Failed to submit application');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting application');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with back link matching reference */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Investments</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Portfolio tracking, mutual funds, SIP &amp; equities
            </p>
          </div>
        </div>
      </div>

      {submissionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Application Successfully Created!</div>
            <p className="mt-0.5">
              Application ID: <span className="font-mono text-white font-bold">{submissionSuccess}</span>.
              Our wealth operations desk has been notified.
            </p>
            <button
              onClick={() => setSubmissionSuccess(null)}
              className="mt-2 text-xs font-semibold text-emerald-300 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Tabs matching Screen 03: Overview, Mutual Funds, SIP, Stocks */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 rounded-lg font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('mf')}
          className={`py-2 rounded-lg font-medium transition-all ${
            activeTab === 'mf'
              ? 'bg-emerald-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mutual Funds
        </button>
        <button
          onClick={() => setActiveTab('sip')}
          className={`py-2 rounded-lg font-medium transition-all ${
            activeTab === 'sip'
              ? 'bg-emerald-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          SIP
        </button>
        <button
          onClick={() => setActiveTab('stocks')}
          className={`py-2 rounded-lg font-medium transition-all ${
            activeTab === 'stocks'
              ? 'bg-emerald-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Stocks
        </button>
      </div>

      {/* TAB 0: PORTFOLIO OVERVIEW — HONEST UNLINKED BROKER STATE */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Card 1: Investment Value — Truthful Unlinked State */}
          <Card className="p-4 sm:p-5 bg-gradient-to-br from-[#101b2b] via-[#0d1624] to-[#09101a] border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Total Investment Value</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Not Linked
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight font-mono">
                  ₹ 0
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] font-medium text-slate-400">
                    Holdings and ledger reside within partner broker SMC Ace. Link your account to view live valuation.
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Link href="/applications">
                  <Button size="sm" variant="outline" className="text-xs">
                    Link Demat Account
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Card 2: Asset Allocation & Investment Gateway */}
          <Card className="p-4 sm:p-5 bg-[#111927] border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white tracking-tight">Portfolio &amp; Asset Allocation</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Awaiting Connection
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Once your Demat account or Mutual Fund folio is linked, your live asset allocation across Equity, Debt, and Hybrid schemes will automatically populate here.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => setActiveTab('mf')}
                className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5"
              >
                Explore Mutual Funds
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setActiveTab('sip')}
                className="w-full text-xs border-emerald-800/80 text-emerald-300 hover:bg-emerald-950/40 font-semibold py-2.5"
              >
                Calculate SIP Returns
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 1: MUTUAL FUNDS */}
      {activeTab === 'mf' && (
        <div className="space-y-4">
          <StatusBanner
            type="regulatory"
            title="SEBI Disclaimer"
            message="Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing. Past performance is not indicative of future returns. Calculated projections are illustrative and do not represent guaranteed returns."
          />

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Scheme Categories
            </h2>

            <Card className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Equity Schemes</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Large Cap, Mid Cap, Small Cap, Flexi Cap, and ELSS Tax Savers.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Very High Risk
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span>Long-term capital appreciation</span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setSubmittingProduct('MF_EQUITY')}
                >
                  Apply / Inquire
                </Button>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Hybrid Schemes</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Balanced Advantage Funds, Dynamic Asset Allocation, Multi-Asset.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  Moderate Risk
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span>Automatic equity-debt rebalancing</span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setSubmittingProduct('MF_HYBRID')}
                >
                  Apply / Inquire
                </Button>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Debt &amp; Liquid Funds</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Liquid, Overnight, Corporate Bond, and Banking &amp; PSU Debt.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Low to Moderate Risk
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span>Capital preservation &amp; short-term liquidity</span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setSubmittingProduct('MF_DEBT')}
                >
                  Apply / Inquire
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: SIP HUB & CALCULATOR */}
      {activeTab === 'sip' && (
        <div className="space-y-4">
          <Card className="p-4 bg-gradient-to-br from-[#131C2E] to-[#15233E]">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">SIP Return Calculator</h2>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Estimate illustrative wealth accumulation using disciplined monthly rupee-cost averaging.
            </p>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Monthly Investment</span>
                  <span className="font-bold text-white font-mono">₹{monthlyAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Investment Horizon (Years)</span>
                  <span className="font-bold text-white font-mono">{years} Years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Expected Annual Return Rate</span>
                  <span className="font-bold text-emerald-400 font-mono">{expectedRate}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={expectedRate}
                  onChange={(e) => setExpectedRate(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Calculator Output */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs mt-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Invested</span>
                  <span className="font-mono font-bold text-slate-200">
                    ₹{totalInvested.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Est. Gain</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ₹{estimatedGain.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Total Value</span>
                  <span className="font-mono font-bold text-white">
                    ₹{estimatedFutureValue.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => setSubmittingProduct('SIP_START')}
                className="w-full text-xs mt-2 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Start SIP Mandate
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: STOCKS DESK */}
      {activeTab === 'stocks' && (
        <div className="space-y-4">
          <Card className="p-4 bg-[#111927] border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Equity Trading with SMC Global</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Execute NSE/BSE stock trades with low brokerage via SMC Ace terminal.
                </p>
              </div>
              <Shield className="w-6 h-6 text-amber-400" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <Link href="/markets">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  View Market Watchlist
                </Button>
              </Link>
              <Link href="/home">
                <Button variant="smc" size="sm" className="w-full text-xs">
                  Access SMC Demat <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* SUBMISSION MODAL */}
      {submittingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h2 className="text-base font-bold text-white">Confirm Investment Intent</h2>
            <p className="text-xs text-slate-400">
              Product Category: <span className="font-semibold text-white">{submittingProduct}</span>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Investment Notes / Goal (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Retirement planning, tax saving under 80C, or child education..."
                  value={applicantNotes}
                  onChange={(e) => setApplicantNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  isLoading={isSubmitting}
                  onClick={() => handleApply('MUTUAL_FUND', submittingProduct)}
                >
                  Confirm &amp; Proceed
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  className="w-1/3 text-xs"
                  onClick={() => setSubmittingProduct(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientInvestPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Investments...</div>}>
      <InvestContent />
    </Suspense>
  );
}
