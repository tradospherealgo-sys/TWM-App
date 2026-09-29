'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radio,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  BookOpen,
  TrendingUp,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { EmployeeNav } from '@/components/layout/EmployeeNav';

interface SignalItem {
  id: string;
  title: string;
  category: string;
  instrument?: string;
  exchange?: string;
  riskLevel: string;
  status: string;
  summary: string;
  content: string;
  source: string;
  provider: string;
  validityType: string;
  publishedAt: string;
  aiReviews?: Array<{
    agentName: string;
    summary: string;
    complianceStatus: string;
  }>;
}

export default function EmployeeSignalsPage() {
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSignal, setSelectedSignal] = useState<SignalItem | null>(null);

  useEffect(() => {
    fetchSignals();
  }, []);

  async function fetchSignals() {
    setLoading(true);
    try {
      const res = await fetch('/api/signals');
      const data = await res.json();
      if (data.success) {
        setSignals(data.signals || []);
        if (data.signals?.length > 0) {
          setSelectedSignal(data.signals[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load employee signals:', e);
    } finally {
      setLoading(false);
    }
  }

  const filteredSignals = signals.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.instrument && s.instrument.toLowerCase().includes(search.toLowerCase())) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 pb-16">
      <EmployeeNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Radio className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">
                  Signals & Market Intelligence Knowledge Desk
                </h1>
                <p className="text-xs text-slate-400">
                  Approved institutional research reference for client queries and relationship managers
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Read-Only Compliance Desk</span>
            </span>
          </div>
        </div>

        {/* Regulatory Boundaries Banner for Staff */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-300">Staff Compliance Directive: SEBI Authorised Person Boundaries</div>
            <p className="leading-relaxed text-[11px]">
              Employees must never present these research analyses as personal stock recommendations or guaranteed return calls. Do not provide entry/target price predictions over phone or WhatsApp. All trade executions must be placed directly by the customer on official SMC Ace terminals.
            </p>
          </div>
        </div>

        {/* Workspace split: Left List, Right Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Signals Index */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search approved signals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading approved intelligence...</div>
            ) : filteredSignals.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 rounded-xl bg-slate-900/40 border border-slate-800">
                No matching research found.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredSignals.map((s) => {
                  const isSelected = selectedSignal?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSignal(s)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all space-y-1.5 ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500/50 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-blue-400 uppercase tracking-wide">
                          {s.category.replace(/_/g, ' ')}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                          {s.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white leading-snug line-clamp-1">{s.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{s.summary}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Signal Full Detail */}
          <div className="lg:col-span-2">
            {!selectedSignal ? (
              <div className="py-20 text-center rounded-2xl bg-slate-900/40 border border-slate-800 p-8 text-slate-500 text-xs">
                Select an approved research signal from the list to view compliance breakdown.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
                    {selectedSignal.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-400">
                    Published: {new Date(selectedSignal.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-bold text-white">{selectedSignal.title}</h2>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedSignal.summary}</p>
                </div>

                {/* Approved Content */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Approved Content Payload
                  </div>
                  <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedSignal.content}
                  </div>
                </div>

                {/* AI Review Summary */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>6-Agent AI Review Summary</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    {selectedSignal.aiReviews?.map((r) => (
                      <div key={r.agentName} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
                        <div className="font-bold text-slate-300 text-[11px] flex items-center justify-between">
                          <span>{r.agentName}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">{r.complianceStatus}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{r.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Provenance */}
                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Source: {selectedSignal.source}</span>
                  <span>Provider: {selectedSignal.provider}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
