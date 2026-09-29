'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBanner } from '@/components/ui/StatusBanner';
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
} from 'lucide-react';

function InvestContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'sip' ? 'sip' : searchParams.get('tab') === 'ipo' ? 'ipo' : 'mf';

  const [activeTab, setActiveTab] = useState<'mf' | 'sip' | 'ipo'>(initialTab);

  // SIP Calculator State
  const [monthlyAmount, setMonthlyAmount] = useState<number>(5000);
  const [years, setYears] = useState<number>(10);
  const [expectedRate, setExpectedRate] = useState<number>(12);

  // Application Modal States
  const [submittingProduct, setSubmittingProduct] = useState<string | null>(null);
  const [applicantNotes, setApplicantNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Calculation Logic (Standard SIP Compound Formula)
  const totalMonths = years * 12;
  const monthlyRate = expectedRate / 100 / 12;
  const totalInvested = monthlyAmount * totalMonths;
  // FV = P * [((1 + i)^n - 1) / i] * (1 + i)
  const estimatedFutureValue = Math.round(
    monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
  );
  const estimatedGain = estimatedFutureValue - totalInvested;

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
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Investment Desk</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Mutual Funds, Systematic Investment Plans &amp; IPOs
        </p>
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

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('mf')}
          className={`py-2 rounded-lg font-medium transition-all ${
            activeTab === 'mf'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mutual Funds
        </button>
        <button
          onClick={() => setActiveTab('sip')}
          className={`py-2 rounded-lg font-medium transition-all ${
            activeTab === 'sip'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          SIP Hub
        </button>
        <button
          onClick={() => setActiveTab('ipo')}
          className={`py-2 rounded-lg font-medium transition-all ${
            activeTab === 'ipo'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          IPO Center
        </button>
      </div>

      {/* TAB 1: MUTUAL FUNDS */}
      {activeTab === 'mf' && (
        <div className="space-y-4">
          <StatusBanner
            type="regulatory"
            title="SEBI Disclaimer"
            message="Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing. Past performance is not indicative of future returns."
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
              <Calculator className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold text-white">SIP Return Calculator</h2>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Estimate illustrative wealth accumulation using disciplined monthly rupee-cost averaging.
            </p>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Monthly Investment</span>
                  <span className="font-bold text-blue-400">₹{monthlyAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Investment Period</span>
                  <span className="font-bold text-blue-400">{years} Years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Expected Illustrative Return</span>
                  <span className="font-bold text-blue-400">{expectedRate}% p.a.</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="18"
                  step="0.5"
                  value={expectedRate}
                  onChange={(e) => setExpectedRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-slate-800">
              <div className="p-2.5 rounded-xl bg-slate-900/90">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Invested</span>
                <span className="text-sm font-bold text-white">₹{totalInvested.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40">
                <span className="text-[10px] text-blue-300 uppercase font-semibold block">Estimated Value</span>
                <span className="text-sm font-bold text-blue-300">₹{estimatedFutureValue.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-emerald-400 font-medium text-center">
              Illustrative Gain: +₹{estimatedGain.toLocaleString()}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <Button
                variant="primary"
                size="md"
                className="w-full text-xs"
                onClick={() => setSubmittingProduct('SIP_MANDATE')}
              >
                Start SIP Mandate Setup
              </Button>
            </div>
          </Card>

          <StatusBanner
            type="regulatory"
            title="Mandatory Disclosure"
            message="Illustrations shown are for educational purposes and do not represent guaranteed returns. Real market returns fluctuate over time."
          />
        </div>
      )}

      {/* TAB 3: IPO CENTER */}
      {activeTab === 'ipo' && (
        <div className="space-y-4">
          <StatusBanner
            type="info"
            title="UPI ASBA Bidding"
            message="IPOs are facilitated via direct UPI ASBA bidding through your bank and linked SMC Global Demat account. Allotment is strictly decided by the Registrar (RTA) as per SEBI allotment basis."
          />

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active &amp; Upcoming IPOs
            </h2>

            <Card className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">Acme Solar Technologies Ltd</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      OPEN
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Renewable Energy EPC</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Price Band</span>
                  <span className="text-slate-200 font-medium">₹275 - ₹289</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Lot Size</span>
                  <span className="text-slate-200 font-medium">51 Shares (₹14,739)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Closes in 2 days
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setSubmittingProduct('IPO_ACME_SOLAR')}
                >
                  Apply via ASBA
                </Button>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">Swiggy Limited</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                      UPCOMING
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Food Delivery &amp; Quick Commerce</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Price Band</span>
                  <span className="text-slate-200 font-medium">₹371 - ₹390</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Lot Size</span>
                  <span className="text-slate-200 font-medium">38 Shares (₹14,820)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Opens Nov 06
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSubmittingProduct('IPO_SWIGGY_PRE')}
                >
                  Pre-Apply
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* APPLICATION SUBMISSION MODAL */}
      {submittingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 space-y-4">
            <h2 className="text-base font-bold text-white">
              Confirm Service Request: {submittingProduct.replace(/_/g, ' ')}
            </h2>
            <p className="text-xs text-slate-300">
              Submitting this request assigns a dedicated Wealth Executive to facilitate your KYC verification and execution workflow.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Any specific scheme or notes?
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder="e.g. Preferred AMC, nominee details, or target horizon..."
                value={applicantNotes}
                onChange={(e) => setApplicantNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full text-xs"
                isLoading={isSubmitting}
                onClick={() =>
                  handleApply(
                    submittingProduct.startsWith('IPO')
                      ? 'IPO'
                      : submittingProduct.startsWith('SIP')
                      ? 'SIP'
                      : 'MUTUAL_FUND',
                    submittingProduct
                  )
                }
              >
                Submit Application
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
      )}
    </div>
  );
}

export default function InvestPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading investment desk...</div>}>
      <InvestContent />
    </Suspense>
  );
}

