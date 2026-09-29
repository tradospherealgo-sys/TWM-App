'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBanner } from '@/components/ui/StatusBanner';
import {
  ShieldCheck,
  HeartPulse,
  Car,
  CheckCircle2,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

export default function ProtectPage() {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAppNum, setSuccessAppNum] = useState<string | null>(null);

  async function handleSubmitApplication() {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCategory: 'INSURANCE',
          productCode: selectedProduct,
          details: { insuranceType: selectedProduct },
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessAppNum(data.application.applicationNumber);
        setSelectedProduct(null);
        setNotes('');
      } else {
        alert(data.error || 'Failed to submit insurance inquiry');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting inquiry');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Insurance &amp; Protection</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Health, Term Life &amp; Motor protection policies
        </p>
      </div>

      <StatusBanner
        type="regulatory"
        title="Distributor Notice"
        message="Tradosphere Wealth Management acts as a corporate facilitator/distributor for licensed Indian insurance companies. Insurance is the subject matter of solicitation."
      />

      {successAppNum && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Insurance Application Created!</div>
            <p className="mt-0.5">
              Ref ID: <span className="font-mono text-white font-bold">{successAppNum}</span>.
              A protection advisor will contact you to verify medical eligibility and compare insurer quotes.
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

      {/* Insurance Products */}
      <div className="space-y-3">
        {/* Comprehensive Health */}
        <Card className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-400 flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-sm text-white">Comprehensive Health Insurance</h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Up to ₹1 Crore cover with 10,000+ cashless hospital networks, zero co-pay, and pre-existing disease riders.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 py-2 border-y border-slate-800">
            <div>✓ Cashless Hospitalization</div>
            <div>✓ Day-Care Treatments</div>
            <div>✓ Restored Sum Assured</div>
            <div>✓ Section 80D Tax Benefit</div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-slate-400">Min. Docs: PAN &amp; Aadhaar</span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setSelectedProduct('HEALTH_INSURANCE')}
            >
              Request Quote
            </Button>
          </div>
        </Card>

        {/* Term Life Protection */}
        <Card className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-sm text-white">Pure Term Life Protection</h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Financial security for your family with high sum assured coverage at economical premiums up to age 85.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 py-2 border-y border-slate-800">
            <div>✓ Critical Illness Rider</div>
            <div>✓ Accidental Death Benefit</div>
            <div>✓ Terminal Illness Payout</div>
            <div>✓ Section 80C Tax Benefit</div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-slate-400">Income Proof required</span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setSelectedProduct('TERM_LIFE_INSURANCE')}
            >
              Request Quote
            </Button>
          </div>
        </Card>

        {/* Motor Insurance */}
        <Card className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-400 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-sm text-white">Comprehensive Motor Insurance</h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Instant policy renewal and zero-depreciation coverage for 2-wheelers and 4-wheelers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 py-2 border-y border-slate-800">
            <div>✓ Zero Depreciation</div>
            <div>✓ 24x7 Roadside Assistance</div>
            <div>✓ Engine &amp; Gearbox Protection</div>
            <div>✓ Instant Digital Policy</div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-slate-400">Instant RC verification</span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setSelectedProduct('MOTOR_INSURANCE')}
            >
              Request Renewal
            </Button>
          </div>
        </Card>
      </div>

      {/* MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 space-y-4">
            <h2 className="text-base font-bold text-white">
              Inquire: {selectedProduct.replace(/_/g, ' ')}
            </h2>
            <p className="text-xs text-slate-300">
              Provide any specific coverage details or family members to cover. A licensed insurance desk officer will prepare quotes from authorized insurance partners.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Notes &amp; Requirements
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder="e.g. Self + Spouse + 1 Child, 10 Lakh sum assured..."
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
                Submit Request
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-1/3 text-xs"
                onClick={() => setSelectedProduct(null)}
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
