'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  FileText,
  UserCheck,
  AlertCircle,
  ExternalLink,
  Shield,
  Phone,
  CreditCard,
} from 'lucide-react';
import type { OnboardingDetails } from '@/lib/onboarding';

export default function OnboardingPage() {
  const [details, setDetails] = useState<OnboardingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile update form state
  const [phone, setPhone] = useState('');
  const [pan, setPan] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    fetchOnboardingDetails();
  }, []);

  async function fetchOnboardingDetails() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/onboarding');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load onboarding status');
      }

      setDetails(data.onboarding);
      if (data.onboarding) {
        setPhone(data.onboarding.user.phone || '');
        setPan(data.onboarding.customer.pan || '');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to onboarding service');
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    const formattedPan = pan.trim().toUpperCase();
    if (formattedPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formattedPan)) {
      setUpdateError('Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F)');
      setIsUpdating(false);
      return;
    }

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim() || undefined,
          pan: formattedPan || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile details');
      }

      setDetails(data.onboarding);
      setUpdateSuccess('Profile details saved successfully.');
      setShowEditProfile(false);
    } catch (err: any) {
      setUpdateError(err.message || 'Error updating profile details');
    } finally {
      setIsUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse py-6">
        <div className="h-8 bg-slate-800 rounded-lg w-3/4" />
        <div className="h-24 bg-slate-800 rounded-2xl" />
        <div className="h-48 bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="py-8 text-center space-y-4">
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs inline-flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error || 'Failed to retrieve onboarding details'}</span>
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={fetchOnboardingDetails}>
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  const { stage, progressPercentage, customerCode, steps, nextAction } = details;
  const isProfileComplete = steps.profileDetails.completed;

  return (
    <div className="space-y-5">
      {/* 1. Header & ID Badge */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Client Onboarding</h1>
          <p className="text-xs text-slate-400 mt-0.5">Regulatory compliance & profile verification</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Customer ID</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 text-blue-300 border border-slate-700">
            {customerCode}
          </span>
        </div>
      </div>

      {/* 2. Progress Tracker Bar */}
      <Card className="bg-[#131C2E] border-slate-800 p-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium text-slate-300">Onboarding Progress</span>
          <span className="font-bold text-blue-400">{progressPercentage}% Complete</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
          <span>Stage: {stage.replace(/_/g, ' ')}</span>
          <StatusBadge status={details.customer.kycStatus} />
        </div>
      </Card>

      {/* 3. Next Action CTA Card */}
      <Card className="bg-gradient-to-br from-[#162238] to-[#131C2E] border-blue-800/40 p-4 relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            {stage === 'COMPLETED' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : stage === 'ACTION_REQUIRED' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <Clock className="w-5 h-5 text-blue-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">{nextAction.title}</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{nextAction.description}</p>

            <div className="mt-3">
              {nextAction.targetUrl === '/onboarding' ? (
                !showEditProfile && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowEditProfile(true)}
                  >
                    {nextAction.actionLabel} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )
              ) : (
                <Link href={nextAction.targetUrl}>
                  <Button variant="primary" size="sm">
                    {nextAction.actionLabel} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Step Breakdown Checklist */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Compliance Milestones
        </h2>

        {/* Milestone 1: Registration */}
        <Card className="bg-[#131C2E] border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">{steps.accountCreated.label}</div>
              <div className="text-[11px] text-slate-400">{steps.accountCreated.details}</div>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 bg-emerald-950/60 rounded-full border border-emerald-800/40">
            Completed
          </span>
        </Card>

        {/* Milestone 2: Personal Profile & PAN */}
        <Card className="bg-[#131C2E] border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  steps.profileDetails.completed
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {steps.profileDetails.completed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">{steps.profileDetails.label}</div>
                <div className="text-[11px] text-slate-400">{steps.profileDetails.details}</div>
              </div>
            </div>
            <div>
              {steps.profileDetails.completed ? (
                <button
                  onClick={() => setShowEditProfile((prev) => !prev)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                >
                  {showEditProfile ? 'Close' : 'Update'}
                </button>
              ) : (
                <span className="text-[10px] text-amber-400 font-medium px-2 py-0.5 bg-amber-950/60 rounded-full border border-amber-800/40">
                  Required
                </span>
              )}
            </div>
          </div>

          {/* Inline Profile Form */}
          {(!isProfileComplete || showEditProfile) && (
            <form onSubmit={handleProfileUpdate} className="pt-3 border-t border-slate-800 space-y-3">
              {updateError && (
                <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800/80 text-[11px] text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{updateError}</span>
                </div>
              )}
              {updateSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-800/80 text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{updateSuccess}</span>
                </div>
              )}

              <div>
                <Input
                  label="Mobile Number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <Input
                  label="Permanent Account Number (PAN)"
                  type="text"
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  SEBI mandate requires a valid 10-character Permanent Account Number.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                {isProfileComplete && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditProfile(false)}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" variant="primary" size="sm" isLoading={isUpdating}>
                  Save Profile Details
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Milestone 3: KYC Documents */}
        <Card className="bg-[#131C2E] border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                steps.kycDocuments.completed
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">{steps.kycDocuments.label}</div>
              <div className="text-[11px] text-slate-400">{steps.kycDocuments.details}</div>
            </div>
          </div>
          <Link href="/documents">
            <Button variant="outline" size="sm">
              Vault <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </Card>

        {/* Milestone 4: Compliance Verification */}
        <Card className="bg-[#131C2E] border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                steps.complianceReview.completed
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : details.customer.kycStatus === 'REJECTED'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">{steps.complianceReview.label}</div>
              <div className="text-[11px] text-slate-400">{steps.complianceReview.details}</div>
            </div>
          </div>
          <div>
            <StatusBadge status={details.customer.kycStatus} />
          </div>
        </Card>
      </div>

      {/* 5. SEBI / DPDP Regulatory Compliance Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1 leading-relaxed">
        <div className="flex items-center gap-1.5 text-amber-400/90 font-medium">
          <Shield className="w-3.5 h-3.5" />
          <span>Statutory Compliance Architecture</span>
        </div>
        <p>
          Tradosphere Wealth Management adheres strictly to SEBI KYC registration agency guidelines and the Digital Personal Data Protection (DPDP) Act. All documents uploaded to your vault are encrypted in transit and at rest, and verified exclusively by qualified compliance officers.
        </p>
      </div>
    </div>
  );
}
