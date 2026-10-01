import React from 'react';

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-label="Loading application"
      className="min-h-screen bg-[#0B111E] text-slate-100 flex flex-col items-center justify-center p-4 space-y-4"
    >
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm animate-pulse">
          TWM
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/40 animate-ping pointer-events-none" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
          Tradosphere Wealth Management
        </p>
        <p className="text-[11px] text-slate-500">Securing environment...</p>
      </div>
    </div>
  );
}
