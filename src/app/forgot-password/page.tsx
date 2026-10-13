'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TradosphereLogo } from '@/components/ui/TradosphereLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSubmitted(true);
      setMessage(
        data.message ||
          'If an account matches that email address, password recovery instructions have been initiated. Please check your inbox.'
      );
    } catch (err: any) {
      setError(err.message || 'An error occurred while requesting password reset.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070C15] flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <TradosphereLogo size="xl" showSubtitle={true} className="mb-2" />
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Client Portal, Wealth Management &amp; Institutional Gateway
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-[#131C2E] py-8 px-6 shadow-xl rounded-2xl border border-slate-800 sm:px-10">
          <div className="mb-5 pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Reset Your Password</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter your registered email address to receive password recovery instructions.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Request Submitted</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{message}</p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                For security reasons, reset links expire in 15 minutes. If you do not receive an email or have changed your contact details, please contact our Operations Desk directly.
              </p>

              <div className="pt-2">
                <Link href="/login" className="block w-full">
                  <Button variant="outline" size="md" className="w-full text-xs">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  label="Registered Email Address"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                isLoading={isLoading}
              >
                Send Recovery Instructions <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

              <div className="pt-3 text-center">
                <Link
                  href="/login"
                  className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
                </Link>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500">
              Need immediate assistance? Contact operations at{' '}
              <a href="mailto:admin@tradosphere.in" className="text-slate-400 underline">
                admin@tradosphere.in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
