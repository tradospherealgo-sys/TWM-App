'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const initialTab = searchParams.get('tab') === 'enquiry' || searchParams.get('tab') === 'enquire' ? 'enquiry' : 'login';

  const [activeTab, setActiveTab] = useState<'login' | 'enquiry'>(initialTab);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Public Lead Enquiry form state
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [productInterest, setProductInterest] = useState('DEMAT');
  const [leadNotes, setLeadNotes] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadSuccess, setLeadSuccess] = useState<{ id: string; name: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      // Route based on role or explicit redirect
      if (redirectUrl && !redirectUrl.startsWith('/api')) {
        router.push(redirectUrl);
      } else {
        if (data.user.role === 'ADMIN') {
          router.push('/admin');
        } else if (data.user.role === 'EMPLOYEE') {
          router.push('/employee');
        } else {
          router.push('/home');
        }
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLeadError(null);

    const cleanPhone = leadPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setLeadError('Please provide a valid 10-digit mobile number.');
      return;
    }

    setIsSubmittingLead(true);

    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName.trim(),
          phone: cleanPhone,
          email: leadEmail.trim() || undefined,
          productInterest,
          notes: leadNotes.trim() || undefined,
          source: 'WEBSITE',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry. Please try again.');
      }

      setLeadSuccess({
        id: data.lead?.id || 'SUBMITTED',
        name: leadName.trim(),
      });
      setLeadName('');
      setLeadPhone('');
      setLeadEmail('');
      setLeadNotes('');
    } catch (err: any) {
      setLeadError(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setIsSubmittingLead(false);
    }
  }

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      {/* Brand Header */}
      <div className="text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center font-bold text-white shadow-lg text-xl mb-3">
          TWM
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Tradosphere Wealth Management
        </h1>
        <p className="mt-1 text-xs text-amber-400 font-medium flex items-center justify-center gap-1">
          <Shield className="w-3.5 h-3.5 inline" /> Authorised Person • SMC Global Securities
        </p>
      </div>

      {/* Card */}
      <div className="mt-6 bg-[#131C2E] py-8 px-6 shadow-xl rounded-2xl border border-slate-800 sm:px-10">
        {/* Navigation Tabs: Sign In vs Request Consultation */}
        <div className="flex rounded-xl bg-slate-900/80 p-1 mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('enquiry');
              setLeadSuccess(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'enquiry'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Request Consultation
          </button>
        </div>

        {activeTab === 'login' ? (
          <div>
            <div className="mb-5 pb-4 border-b border-slate-800">
              <h2 className="text-base font-semibold text-slate-100">Sign in to your account</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Access Client Panel, Employee OS, or Admin Control Center
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  label="Email address"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
                Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  Create an account
                </Link>
              </p>
              <p className="text-xs text-slate-500">
                Need investment guidance?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('enquiry')}
                  className="font-semibold text-amber-400 hover:text-amber-300 transition-colors inline"
                >
                  Enquire online
                </button>
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-5 pb-4 border-b border-slate-800">
              <h2 className="text-base font-semibold text-slate-100">Request Financial Consultation</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect with our wealth desk for Demat, investments, or advisory inquiries
              </p>
            </div>

            {leadSuccess ? (
              <div className="py-4 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Enquiry Logged Successfully</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Thank you, <strong className="text-slate-200">{leadSuccess.name}</strong>. Your enquiry has been registered in our CRM pipeline. Our wealth management executive will contact you shortly.
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-2">
                    Ref ID: #{leadSuccess.id.slice(-6).toUpperCase()}
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setLeadSuccess(null);
                    }}
                  >
                    Submit Another Enquiry
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => setActiveTab('login')}
                  >
                    Return to Sign In
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                {leadError && (
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{leadError}</span>
                  </div>
                )}

                <div>
                  <Input
                    label="Full Legal Name"
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                  />
                </div>

                <div>
                  <Input
                    label="Mobile Number (10 digits)"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                  />
                </div>

                <div>
                  <Input
                    label="Email Address (optional)"
                    type="email"
                    placeholder="name@example.com"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Service of Interest
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    value={productInterest}
                    onChange={(e) => setProductInterest(e.target.value)}
                  >
                    <option value="DEMAT">SMC Demat &amp; Trading Account</option>
                    <option value="MUTUAL_FUND">Mutual Funds &amp; Wealth Planning</option>
                    <option value="SIP">Systematic Investment Plan (SIP)</option>
                    <option value="IPO">IPO Desk &amp; ASBA Bidding</option>
                    <option value="INSURANCE">Term Life &amp; Health Insurance</option>
                    <option value="LOAN">Loan Against Securities / Loans</option>
                    <option value="GENERAL">General Wealth Management</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Enquiry Details (optional)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us what you are looking for..."
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                  isLoading={isSubmittingLead}
                >
                  Submit Enquiry <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Regulatory disclaimer */}
      <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500 max-w-sm mx-auto">
        Notice: Tradosphere Wealth Management does not offer independent investment advice or trading tips. Market investments are subject to market risks. Read all scheme documents carefully.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0B111E] flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center text-xs text-slate-400">Loading sign-in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
