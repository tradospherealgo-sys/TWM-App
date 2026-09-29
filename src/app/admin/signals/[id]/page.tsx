'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Radio,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Send,
  XCircle,
  RotateCcw,
  Sparkles,
  Compass,
  TrendingUp,
  FileText,
  Clock,
  UserCheck,
} from 'lucide-react';
import { AdminNav } from '@/components/layout/AdminNav';

interface AiReview {
  id: string;
  agentName: string;
  agentRole: string;
  model: string;
  status: string;
  complianceStatus: string;
  summary: string;
  analysisJson: string;
  latencyMs: number;
}

interface SignalDetail {
  id: string;
  slug: string;
  title: string;
  category: string;
  subcategory?: string;
  instrument?: string;
  exchange?: string;
  symbol?: string;
  summary: string;
  content: string;
  source: string;
  provider: string;
  author: string;
  supportingInfo?: string;
  validityType: string;
  riskLevel: string;
  status: string;
  publishedAt?: string;
  closedAt?: string;
  rejectionReason?: string;
  version: number;
  aiReviews: AiReview[];
}

export default function AdminSignalWorkspacePage() {
  const params = useParams();
  const router = useRouter();

  const [signal, setSignal] = useState<SignalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningAi, setRunningAi] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSignal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/signals/${params.id}`);
      const data = await res.json();
      if (data.success && data.signal) {
        setSignal(data.signal);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load signal' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error fetching signal' });
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchSignal();
    }
  }, [fetchSignal, params.id]);

  async function handleRunAiReview() {
    setRunningAi(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/signals/${params.id}/ai-review`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: '6-Agent AI review completed successfully!' });
        await fetchSignal();
      } else {
        setMessage({ type: 'error', text: data.error || 'AI review failed' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error running AI review' });
    } finally {
      setRunningAi(false);
    }
  }

  async function handleDecision(action: 'APPROVE' | 'REJECT' | 'SEND_BACK') {
    let notes = '';
    if (action === 'REJECT') {
      const promptVal = window.prompt('Enter rejection reason:');
      if (promptVal === null) return;
      notes = promptVal;
    } else if (action === 'SEND_BACK') {
      const promptVal = window.prompt('Enter revision feedback notes for analyst:');
      if (promptVal === null) return;
      notes = promptVal;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/signals/${params.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Signal ${action.toLowerCase()}d successfully.` });
        await fetchSignal();
      } else {
        setMessage({ type: 'error', text: data.error || 'Action failed' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error recording decision' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePublish() {
    if (!window.confirm('Are you sure you want to publish this signal? Eligible active subscribers will receive in-app notifications immediately.')) {
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/signals/${params.id}/publish`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Signal published and broadcast to active subscribers!' });
        await fetchSignal();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to publish' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error publishing signal' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClose() {
    if (!window.confirm('Mark this signal as CLOSED?')) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/signals/${params.id}/close`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Signal marked as closed.' });
        await fetchSignal();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to close' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error closing signal' });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B111E] text-slate-100">
        <AdminNav />
        <div className="py-20 text-center text-xs text-slate-400">
          <Radio className="w-6 h-6 animate-pulse mx-auto mb-2 text-blue-400" />
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="min-h-screen bg-[#0B111E] text-slate-100">
        <AdminNav />
        <div className="max-w-4xl mx-auto py-20 text-center text-xs text-slate-400">
          Signal not found.
        </div>
      </div>
    );
  }

  const atlas = signal.aiReviews?.find((r) => r.agentName === 'ATLAS');
  const vector = signal.aiReviews?.find((r) => r.agentName === 'VECTOR');
  const orion = signal.aiReviews?.find((r) => r.agentName === 'ORION');
  const sentinel = signal.aiReviews?.find((r) => r.agentName === 'SENTINEL');
  const aegis = signal.aiReviews?.find((r) => r.agentName === 'AEGIS');
  const nexus = signal.aiReviews?.find((r) => r.agentName === 'NEXUS');

  const isAegisBlocked = aegis?.complianceStatus === 'BLOCK';

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 pb-16">
      <AdminNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Back navigation & Status bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
          <Link
            href="/admin/signals"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Signals Desk
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">v{signal.version}</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                signal.status === 'PUBLISHED'
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                  : signal.status === 'APPROVED'
                  ? 'bg-blue-950/60 text-blue-400 border-blue-800/60'
                  : signal.status === 'HUMAN_REVIEW'
                  ? 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60'
                  : signal.status === 'REJECTED'
                  ? 'bg-red-950/60 text-red-400 border-red-800/60'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              STATUS: {signal.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* User alert messages */}
        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
              message.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                : 'bg-red-950/60 border-red-800 text-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Signal Overview Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[11px]">
                {signal.category.replace(/_/g, ' ')}
              </span>
              {signal.subcategory && (
                <span className="text-slate-400 text-[11px]">• {signal.subcategory}</span>
              )}
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-300">
              {signal.riskLevel} RISK
            </span>
          </div>

          <h1 className="text-lg font-black text-white">{signal.title}</h1>
          <p className="text-xs text-slate-300 leading-relaxed">{signal.summary}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px]">Instrument</span>
              <span className="text-slate-200 font-semibold">{signal.instrument || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Exchange / Symbol</span>
              <span className="text-slate-200 font-semibold">{signal.exchange || 'NSE'} {signal.symbol ? `• ${signal.symbol}` : ''}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Source Attribution</span>
              <span className="text-slate-200 font-semibold">{signal.source}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Author / Analyst</span>
              <span className="text-slate-200 font-semibold">{signal.author}</span>
            </div>
          </div>
        </div>

        {/* 1. SOURCE RESEARCH CONTENT */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Source Research & Content Payload
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Original Submission</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
            {signal.content}
          </div>
        </div>

        {/* 2. 6-AGENT AI REVIEW TEAM CONSOLE */}
        <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/70 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Six-Agent AI Intelligence & Compliance Review Team
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Parallel evaluation by Atlas, Vector, Orion, Sentinel, Aegis & Nexus coordinator
              </p>
            </div>

            <button
              onClick={handleRunAiReview}
              disabled={runningAi || signal.status === 'PUBLISHED' || signal.status === 'CLOSED'}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-40 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>{runningAi ? 'AI Team Reviewing...' : 'Run 6-Agent AI Review Team'}</span>
            </button>
          </div>

          {signal.aiReviews.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
              AI Review Team has not yet analyzed this draft. Click &quot;Run 6-Agent AI Review Team&quot; above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Atlas */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                  <span className="font-bold text-blue-400 flex items-center gap-1.5">
                    <Compass className="w-4 h-4" /> 01. ATLAS
                  </span>
                  <span className="text-[10px] text-slate-400">Market Context & Macro</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{atlas?.summary}</p>
              </div>

              {/* Vector */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                  <span className="font-bold text-purple-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> 02. VECTOR
                  </span>
                  <span className="text-[10px] text-slate-400">Technical & Quantitative</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{vector?.summary}</p>
              </div>

              {/* Orion */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> 03. ORION
                  </span>
                  <span className="text-[10px] text-slate-400">Fundamental & Events</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{orion?.summary}</p>
              </div>

              {/* Sentinel */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                  <span className="font-bold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> 04. SENTINEL
                  </span>
                  <span className="text-[10px] text-slate-400">Risk & Data Integrity</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{sentinel?.summary}</p>
              </div>

              {/* Aegis */}
              <div
                className={`p-4 rounded-xl border space-y-2 md:col-span-2 ${
                  isAegisBlocked
                    ? 'bg-red-950/30 border-red-800/80'
                    : 'bg-emerald-950/20 border-emerald-800/60'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      isAegisBlocked ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> 05. AEGIS — Compliance Gatekeeper
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isAegisBlocked ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    VERDICT: {aegis?.complianceStatus || 'PENDING'}
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed text-[11px]">{aegis?.summary}</p>
              </div>

              {/* Nexus */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2 md:col-span-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-indigo-800/60">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" /> 06. NEXUS — Intelligence Synthesis Coordinator
                  </span>
                  <span className="text-[10px] text-indigo-400 font-semibold">
                    Consensus Review
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed text-[11px]">{nexus?.summary}</p>
              </div>
            </div>
          )}
        </div>

        {/* 3. HUMAN DECISION CONSOLE */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Human Review & Editorial Authorization
            </h2>
          </div>

          {isAegisBlocked && (
            <div className="p-4 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-300">Approval Hard-Blocked by Aegis Compliance Gatekeeper</div>
                <p className="mt-0.5 text-red-200/90 leading-relaxed">
                  This signal contains regulatory or attribution violations identified during AI review. In accordance with SEBI Authorised Person guidelines, administrators cannot approve or publish this signal until the violations are resolved.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {/* APPROVE */}
              <button
                onClick={() => handleDecision('APPROVE')}
                disabled={actionLoading || isAegisBlocked || signal.status === 'APPROVED' || signal.status === 'PUBLISHED'}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-30 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Signal</span>
              </button>

              {/* REJECT */}
              <button
                onClick={() => handleDecision('REJECT')}
                disabled={actionLoading || signal.status === 'REJECTED'}
                className="px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-bold border border-red-700/60 flex items-center gap-1.5 transition-all disabled:opacity-30 active:scale-95"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>

              {/* SEND BACK */}
              <button
                onClick={() => handleDecision('SEND_BACK')}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-30 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Send Back for Revision</span>
              </button>
            </div>

            {/* PUBLISH / CLOSE */}
            <div className="flex items-center gap-2">
              {signal.status === 'APPROVED' && (
                <button
                  onClick={handlePublish}
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md shadow-blue-900/40 flex items-center gap-1.5 transition-all active:scale-95 animate-pulse"
                >
                  <Send className="w-4 h-4" />
                  <span>PUBLISH TO SUBSCRIBERS</span>
                </button>
              )}

              {(signal.status === 'PUBLISHED' || signal.status === 'ACTIVE') && (
                <button
                  onClick={handleClose}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <span>Mark as Closed</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
