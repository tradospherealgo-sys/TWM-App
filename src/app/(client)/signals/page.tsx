'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Radio,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';


interface SignalItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  subcategory?: string;
  instrument?: string;
  exchange?: string;
  symbol?: string;
  summary: string;
  content?: string | null;
  source: string;
  provider: string;
  validityType?: string;
  riskLevel: string;
  status: string;
  publishedAt: string;
  requiresSubscription?: boolean;
  aiReviews?: Array<{
    agentName: string;
    status: string;
    complianceStatus: string;
    summary: string;
  }>;
}

interface SubscriptionInfo {
  hasActiveSubscription: boolean;
  status: string;
  monthlyPrice?: number;
  daysRemaining?: number;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Intelligence' },
  { id: 'INDEX', label: 'Indices' },
  { id: 'EQUITY', label: 'Equities' },
  { id: 'F_AND_O', label: 'F&O Derivatives' },
  { id: 'COMMODITY', label: 'Commodities' },
  { id: 'IPO', label: 'IPOs' },
  { id: 'MUTUAL_FUNDS', label: 'Mutual Funds & SIP' },
  { id: 'RISK_ALERTS', label: 'Risk Alerts' },
  { id: 'MACRO_EVENTS', label: 'Macro Events' },
];

export default function ClientSignalsPage() {
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Subscription status
      const subRes = await fetch('/api/signals/subscription');
      const subData = await subRes.json();
      if (subData.success) {
        setSubscription(subData.subscription);
      }

      // 2. Fetch Signals list
      const catParam = selectedCategory !== 'ALL' ? `?category=${selectedCategory}` : '';
      const sigRes = await fetch(`/api/signals${catParam}`);
      const sigData = await sigRes.json();
      if (sigData.success) {
        setSignals(sigData.signals || []);
      }
    } catch (e) {
      console.error('Failed to load signals:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubscribe() {
    setSubscribing(true);
    setSubscribeMessage(null);
    try {
      const res = await fetch('/api/signals/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SUBSCRIBE' }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscribeMessage('Subscription activated successfully! Unlocking research...');
        await fetchData();
      } else {
        setSubscribeMessage(data.error || 'Failed to activate subscription');
      }
    } catch (e: any) {
      setSubscribeMessage(e.message || 'Error processing subscription');
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <div className="space-y-5">
        {/* Module Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Radio className="w-4 h-4 animate-pulse" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white">Tradosphere Signals</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Approved market intelligence evaluated by 6-Agent AI review team
            </p>
          </div>

          {subscription?.hasActiveSubscription && (
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Active Plan
            </span>
          )}
        </div>

        {/* PAYWALL CARD (If Not Subscribed) */}
        {!subscription?.hasActiveSubscription && (
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/40 via-slate-900/60 to-slate-900/90 p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-15 pointer-events-none">
              <Sparkles className="w-24 h-24 text-blue-400" />
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 rounded-md border border-blue-500/30">
                Premium Access
              </span>
              <div className="text-right">
                <span className="text-2xl font-black text-white">
                  ₹{subscription?.monthlyPrice || 499}
                </span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
            </div>

            <h2 className="text-base font-bold text-white mb-1">
              Unlock Professional Signals & Market Intelligence
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Get institutional research and multi-asset intelligence verified by our 6-agent AI review team (Atlas, Vector, Orion, Sentinel, Aegis, Nexus).
            </p>

            <div className="space-y-2 mb-4 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Multi-Asset Coverage (Equities, F&O, Indices, Commodities, IPOs)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Transparent 6-Agent AI Review & Compliance Oversight</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Real-Time In-App Critical Risk Alerts & Operational Notes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Direct 1-Click Handoff to Official SMC Ace Trading Portal</span>
              </div>
            </div>

            {subscribeMessage && (
              <div className="mb-3 text-xs p-2.5 rounded-lg bg-blue-900/40 border border-blue-700/50 text-blue-200">
                {subscribeMessage}
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {subscribing ? 'Activating...' : `Subscribe Now (₹${subscription?.monthlyPrice || 499}/mo)`}
            </button>

            <p className="text-[10px] text-slate-400 text-center mt-3 leading-tight">
              Non-advisory educational research. Zero guaranteed returns. Trading in securities involves capital risk.
            </p>
          </div>
        )}

        {/* Categories Horizontal Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Signals List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Radio className="w-6 h-6 animate-pulse mx-auto mb-2 text-blue-400" />
            Loading market intelligence feed...
          </div>
        ) : signals.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 text-slate-400 text-xs">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
            No market intelligence available under this category currently.
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => {
              const isLocked = signal.requiresSubscription;
              const riskColor =
                signal.riskLevel === 'HIGH' || signal.riskLevel === 'VERY_HIGH'
                  ? 'text-red-400 bg-red-950/60 border-red-800/60'
                  : signal.riskLevel === 'LOW'
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
                  : 'text-amber-400 bg-amber-950/60 border-amber-800/60';

              return (
                <div
                  key={signal.id}
                  className="rounded-xl border border-slate-800/90 bg-slate-900/70 p-4 hover:border-slate-700 transition-all space-y-3"
                >
                  {/* Top metadata line */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-blue-400 border border-slate-700">
                        {signal.category.replace(/_/g, ' ')}
                      </span>
                      {signal.instrument && (
                        <span className="font-semibold text-slate-200">
                          {signal.instrument}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${riskColor}`}>
                      {signal.riskLevel} RISK
                    </span>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {signal.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {signal.summary}
                    </p>
                  </div>

                  {/* Attribution & Timestamp */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>Source: {signal.source}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(signal.publishedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Action Link / Locked state */}
                  {isLocked ? (
                    <div className="pt-1">
                      <button
                        onClick={handleSubscribe}
                        className="w-full py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Unlock 6-Agent AI Review & Research</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <Link
                        href={`/signals/${signal.id}`}
                        className="w-full py-2 px-3 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>View Approved Analysis & AI Reviews</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Regulatory Disclosure Footer */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-3.5 text-[10px] text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1 font-semibold text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>SEBI Regulatory & Authorised Person Disclosure</span>
          </div>
          <p className="leading-relaxed">
            Tradosphere Wealth Management acts as an Authorised Person of SMC Global Securities Ltd. All signals and market intelligence provided through this module are strictly for educational and informational purposes and do not constitute personal investment advice or price targets. Trade execution occurs exclusively on SMC Ace.
          </p>
        </div>
    </div>
  );
}
