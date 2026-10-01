import React from 'react';

export default function ClientLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-800 rounded" />
          <div className="h-6 w-36 bg-slate-800 rounded-lg" />
          <div className="h-2.5 w-24 bg-slate-800/60 rounded" />
        </div>
        <div className="h-6 w-20 bg-slate-800 rounded-full" />
      </div>

      {/* Hero Card Skeleton */}
      <div className="h-32 bg-[#131C2E] border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="h-4 w-40 bg-slate-800 rounded" />
        <div className="h-3 w-64 bg-slate-800/60 rounded" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="h-8 bg-slate-800 rounded-xl" />
          <div className="h-8 bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* Grid items skeleton */}
      <div className="grid grid-cols-2 gap-2">
        <div className="h-20 bg-[#111927] border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="h-3 w-16 bg-slate-800 rounded" />
          <div className="h-5 w-24 bg-slate-800 rounded" />
        </div>
        <div className="h-20 bg-[#111927] border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="h-3 w-16 bg-slate-800 rounded" />
          <div className="h-5 w-24 bg-slate-800 rounded" />
        </div>
      </div>

      {/* Service grid skeleton */}
      <div className="grid grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-[#131C2E] border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800" />
            <div className="h-2.5 w-12 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
