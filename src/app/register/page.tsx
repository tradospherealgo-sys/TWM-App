'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pan, setPan] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time password criteria
  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const allCriteriaMet = Object.values(passwordCriteria).every(Boolean);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!allCriteriaMet) {
      setError('Please fulfill all password security requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (pan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan.trim())) {
      setError('PAN must be in valid format (e.g. ABCDE1234F).');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          pan: pan.trim().toUpperCase() || undefined,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      // Successful registration sets session cookie and redirects to onboarding
      router.push('/onboarding');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B111E] flex flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
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
            <h2 className="text-base font-semibold text-slate-100">Create Client Account</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Register for wealth management and regulated broker gateway access
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
                label="Full Legal Name"
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
                label="Mobile Number (optional)"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Permanent Account Number (PAN, optional)"
                type="text"
                autoCapitalize="characters"
                maxLength={10}
                placeholder="ABCDE1234F"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Required for SEBI KYC compliance. You can also provide this in onboarding.
              </p>
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Password strength checklist */}
              {password.length > 0 && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
                  <div className="font-medium text-slate-300 mb-1">Password Requirements:</div>
                  <div className="grid grid-cols-2 gap-1">
                    <span className={`flex items-center gap-1.5 ${passwordCriteria.length ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordCriteria.length ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      8+ characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordCriteria.uppercase ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordCriteria.uppercase ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      Uppercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordCriteria.lowercase ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordCriteria.lowercase ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      Lowercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordCriteria.number ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordCriteria.number ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      Number
                    </span>
                    <span className={`flex items-center gap-1.5 col-span-2 ${passwordCriteria.special ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordCriteria.special ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      Special character (!@#$%^&*)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Input
                label="Confirm Password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword.length > 0 && (
                <div className="mt-1 text-[11px] flex items-center gap-1">
                  {passwordsMatch ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1">
                      <X className="w-3 h-3" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-3"
              isLoading={isLoading}
              disabled={isLoading || (password.length > 0 && (!allCriteriaMet || !passwordsMatch))}
            >
              Register & Continue <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Regulatory disclaimer */}
        <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500 max-w-sm mx-auto">
          Notice: Public registration creates a standard Client account. Tradosphere Wealth Management does not offer independent investment advice or trading tips. Market investments are subject to market risks.
        </p>
      </div>
    </div>
  );
}
