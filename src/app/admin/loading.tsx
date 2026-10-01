import React from 'react';

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="space-y-2">
          <div className="h-3 w-40 bg-red-950/40 rounded" />
          <div className="h-7 w-64 bg-slate-800 rounded-lg" />
          <div className="h-3 w-72 bg-slate-800/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-28 bg-slate-800 rounded-lg" />
          <div className="h-8 w-28 bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-[#111927] border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-6 w-14 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Tables Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-[#131C2E] border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="h-4 w-44 bg-slate-800 rounded" />
          <div className="h-10 bg-slate-900 rounded-lg" />
          <div className="h-10 bg-slate-900 rounded-lg" />
          <div className="h-10 bg-slate-900 rounded-lg" />
        </div>
        <div className="h-72 bg-[#131C2E] border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="h-4 w-44 bg-slate-800 rounded" />
          <div className="h-10 bg-slate-900 rounded-lg" />
          <div className="h-10 bg-slate-900 rounded-lg" />
          <div className="h-10 bg-slate-900 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
