'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radio,
  Plus,
  Settings,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Filter,
  Layers,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { AdminNav } from '@/components/layout/AdminNav';

interface SignalSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  instrument?: string;
  exchange?: string;
  symbol?: string;
  riskLevel: string;
  status: string;
  version: number;
  publishedAt?: string;
  createdAt: string;
  aiReviews?: Array<{
    agentName: string;
    complianceStatus: string;
    status: string;
  }>;
}

const TABS = [
  { id: 'ALL', label: 'All Signals' },
  { id: 'DRAFT', label: 'Drafts' },
  { id: 'AI_REVIEW', label: 'AI Review' },
  { id: 'HUMAN_REVIEW', label: 'Human Review Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'PUBLISHED', label: 'Published' },
  { id: 'CLOSED', label: 'Closed' },
  { id: 'REJECTED', label: 'Rejected' },
];

export default function AdminSignalsPage() {
  const [signals, setSignals] = useState<SignalSummary[]>([]);
  const [selectedTab, setSelectedTab] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSignals() {
      setLoading(true);
      try {
        const statusParam = selectedTab !== 'ALL' ? `?status=${selectedTab}` : '';
        const res = await fetch(`/api/signals${statusParam}`);
        const data = await res.json();
        if (data.success) {
          setSignals(data.signals || []);
        }
      } catch (e) {
        console.error('Failed to fetch signals:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchSignals();
  }, [selectedTab]);

  // Calculate Metrics
  const totalCount = signals.length;
  const draftCount = signals.filter((s) => s.status === 'DRAFT').length;
  const humanReviewCount = signals.filter((s) => s.status === 'HUMAN_REVIEW').length;
  const publishedCount = signals.filter((s) => s.status === 'PUBLISHED').length;

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Radio className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">
                  Signals & Market Intelligence Desk
                </h1>
                <p className="text-xs text-slate-400">
                  Approved research workflow • 6-Agent AI review • Compliance verification • Human publication
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/signals/settings"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings & Pricing</span>
            </Link>

            <Link
              href="/admin/signals/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Signal</span>
            </Link>
          </div>
        </div>

        {/* Top KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400">Total Managed</div>
            <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400">Drafts</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{draftCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400">Review Pending</div>
            <div className="text-2xl font-black text-blue-400 mt-1">{humanReviewCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400">Active Published</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{publishedCount}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800 no-scrollbar">
          {TABS.map((tab) => {
            const active = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  active
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Signals Table */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Radio className="w-6 h-6 animate-pulse mx-auto mb-2 text-blue-400" />
            Loading signals desk...
          </div>
        ) : signals.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800 p-8 text-slate-400 text-xs">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
            No signals found under &apos;{selectedTab.replace(/_/g, ' ')}&apos;.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Title & Instrument</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Risk Level</th>
                    <th className="py-3 px-3">AI Review</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Version</th>
                    <th className="py-3 px-3">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {signals.map((s) => {
                    const aegis = s.aiReviews?.find((r) => r.agentName === 'AEGIS');
                    const aiCount = s.aiReviews?.length || 0;

                    const statusColor =
                      s.status === 'PUBLISHED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : s.status === 'APPROVED'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : s.status === 'HUMAN_REVIEW'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        : s.status === 'REJECTED'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700';

                    return (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-200">{s.title}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {s.instrument && <span className="text-blue-400 font-medium">{s.instrument}</span>}
                            {s.exchange && <span className="text-slate-500">({s.exchange})</span>}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold">
                            {s.category.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              s.riskLevel === 'HIGH' || s.riskLevel === 'VERY_HIGH'
                                ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                                : s.riskLevel === 'LOW'
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                            }`}
                          >
                            {s.riskLevel}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {aiCount === 0 ? (
                            <span className="text-[10px] text-slate-500">Not Run</span>
                          ) : aegis?.complianceStatus === 'BLOCK' ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 text-[10px] font-semibold flex items-center gap-1 w-fit">
                              <ShieldAlert className="w-3 h-3" /> Aegis Block
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 text-[10px] font-semibold flex items-center gap-1 w-fit">
                              <Cpu className="w-3 h-3" /> 6-Agents OK
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusColor}`}>
                            {s.status.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                          v{s.version}
                        </td>

                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {new Date(s.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/admin/signals/${s.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>Workspace</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
