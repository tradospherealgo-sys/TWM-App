import React from 'react';

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-label="Loading application"
      className="min-h-screen bg-[#0B111E] text-slate-100 flex flex-col items-center justify-center p-4 space-y-4"
    >
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="font-extrabold text-white text-base tracking-wider">TS</span>
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
