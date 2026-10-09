'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { IntegrationCardView, IntegrationStatus } from '@/lib/integrations/types';
import {
  Settings2,
  ShieldCheck,
  Database,
  Cpu,
  HardDrive,
  Mail,
  Bell,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  KeyRound,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  Lock,
  Eye,
  EyeOff,
  Flame,
} from 'lucide-react';

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationCardView[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'REQUIRED' | 'OPTIONAL' | 'ATTENTION'>('ALL');
  const [activeEditingKey, setActiveEditingKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, Record<string, any>>>({});
  const [testingKeys, setTestingKeys] = useState<Record<string, boolean>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [testReports, setTestReports] = useState<Record<string, any>>({});
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [showPlainPassword, setShowPlainPassword] = useState<Record<string, boolean>>({});
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/integrations');
      const data = await res.json();
      if (!res.ok) {
        setBannerNotice({
          type: 'error',
          message: data.error || `HTTP ${res.status}: Failed to load integration records. Check administrator permissions.`,
        });
        return;
      }
      if (data.integrations && Array.isArray(data.integrations)) {
        setIntegrations(data.integrations);
        // Initialize form data
        const initialForm: Record<string, Record<string, any>> = {};
        for (const item of data.integrations) {
          initialForm[item.providerKey] = {
            secrets: { ...item.maskedSecrets },
            publicConfig: { ...item.publicConfig },
          };
        }
        setFormData(initialForm);
      }
    } catch (e: any) {
      console.error('Failed to load integrations:', e);
      setBannerNotice({
        type: 'error',
        message: e?.message || 'Network error while retrieving integrations.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleTest(providerKey: string) {
    setTestingKeys((prev) => ({ ...prev, [providerKey]: true }));
    try {
      const res = await fetch(`/api/admin/integrations/${providerKey}/test`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.testResult) {
        setTestReports((prev) => ({ ...prev, [providerKey]: data.testResult }));
        // Update local card status
        setIntegrations((prev) =>
          prev.map((c) =>
            c.providerKey === providerKey
              ? {
                  ...c,
                  status: data.testResult.status,
                  lastTestedAt: new Date().toISOString(),
                  lastTestResult: data.testResult,
                  lastError: data.testResult.error || null,
                }
              : c
          )
        );
      }
    } catch (e: any) {
      console.error('Test error:', e);
      setTestReports((prev) => ({
        ...prev,
        [providerKey]: {
          success: false,
          status: 'CONNECTION_FAILED',
          message: e.message || 'Connection test failed',
        },
      }));
    } finally {
      setTestingKeys((prev) => ({ ...prev, [providerKey]: false }));
    }
  }

  async function handleSave(providerKey: string) {
    setSavingKeys((prev) => ({ ...prev, [providerKey]: true }));
    setBannerNotice(null);
    try {
      const currentForm = formData[providerKey] || { secrets: {}, publicConfig: {} };
      const res = await fetch(`/api/admin/integrations/${providerKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secrets: currentForm.secrets,
          publicConfig: currentForm.publicConfig,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBannerNotice({
          type: 'success',
          message: `${providerKey} credentials saved, encrypted at rest, and verified.`,
        });
        if (data.testResult) {
          setTestReports((prev) => ({ ...prev, [providerKey]: data.testResult }));
        }
        await fetchIntegrations();
        setActiveEditingKey(null);
      } else {
        setBannerNotice({
          type: 'error',
          message: data.error || 'Failed to save configuration',
        });
      }
    } catch (e: any) {
      setBannerNotice({
        type: 'error',
        message: e.message || 'Network error while saving integration',
      });
    } finally {
      setSavingKeys((prev) => ({ ...prev, [providerKey]: false }));
    }
  }

  async function handleRotate(providerKey: string, secretKey: string) {
    if (!confirm(`Are you sure you want to clear/rotate ${secretKey} for ${providerKey}?`)) return;

    try {
      const res = await fetch(`/api/admin/integrations/${providerKey}/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey, newSecretValue: '' }),
      });
      if (res.ok) {
        setBannerNotice({
          type: 'success',
          message: `Credential ${secretKey} was cleared from secure vault.`,
        });
        await fetchIntegrations();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function getStatusBadge(status: IntegrationStatus, isBootstrapOnly: boolean) {
    if (isBootstrapOnly) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
          DEPLOYMENT CONFIG
        </span>
      );
    }
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> CONNECTED
          </span>
        );
      case 'CONFIGURED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> CONFIGURED
          </span>
        );
      case 'CONNECTION_FAILED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> CONNECTION FAILED
          </span>
        );
      case 'INCOMPLETE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> INCOMPLETE
          </span>
        );
      case 'DISABLED':
      case 'OPTIONAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-900 text-slate-400 border border-slate-800">
            OPTIONAL
          </span>
        );
      case 'NOT_CONFIGURED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> NOT CONFIGURED
          </span>
        );
    }
  }

  function getProviderIcon(key: string) {
    switch (key) {
      case 'DATABASE':
      case 'SUPABASE':
        return <Database className="w-5 h-5 text-indigo-400" />;
      case 'UPSTOX':
      case 'MARKET_DATA':
        return <Activity className="w-5 h-5 text-blue-400" />;
      case 'OPTION_CHAIN':
        return <Layers className="w-5 h-5 text-cyan-400" />;
      case 'CHARTS':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'GOOGLE_AUTH':
      case 'GOOGLE_SERVICES':
        return <Lock className="w-5 h-5 text-red-400" />;
      case 'PAYMENTS':
        return <ShieldCheck className="w-5 h-5 text-green-400" />;
      case 'FEATURE_FLAGS':
        return <Settings2 className="w-5 h-5 text-pink-400" />;
      case 'SMC_GLOBAL':
        return <ShieldCheck className="w-5 h-5 text-amber-400" />;
      case 'AI_PROVIDER':
        return <Cpu className="w-5 h-5 text-purple-400" />;
      case 'EMAIL':
        return <Mail className="w-5 h-5 text-emerald-400" />;
      case 'STORAGE':
        return <HardDrive className="w-5 h-5 text-teal-400" />;
      case 'NOTIFICATIONS':
        return <Bell className="w-5 h-5 text-amber-400" />;
      default:
        return <Settings2 className="w-5 h-5 text-slate-400" />;
    }
  }

  const requiredCards = integrations.filter((c) => c.isRequired);
  const optionalCards = integrations.filter((c) => !c.isRequired);
  const connectedCount = integrations.filter((c) => c.status === 'CONNECTED').length;
  const blockers = requiredCards.filter(
    (c) => c.status !== 'CONNECTED' && c.status !== 'CONFIGURED' && !c.isBootstrapOnly
  );

  const filteredIntegrations = integrations.filter((item) => {
    if (filter === 'REQUIRED') return item.isRequired;
    if (filter === 'OPTIONAL') return !item.isRequired;
    if (filter === 'ATTENTION') {
      return (
        item.status === 'NOT_CONFIGURED' ||
        item.status === 'CONNECTION_FAILED' ||
        item.status === 'INCOMPLETE'
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-red-500" />
            Integrations &amp; Credential Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Single control plane for third-party providers, AES-256-GCM encrypted secrets &amp; connection testing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchIntegrations}
            disabled={loading}
            className="text-xs border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {bannerNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-red-950/80 border-red-800 text-red-200'
          }`}
        >
          <span>{bannerNotice.message}</span>
          <button
            onClick={() => setBannerNotice(null)}
            className="text-slate-400 hover:text-white ml-2 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* 1. Overall Health Summary Card */}
      <Card className="p-5 bg-gradient-to-br from-[#111927] to-[#15233E] border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Tradosphere Integration Health Dashboard
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status across all 15 platform subsystems. No source code or .env editing required.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">
              <strong className="text-emerald-400">{connectedCount}</strong> / {integrations.length} Active
            </span>
            {loading ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 animate-pulse">
                SYNCING REGISTRY...
              </span>
            ) : integrations.length > 0 && blockers.length === 0 ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                READY FOR LAUNCH
              </span>
            ) : blockers.length > 0 ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                {blockers.length} CREDENTIALS PENDING
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
                REGISTRY EMPTY
              </span>
            )}
          </div>
        </div>

        {/* Quick Grid of all providers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {integrations.map((item) => (
            <div
              key={item.providerKey}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="shrink-0">{getProviderIcon(item.providerKey)}</span>
                <span className="truncate font-medium text-slate-200">{item.name.split('(')[0]}</span>
              </div>
              <span className="ml-1 shrink-0">
                {item.status === 'CONNECTED' ? (
                  <span className="text-emerald-400">✓</span>
                ) : item.status === 'CONFIGURED' ? (
                  <span className="text-blue-400">✓</span>
                ) : item.isBootstrapOnly ? (
                  <span className="text-indigo-400 font-mono text-[10px]">BOOT</span>
                ) : item.isRequired ? (
                  <span className="text-amber-400">⚠</span>
                ) : (
                  <span className="text-slate-500">○</span>
                )}
              </span>
            </div>
          ))}
        </div>

        {blockers.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs text-amber-300">
            <strong className="block font-semibold mb-1">Required External Credentials Pending:</strong>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90">
              {blockers.map((b) => (
                <li key={b.providerKey}>
                  <strong>{b.name}</strong>: {b.missingFields.join(', ') || 'Connection test required'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            filter === 'ALL'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Integrations ({integrations.length})
        </button>
        <button
          onClick={() => setFilter('REQUIRED')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            filter === 'REQUIRED'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Required ({requiredCards.length})
        </button>
        <button
          onClick={() => setFilter('OPTIONAL')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            filter === 'OPTIONAL'
              ? 'bg-slate-800 text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Optional ({optionalCards.length})
        </button>
        <button
          onClick={() => setFilter('ATTENTION')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            filter === 'ATTENTION'
              ? 'bg-amber-950/80 text-amber-300 font-semibold border border-amber-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Needs Setup / Failed
        </button>
      </div>

      {/* Integration Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 bg-[#131C2E] border-slate-800 animate-pulse space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-36 bg-slate-800 rounded" />
                      <div className="h-3 w-64 bg-slate-800/60 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-24 bg-slate-800 rounded-full" />
                </div>
                <div className="h-2 w-full bg-slate-800/80 rounded" />
              </Card>
            ))}
          </div>
        ) : filteredIntegrations.length === 0 ? (
          <Card className="p-8 text-center bg-[#131C2E] border-slate-800 space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <div className="text-sm font-semibold text-white">No Integrations Available</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {filter !== 'ALL'
                ? `No integration cards match the "${filter}" filter view.`
                : 'Could not retrieve integration subsystem cards from registry.'}
            </p>
            <Button size="sm" variant="outline" onClick={fetchIntegrations} className="text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Fetching Integrations
            </Button>
          </Card>
        ) : (
          filteredIntegrations.map((item) => {
            const isEditing = activeEditingKey === item.providerKey;
          const isTesting = testingKeys[item.providerKey] || false;
          const isSaving = savingKeys[item.providerKey] || false;
          const currentForm = formData[item.providerKey] || { secrets: {}, publicConfig: {} };
          const testReport = testReports[item.providerKey] || item.lastTestResult;
          const isDocsOpen = expandedDocs[item.providerKey] || false;

          return (
            <Card key={item.providerKey} className="p-5 bg-[#131C2E] border-slate-800 space-y-4">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center shrink-0">
                    {getProviderIcon(item.providerKey)}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold text-white">{item.name}</h2>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {item.environment}
                      </span>
                      {item.isRequired ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/60 font-semibold">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          OPTIONAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.purpose}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start">
                  {getStatusBadge(item.status, item.isBootstrapOnly)}
                </div>
              </div>

              {/* Progress & Completeness Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Configuration Completeness</span>
                  <span className="font-semibold text-slate-300">{item.completeness}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.completeness === 100
                        ? 'bg-emerald-500'
                        : item.completeness > 50
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.completeness}%` }}
                  />
                </div>
              </div>

              {/* Missing Fields Notice */}
              {item.missingFields.length > 0 && !item.isBootstrapOnly && (
                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/40 text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Missing required fields: <strong>{item.missingFields.join(', ')}</strong>
                  </span>
                </div>
              )}

              {/* Bootstrap Only Notice */}
              {item.isBootstrapOnly && (
                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/50 text-xs text-indigo-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                    <Lock className="w-4 h-4" />
                    BOOTSTRAP / DEPLOYMENT CONFIGURATION REQUIRED
                  </div>
                  <p className="text-[11px] leading-relaxed text-indigo-200/90">
                    This database connection credential must remain outside the database itself. It is supplied via the{' '}
                    <code className="bg-indigo-950 px-1 py-0.5 rounded font-mono text-indigo-300">DATABASE_URL</code> environment variable on your server/hosting platform (e.g. Supabase, AWS, Render, Docker) before application boot.
                  </p>
                </div>
              )}

              {/* Last Test Result Display */}
              {testReport && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    testReport.success
                      ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-200'
                      : 'bg-red-950/30 border-red-900/50 text-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {testReport.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      {testReport.success ? 'Connection Test Passed' : 'Connection Test Failed'}
                    </span>
                    {testReport.latencyMs !== undefined && (
                      <span className="text-[10px] font-mono opacity-80">
                        {testReport.latencyMs}ms latency
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-90">{testReport.message}</p>
                  {testReport.error && (
                    <div className="text-[10px] font-mono text-red-300 mt-1 bg-red-950/80 p-1.5 rounded">
                      Error: {testReport.error}
                    </div>
                  )}
                  {testReport.details && (
                    <div className="text-[10px] font-mono opacity-75 mt-1 pt-1 border-t border-slate-800">
                      {Object.entries(testReport.details)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ')}
                    </div>
                  )}
                </div>
              )}

              {/* Editing Form (When expanded/editing) */}
              {isEditing && !item.isBootstrapOnly && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3.5 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-400" /> Edit Credentials &amp; Parameters
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {item.fields.map((field) => {
                      const isSecret = field.isSecret;
                      const value = isSecret
                        ? currentForm.secrets[field.key] || ''
                        : currentForm.publicConfig[field.key] || '';
                      const showPassword = showPlainPassword[`${item.providerKey}_${field.key}`];

                      return (
                        <div key={field.key} className={field.type === 'select' ? 'col-span-1' : ''}>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] font-semibold text-slate-300">
                              {field.label} {field.required && <span className="text-red-400">*</span>}
                            </label>
                            {isSecret && value && (
                              <button
                                type="button"
                                onClick={() => handleRotate(item.providerKey, field.key)}
                                className="text-[10px] text-amber-400 hover:underline"
                              >
                                Clear/Rotate
                              </button>
                            )}
                          </div>

                          {field.type === 'select' ? (
                            <select
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={value}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  [item.providerKey]: {
                                    ...prev[item.providerKey],
                                    publicConfig: {
                                      ...prev[item.providerKey]?.publicConfig,
                                      [field.key]: e.target.value,
                                    },
                                  },
                                }));
                              }}
                            >
                              {field.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="relative">
                              <input
                                type={isSecret && !showPassword ? 'password' : 'text'}
                                placeholder={field.placeholder || ''}
                                className="w-full px-3 py-2 pr-9 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={value}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    [item.providerKey]: {
                                      ...prev[item.providerKey],
                                      [isSecret ? 'secrets' : 'publicConfig']: {
                                        ...prev[item.providerKey]?.[isSecret ? 'secrets' : 'publicConfig'],
                                        [field.key]: newVal,
                                      },
                                    },
                                  }));
                                }}
                              />
                              {isSecret && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowPlainPassword((prev) => ({
                                      ...prev,
                                      [`${item.providerKey}_${field.key}`]: !prev[`${item.providerKey}_${field.key}`],
                                    }))
                                  }
                                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                                >
                                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          )}

                          {field.description && (
                            <span className="text-[10px] text-slate-500 mt-0.5 block leading-tight">
                              {field.description}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <Button
                      size="sm"
                      variant="primary"
                      isLoading={isSaving}
                      onClick={() => handleSave(item.providerKey)}
                      className="text-xs"
                    >
                      Save &amp; Encrypt Credentials
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveEditingKey(null)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setExpandedDocs((prev) => ({ ...prev, [item.providerKey]: !prev[item.providerKey] }))
                    }
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>How to configure</span>
                    {isDocsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!item.isBootstrapOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveEditingKey(isEditing ? null : item.providerKey);
                      }}
                      className="text-xs"
                    >
                      {isEditing ? 'Close Editor' : 'Configure / Edit'}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="primary"
                    isLoading={isTesting}
                    onClick={() => handleTest(item.providerKey)}
                    className="text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
                    Test Connection
                  </Button>
                </div>
              </div>

              {/* Documentation Collapsible */}
              {isDocsOpen && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="font-semibold text-white">Setup Instructions for {item.name}:</div>
                  <p className="leading-relaxed text-[11px] text-slate-300">{item.docsHelp}</p>
                </div>
              )}
            </Card>
          );
        }))}
      </div>
    </div>
  );
}
