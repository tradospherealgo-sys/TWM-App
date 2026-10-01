import React from 'react';
import Link from 'next/link';
import { Compass, Home, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#131C2E] border border-slate-800 rounded-2xl p-6 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            Error 404
          </span>
          <h1 className="text-lg font-bold text-white tracking-tight mt-2">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            The destination you requested does not exist or may have been relocated.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/home" className="block w-full">
            <Button
              variant="primary"
              size="md"
              className="w-full text-xs font-semibold"
            >
              <Home className="w-3.5 h-3.5 mr-1.5" /> Return to Dashboard
            </Button>
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-800/80">
          <Link
            href="/support"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Contact Customer Support
          </Link>
        </div>
      </div>
    </div>
  );
}
