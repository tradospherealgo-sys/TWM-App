'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log sanitized error summary to console without leaking sensitive stack
    console.error('[TWM App Error]', error.digest || 'Internal application error');
  }, [error]);

  // Clean, non-technical, secure error message
  const userFriendlyMessage =
    'We encountered an unexpected issue while processing your request. Your account and financial records remain safe.';

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#131C2E] border border-slate-800 rounded-2xl p-6 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Service Temporarily Unavailable
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {userFriendlyMessage}
          </p>
          {error.digest && (
            <p className="text-[10px] text-slate-600 font-mono mt-1">
              Reference Code: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="primary"
            size="md"
            className="w-full text-xs font-semibold"
            onClick={() => reset()}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
          </Button>

          <Link href="/home" className="w-full">
            <Button
              variant="secondary"
              size="md"
              className="w-full text-xs font-semibold"
            >
              <Home className="w-3.5 h-3.5 mr-1.5" /> Dashboard
            </Button>
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-800/80">
          <Link
            href="/support"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Need assistance? Contact Desk Support
          </Link>
        </div>
      </div>
    </div>
  );
}
