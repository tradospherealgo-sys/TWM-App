'use client';

import React from 'react';
import { WifiOff, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function OfflinePage() {
  function handleRetry() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#131C2E] border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
        {/* Brand Shield & Offline Icon */}
        <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <WifiOff className="w-7 h-7" />
          </div>
        </div>

        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Connection Required
          </h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            You are currently offline. In accordance with financial security standards, live market data and account services require an active internet connection.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Sensitive customer records are never stored unencrypted offline.</span>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            className="w-full text-xs font-semibold"
            onClick={handleRetry}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Connection
          </Button>
        </div>
      </div>
    </div>
  );
}
