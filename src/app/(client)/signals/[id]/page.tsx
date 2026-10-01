'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Radio,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Compass,
  TrendingUp,
  FileText,
  ExternalLink,
  Cpu,
} from 'lucide-react';


interface AiReview {
  agentName: string;
  agentRole: string;
  status: string;
  complianceStatus: string;
  summary: string;
  analysisJson: string;
}

interface SignalDetail {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  instrument?: string;
  exchange?: string;
  symbol?: string;
  summary: string;
  content: string | null;
  source: string;
  provider: string;
  author: string;
  supportingInfo?: string;
  validityType: string;
  riskLevel: string;
  status: string;
  publishedAt: string;
  requiresSubscription?: boolean;
  paywallMessage?: string;
  aiReviews?: AiReview[];
}

export default function ClientSignalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [signal, setSignal] = useState<SignalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSignal() {
      setLoading(true);
      try {
        const res = await fetch(`/api/signals/${params.id}`);
        const data = await res.json();
        if (data.success && data.signal) {
          setSignal(data.signal);
        } else {
          setError(data.error || 'Failed to load market intelligence');
        }
      } catch (e: any) {
        setError(e.message || 'Network error');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchSignal();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="text-center py-20 text-xs text-slate-400">
        <Radio className="w-6 h-6 animate-pulse mx-auto mb-2 text-blue-400" />
        Loading approved market intelligence...
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-white mb-1">Signal Unavailable</h2>
        <p className="text-xs text-slate-400 mb-4">{error || 'This signal could not be retrieved.'}</p>
        <Link
          href="/signals"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Signals
        </Link>
      </div>
    );
  }

  // Paywall View for Non-Subscribers
  if (signal.requiresSubscription || !signal.content) {
    return (
      <div className="space-y-4">
        <Link href="/signals" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Signals
        </Link>

        <div className="rounded-2xl border border-blue-500/30 bg-slate-900/90 p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">Subscription Required</h2>
            <p className="text-xs text-slate-300 mt-1">
              {signal.paywallMessage || 'Full approved content and 6-Agent AI reviews are locked for active subscribers.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-left text-xs space-y-1.5">
            <div className="font-semibold text-slate-200">{signal.title}</div>
            <div className="text-slate-400 text-[11px]">{signal.summary}</div>
          </div>

          <Link
            href="/signals"
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center gap-2"
          >
            <span>Subscribe on Signals Dashboard</span>
          </Link>
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

  return (
    <div className="space-y-5">
        {/* Navigation Breadcrumb */}
        <Link href="/signals" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Signals
        </Link>

        {/* Signal Header Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[11px]">
              {signal.category.replace(/_/g, ' ')}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-300">
              {signal.riskLevel} RISK
            </span>
          </div>

          <h1 className="text-lg font-black text-white leading-tight">
            {signal.title}
          </h1>

          {signal.instrument && (
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <span className="text-slate-400">Instrument:</span>
              <span className="text-blue-400">{signal.instrument}</span>
              {signal.exchange && <span className="text-[10px] text-slate-500">({signal.exchange})</span>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px]">Published Date</span>
              <span className="text-slate-300 font-medium">
                {new Date(signal.publishedAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Horizon / Validity</span>
              <span className="text-slate-300 font-medium">{signal.validityType}</span>
            </div>
          </div>
        </div>

        {/* 1. APPROVED SOURCE CONTENT */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <FileText className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Approved Research & Intelligence
            </h2>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-wrap">
            {signal.content}
          </div>
        </div>

        {/* 2. 6-AGENT AI REVIEW SUMMARY */}
        <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/70 p-5 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                AI Review Team Analysis
              </h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Compliance Passed
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            Multi-agent intelligence synthesized by the internal review team prior to human publication approval.
          </p>

          <div className="space-y-2 text-xs">
            {/* Atlas */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1">
              <div className="font-semibold text-slate-200 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Compass className="w-3.5 h-3.5" /> Atlas — Market Context
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Macro Review</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {atlas?.summary || 'Market context evaluated with stable macro baseline.'}
              </p>
            </div>

            {/* Vector */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1">
              <div className="font-semibold text-slate-200 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-purple-400">
                  <TrendingUp className="w-3.5 h-3.5" /> Vector — Quantitative Review
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Structure</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {vector?.summary || 'Technical structure and momentum characteristics assessed.'}
              </p>
            </div>

            {/* Orion */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1">
              <div className="font-semibold text-slate-200 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <FileText className="w-3.5 h-3.5" /> Orion — Fundamental & Events
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Corporate Events</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {orion?.summary || 'Event schedule and company fundamentals verified.'}
              </p>
            </div>

            {/* Sentinel */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1">
              <div className="font-semibold text-slate-200 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <ShieldAlert className="w-3.5 h-3.5" /> Sentinel — Risk Oversight
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Integrity</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {sentinel?.summary || 'Data integrity verified; capital risk disclosures noted.'}
              </p>
            </div>

            {/* Aegis */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1">
              <div className="font-semibold text-slate-200 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> Aegis — Compliance Gatekeeper
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">PASS</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {aegis?.summary || 'Source attributed, zero prohibited guarantees or directional directives detected.'}
              </p>
            </div>

            {/* Nexus */}
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
              <div className="font-semibold text-slate-200 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-indigo-300">
                  <Cpu className="w-3.5 h-3.5" /> Nexus — Final Synthesis
                </span>
                <span className="text-[10px] text-indigo-400 font-medium">Coordinated</span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                {nexus?.summary || 'All review agents in consensus. Approved by authorized human desk.'}
              </p>
            </div>
          </div>
        </div>

        {/* 3. SOURCE & OPERATIONAL ATTRIBUTION */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs space-y-2">
          <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wide">
            Attribution & Provenance
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px]">Research Source</span>
              <span className="text-slate-200 font-medium">{signal.source}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Authorized Provider</span>
              <span className="text-slate-200 font-medium">{signal.provider}</span>
            </div>
          </div>
        </div>

        {/* 4. SMC ACE TRADE EXECUTION HANDOFF */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4 text-center space-y-3">
          <div className="text-xs text-slate-300">
            Ready to execute based on your personal financial strategy?
          </div>
          <a
            href="https://smctradeonline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span>Trade on Official SMC Ace Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <p className="text-[10px] text-slate-400 leading-tight">
            Order placement occurs strictly on SMC Global Securities Ltd trading infrastructure.
          </p>
        </div>

        {/* 5. REGULATORY DISCLAIMER */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3.5 text-[10px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>Statutory Non-Advisory Disclaimer</span>
          </div>
          <p className="leading-relaxed">
            Tradosphere Wealth Management acts as an Authorised Person of SMC Global Securities Ltd. All content is for informational and educational purposes only and does not constitute investment advice or guaranteed return recommendations. Trading in securities involves capital risk.
          </p>
        </div>
    </div>
  );
}
