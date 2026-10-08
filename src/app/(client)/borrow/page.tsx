'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBanner } from '@/components/ui/StatusBanner';
import {
  Landmark,
  Coins,
  Building,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export default function BorrowPage() {
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [requestedAmount, setRequestedAmount] = useState('500000');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAppNum, setSuccessAppNum] = useState<string | null>(null);

  async function handleSubmitApplication() {
    if (!selectedLoan) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCategory: 'LOAN',
          productCode: selectedLoan,
          details: { requestedAmount, loanType: selectedLoan },
          notes: `Requested Amount: ₹${Number(requestedAmount).toLocaleString()}. Details: ${notes}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessAppNum(data.application.applicationNumber);
        setSelectedLoan(null);
        setNotes('');
      } else {
        alert(data.error || 'Failed to submit loan application');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting loan application');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Credit &amp; Loans Desk</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Personal loans, business credit &amp; liquidity against securities
        </p>
      </div>

      <StatusBanner
        type="regulatory"
        title="Lender Credit Policy"
        message="Tradosphere Wealth Management acts as a loan facilitator and corporate business correspondent for scheduled banks and RBI-registered NBFCs. Credit sanction is subject to the sole underwriting discretion of the respective lender. Tradosphere does not independently guarantee loan approval."
      />

      {successAppNum && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Loan Application Initiated!</div>
            <p className="mt-0.5">
              Reference ID: <span className="font-mono text-white font-bold">{successAppNum}</span>.
              Our credit processing executive will verify your documents and initiate lender eligibility assessment.
            </p>
            <button
              onClick={() => setSuccessAppNum(null)}
              className="mt-2 text-xs font-semibold text-emerald-300 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Loan Products */}
      <div className="space-y-3">
        {/* Loan Against Securities */}
        <Card className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-400 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm text-white">Loan Against Securities (LAS)</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Instant Liquidity
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Avail an overdraft facility against your shares and mutual fund holdings without selling your long-term portfolio.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 py-2 border-y border-slate-800">
            <div>• Up to 50% LTV on Shares</div>
            <div>• Up to 80% LTV on Debt MFs</div>
            <div>• Pay interest only on drawn amount</div>
            <div>• Zero prepayment penalties</div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-slate-400">Security pledge required</span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setSelectedLoan('LOAN_AGAINST_SECURITIES')}
            >
              Apply for LAS
            </Button>
          </div>
        </Card>

        {/* Personal Loan */}
        <Card className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-sm text-white">Personal Loan</h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Unsecured loans for salaried and professional individuals with flexible tenures from 12 to 60 months.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 py-2 border-y border-slate-800">
            <div>• ₹50,000 to ₹40 Lakhs</div>
            <div>• Minimal documentation</div>
            <div>• Competitive reducing rates</div>
            <div>• Quick lender sanction</div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-slate-400">Min. Net Salary: ₹25,000/mo</span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setSelectedLoan('PERSONAL_LOAN')}
            >
              Apply Now
            </Button>
          </div>
        </Card>

        {/* Business Loan */}
        <Card className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-sm text-white">Business &amp; Working Capital Loan</h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Funding support for MSMEs, proprietorships, and enterprises for business expansion or inventory management.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 py-2 border-y border-slate-800">
            <div>• Collateral-free up to ₹75L</div>
            <div>• Working capital limits</div>
            <div>• GST returns-based assessment</div>
            <div>• Custom repayment schedules</div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-slate-400">Min. 2 years business vintage</span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setSelectedLoan('BUSINESS_LOAN')}
            >
              Inquire
            </Button>
          </div>
        </Card>
      </div>

      {/* LOAN APPLICATION MODAL */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 space-y-4">
            <h2 className="text-base font-bold text-white">
              Apply for {selectedLoan.replace(/_/g, ' ')}
            </h2>
            <p className="text-xs text-slate-300">
              Please enter your required funding amount. Our credit desk will review basic eligibility before submitting to our lending partners.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Requested Loan Amount (₹)
              </label>
              <input
                type="number"
                min="25000"
                step="10000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Purpose / Additional Details
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[70px]"
                placeholder="e.g. Portfolio pledge details, current monthly EMI obligations, or employer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full text-xs"
                isLoading={isSubmitting}
                onClick={handleSubmitApplication}
              >
                Submit Loan File
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-1/3 text-xs"
                onClick={() => setSelectedLoan(null)}
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
