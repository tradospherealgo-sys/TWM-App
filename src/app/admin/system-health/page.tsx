'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SystemHealthReport, SubsystemCheck } from '@/lib/system-health';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Server,
  Lock,
  ArrowRight,
  Database,
  Cpu,
  Mail,
  HardDrive,
  Bell,
  FileCheck,
  ScrollText,
} from 'lucide-react';

export default function AdminSystemHealthPage() {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthReport();
  }, []);

  async function fetchHealthReport() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/system-health');
      const data = await res.json();
      if (data.health) {
        setReport(data.health);
      }
    } catch (e) {
      console.error('Failed to load system health report:', e);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'READY':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'CONFIGURATION_REQUIRED':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'ERROR':
      default:
        return <XCircle className="w-5 h-5 text-red-400" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'READY':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            READY
          </span>
        );
      case 'CONFIGURATION_REQUIRED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
            CONFIG REQUIRED
          </span>
        );
      case 'ERROR':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950 text-red-300 border border-red-800">
            ERROR
          </span>
        );
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-red-500" />
            System Health &amp; Pre-Flight Verification
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated production readiness audit across infrastructure, security, integrations &amp; compliance
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchHealthReport}
          disabled={loading}
          className="text-xs border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Run Health Audit
        </Button>
      </div>

      {loading && (
        <div className="p-12 text-center text-xs text-slate-400">
          Running automated system health checks across all 15 subsystems...
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* 1. Production Launch Gate Banner */}
          <div
            className={`p-5 rounded-2xl border ${
              report.overallStatus === 'PRODUCTION_READY'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-100'
                : report.overallStatus === 'WAITING_FOR_CREDENTIALS'
                ? 'bg-gradient-to-r from-amber-950/90 to-slate-900 border-amber-800/80 text-amber-100'
                : 'bg-red-950/80 border-red-800 text-red-100'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80 block">
                  Production Launch Gate Status
                </span>
                <div className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  {report.overallStatus === 'PRODUCTION_READY' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : report.overallStatus === 'WAITING_FOR_CREDENTIALS' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  {report.gateMessage}
                </div>
                <p className="text-xs text-slate-300">
                  {report.overallStatus === 'WAITING_FOR_CREDENTIALS'
                    ? 'All software, databases, encryption, and authorization systems are 100% operational. Ready for deployment once third-party provider credentials are provided in Admin -> Integrations.'
                    : report.overallStatus === 'PRODUCTION_READY'
                    ? 'All mandatory systems, integrations, and compliance guardrails verified.'
                    : 'Critical technical blockers must be resolved prior to launch.'}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Link href="/admin/integrations">
                  <Button variant="primary" size="sm" className="text-xs">
                    Admin → Integrations <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Metrics Ticker */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-300 block">Subsystems Ready</span>
                <span className="text-base font-bold text-emerald-400">{report.readyCount} / 15</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-300 block">Config Required</span>
                <span className="text-base font-bold text-amber-400">{report.configRequiredCount}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-300 block">Technical Errors</span>
                <span className="text-base font-bold text-red-400">{report.errorCount}</span>
              </div>
            </div>
          </div>

          {/* 2. Manual Actions Required Checklist */}
          {report.manualActionsRequired.length > 0 && (
            <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Pending Manual Integration Credentials
              </h2>
              <div className="space-y-2">
                {report.manualActionsRequired.map((action, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#131C2E] border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{action}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 3. Subsystem Breakdown (15 Components) */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Subsystem Verification Breakdown
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.subsystems.map((sub) => (
                <Card key={sub.id} className="p-4 bg-[#131C2E] border-slate-800 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(sub.status)}
                      <div>
                        <h3 className="text-sm font-bold text-white">{sub.name}</h3>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          {sub.category}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(sub.status)}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{sub.message}</p>

                  {sub.details && (
                    <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                      {Object.entries(sub.details).map(([k, v]) => (
                        <span key={k}>
                          {k}: <span className="text-slate-200">{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
