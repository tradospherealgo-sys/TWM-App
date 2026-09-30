'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
