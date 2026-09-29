'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  Save,
  CheckCircle2,
  ShieldAlert,
  Radio,
} from 'lucide-react';
import { AdminNav } from '@/components/layout/AdminNav';

const ALL_CATEGORIES = [
  { id: 'INDEX', label: 'Index Intelligence' },
  { id: 'EQUITY', label: 'Equity Intelligence' },
  { id: 'F_AND_O', label: 'F&O Derivatives' },
  { id: 'COMMODITY', label: 'Commodities' },
  { id: 'IPO', label: 'IPO Research' },
  { id: 'MUTUAL_FUNDS', label: 'Mutual Funds Research' },
  { id: 'SIP', label: 'SIP Strategic Allocation' },
  { id: 'MARKET_OUTLOOK', label: 'Market Outlook & Thematic' },
  { id: 'CORPORATE_ACTIONS', label: 'Corporate Actions & Results' },
  { id: 'MACRO_EVENTS', label: 'Macro Events & Rates' },
  { id: 'RISK_ALERTS', label: 'Risk Alerts' },
  { id: 'EDUCATIONAL', label: 'Educational Frameworks' },
];

export default function AdminSignalSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [settings, setSettings] = useState({
    monthlyPrice: 499,
    billingPeriod: 'MONTHLY',
    enabledCategories: ALL_CATEGORIES.map((c) => c.id),
    subscriptionRequired: true,
    notificationsEnabled: true,
    aiProvider: 'heuristic',
    aiModel: 'twm-compliance-engine-v1',
    disclaimer: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/signals/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        let cats = ALL_CATEGORIES.map((c) => c.id);
        try {
          cats = JSON.parse(data.settings.enabledCategoriesJson || '[]');
        } catch {
          // fallback
        }

        setSettings({
          monthlyPrice: data.settings.monthlyPrice || 499,
          billingPeriod: data.settings.billingPeriod || 'MONTHLY',
          enabledCategories: cats,
          subscriptionRequired: data.settings.subscriptionRequired ?? true,
          notificationsEnabled: data.settings.notificationsEnabled ?? true,
          aiProvider: data.settings.aiProvider || 'heuristic',
          aiModel: data.settings.aiModel || 'twm-compliance-engine-v1',
          disclaimer:
            data.settings.disclaimer ||
            'Market intelligence provided is strictly non-advisory. Derivatives and equities carry capital risk. Verify suitability with your financial planner before execution on SMC Ace.',
        });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(catId: string) {
    setSettings((prev) => {
      const exists = prev.enabledCategories.includes(catId);
      const updated = exists
        ? prev.enabledCategories.filter((c) => c !== catId)
        : [...prev.enabledCategories, catId];
      return { ...prev, enabledCategories: updated };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/signals/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyPrice: Number(settings.monthlyPrice),
          billingPeriod: settings.billingPeriod,
          enabledCategoriesJson: JSON.stringify(settings.enabledCategories),
          subscriptionRequired: settings.subscriptionRequired,
          notificationsEnabled: settings.notificationsEnabled,
          disclaimer: settings.disclaimer,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Signal settings and pricing saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B111E] text-slate-100">
        <AdminNav />
        <div className="py-20 text-center text-xs text-slate-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 pb-16">
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
            <Settings className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Signals Configuration & Pricing</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure subscription pricing, billing cycles, active intelligence categories, and statutory disclaimers.
          </p>
        </div>

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

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Subscription Pricing */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Subscription Pricing & Entitlement Policy
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Monthly Subscription Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={settings.monthlyPrice}
                  onChange={(e) => setSettings({ ...settings, monthlyPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 font-bold focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Default: ₹499/month. Updates client paywall dynamically without code change.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Billing Period
                </label>
                <select
                  value={settings.billingPeriod}
                  onChange={(e) => setSettings({ ...settings, billingPeriod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="MONTHLY">Monthly (30 Days)</option>
                  <option value="QUARTERLY">Quarterly (90 Days)</option>
                  <option value="ANNUAL">Annual (365 Days)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.subscriptionRequired}
                  onChange={(e) => setSettings({ ...settings, subscriptionRequired: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-800 border-slate-700"
                />
                <span className="font-semibold">Enforce Subscription Paywall on Signal Details</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-800 border-slate-700"
                />
                <span className="font-semibold">Dispatch In-App Notifications on Publication</span>
              </label>
            </div>
          </div>

          {/* Section 2: Active Categories */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              2. Enabled Market Intelligence Categories
            </h2>
            <p className="text-xs text-slate-400">
              Select which asset classes and content classifications are active on client and employee panels:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ALL_CATEGORIES.map((c) => {
                const checked = settings.enabledCategories.includes(c.id);
                return (
                  <label
                    key={c.id}
                    onClick={() => toggleCategory(c.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      checked
                        ? 'bg-blue-950/40 border-blue-600/60 text-blue-200'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="font-medium text-[11px]">{c.label}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 text-blue-600 rounded bg-slate-800 border-slate-700"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 3: Statutory Disclaimers */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              3. Statutory Regulatory Disclaimer
            </h2>
            <textarea
              rows={4}
              required
              value={settings.disclaimer}
              onChange={(e) => setSettings({ ...settings, disclaimer: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 leading-relaxed"
            />
            <p className="text-[10px] text-slate-500">
              This disclaimer is rendered across client signal cards, details, and AI reviews.
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
