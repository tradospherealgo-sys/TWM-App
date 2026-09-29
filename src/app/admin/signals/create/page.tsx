'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Radio,
  Save,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { AdminNav } from '@/components/layout/AdminNav';

const CATEGORIES = [
  { value: 'INDEX', label: 'Index Intelligence' },
  { value: 'EQUITY', label: 'Equity Intelligence' },
  { value: 'F_AND_O', label: 'F&O Derivatives Intelligence' },
  { value: 'COMMODITY', label: 'Commodity Intelligence' },
  { value: 'IPO', label: 'IPO Research & Desk' },
  { value: 'MUTUAL_FUNDS', label: 'Mutual Funds Research' },
  { value: 'SIP', label: 'SIP Strategic Allocation' },
  { value: 'MARKET_OUTLOOK', label: 'Market Outlook & Thematic' },
  { value: 'CORPORATE_ACTIONS', label: 'Corporate Actions & Results' },
  { value: 'MACRO_EVENTS', label: 'Macro Events & Rates' },
  { value: 'RISK_ALERTS', label: 'Risk Alerts & Capital Warnings' },
  { value: 'EDUCATIONAL', label: 'Educational & Strategy Framework' },
];

export default function CreateSignalPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    category: 'INDEX',
    subcategory: '',
    instrument: '',
    exchange: 'NSE',
    symbol: '',
    summary: '',
    content: '',
    source: 'Institutional Research Desk',
    provider: 'Tradosphere Analytics Desk',
    author: 'Principal Market Strategist',
    supportingInfo: '',
    validityType: 'SESSION',
    riskLevel: 'MODERATE',
  });

  function updateField(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success && data.signal) {
        router.push(`/admin/signals/${data.signal.id}`);
      } else {
        setError(data.error || 'Failed to create signal');
      }
    } catch (e: any) {
      setError(e.message || 'Error submitting signal draft');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100">
      <AdminNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation */}
        <Link
          href="/admin/signals"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Signals Desk
        </Link>

        {/* Title */}
        <div className="pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Create Market Intelligence Draft</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Create source research content. After saving, run the 6-Agent AI review team prior to human approval.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Classification & Instruments */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Classification & Underlying Instrument
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subcategory
                </label>
                <input
                  type="text"
                  placeholder="e.g. Volatility Structure, Earnings Preview"
                  value={form.subcategory}
                  onChange={(e) => updateField('subcategory', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Instrument Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. NIFTY 50 Index, RELIANCE Equity"
                  value={form.instrument}
                  onChange={(e) => updateField('instrument', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Exchange
                  </label>
                  <select
                    value={form.exchange}
                    onChange={(e) => updateField('exchange', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                    <option value="MCX">MCX</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Symbol
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NIFTY"
                    value={form.symbol}
                    onChange={(e) => updateField('symbol', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Research Content & Summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              2. Research & Intelligence Content
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Headline / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. NIFTY 50 Range Breakout & Volatility Analysis"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Summary (Client Card Teaser) *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Short 2-3 line summary of key observations..."
                value={form.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Detailed Research Content *
              </label>
              <textarea
                rows={8}
                required
                placeholder="Comprehensive market analysis, structure, derivatives context, and strategic scenario evaluation..."
                value={form.content}
                onChange={(e) => updateField('content', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Markdown formatting supported. Do not include guaranteed profit claims or buy/sell directives.
              </p>
            </div>
          </div>

          {/* Section 3: Attribution, Validity & Risk */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              3. Attribution & Risk Parameters
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Source Attribution *
                </label>
                <input
                  type="text"
                  required
                  value={form.source}
                  onChange={(e) => updateField('source', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Authorized Provider *
                </label>
                <input
                  type="text"
                  required
                  value={form.provider}
                  onChange={(e) => updateField('provider', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Author / Analyst *
                </label>
                <input
                  type="text"
                  required
                  value={form.author}
                  onChange={(e) => updateField('author', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Validity Horizon
                </label>
                <select
                  value={form.validityType}
                  onChange={(e) => updateField('validityType', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="INTRADAY">INTRADAY</option>
                  <option value="SESSION">SESSION</option>
                  <option value="SWING">SWING</option>
                  <option value="POSITIONAL">POSITIONAL</option>
                  <option value="EVENT_BASED">EVENT BASED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Risk Classification
                </label>
                <select
                  value={form.riskLevel}
                  onChange={(e) => updateField('riskLevel', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="MODERATE">MODERATE</option>
                  <option value="HIGH">HIGH</option>
                  <option value="VERY_HIGH">VERY HIGH</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supporting Data Notes
                </label>
                <input
                  type="text"
                  placeholder="NSE filings, RBI schedule, etc."
                  value={form.supportingInfo}
                  onChange={(e) => updateField('supportingInfo', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/admin/signals"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Draft...' : 'Create & Proceed to Review Workspace'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
