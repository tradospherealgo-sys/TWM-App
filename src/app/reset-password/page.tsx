'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TradosphereLogo } from '@/components/ui/TradosphereLogo';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If token is missing from URL
  if (!token) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-200">Invalid or Missing Reset Token</div>
            <p className="mt-1 text-slate-300">
              The password reset link is invalid or does not contain a security token. Please request a new recovery link.
            </p>
          </div>
        </div>

        <Link href="/forgot-password" className="block w-full">
          <Button variant="primary" size="md" className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
            Request New Reset Link <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>

        <div className="text-center pt-2">
          <Link href="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while resetting your password.');
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-xs text-emerald-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Password Reset Complete</span>
          </div>
          <p className="text-slate-300">
            Your password has been securely updated. You can now sign in to your Tradosphere account with your new credentials.
          </p>
        </div>

        <Link href="/login" className="block w-full pt-2">
          <Button variant="primary" size="lg" className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
            Proceed to Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <Input
          label="New Password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Min 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div>
        <Input
          label="Confirm New Password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white"
        isLoading={isLoading}
      >
        Set New Password <ArrowRight className="w-4 h-4 ml-1.5" />
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
  );
}

export default function ResetPasswordPage() {
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
          <div className="mb-5 pb-4 border-b border-slate-800">
            <h2 className="text-base font-semibold text-slate-100">Create New Password</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter and confirm your new secure password.
            </p>
          </div>

          <Suspense fallback={<div className="text-center py-6 text-xs text-slate-400">Loading form...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
