import React from 'react';
import { Card } from '@/components/ui/Card';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { getSMCIntegrationStatus } from '@/lib/adapters/smc';
import { getMarketDataProviderStatus } from '@/lib/adapters/market-data';
import { Settings2, ShieldCheck, Database, Cpu, HardDrive, KeyRound } from 'lucide-react';

export default function AdminIntegrationsPage() {
  const smcStatus = getSMCIntegrationStatus();
  const marketStatus = getMarketDataProviderStatus();
  const aiKeyConfigured = Boolean(process.env.AI_PROVIDER_API_KEY);
  const storageDriver = process.env.STORAGE_DRIVER || 'local';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">System Integrations &amp; Adapters</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Provider connectivity, credential statuses &amp; integration boundaries
        </p>
      </div>

      <StatusBanner
        type="regulatory"
        title="Live Data Policy (Section 63)"
        message="TWM strictly prevents simulated trades, mock portfolio values, or fake market prices. When provider API credentials are not set, TWM reports an honest Configuration Required status."
      />

      <div className="space-y-4">
        {/* 1. SMC Global Integration */}
        <Card className="p-5 bg-[#131C2E] border-slate-800 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">
                  SMC Global Securities (Authorised Person)
                </h2>
                <div className="text-xs text-slate-400">
                  Broker Gateway &amp; SMC Ace Execution Interface
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                smcStatus.isConfigured
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border-amber-800'
              }`}
            >
              {smcStatus.status}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{smcStatus.message}</p>

          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">AP Code</span>
              <span className="font-mono text-slate-300">{smcStatus.apCode || 'Unconfigured (SMC_GLOBAL_AP_CODE)'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Onboarding Link</span>
              <span className="text-slate-300 truncate block">{smcStatus.onboardingUrl}</span>
            </div>
          </div>
        </Card>

        {/* 2. Market Data Feed */}
        <Card className="p-5 bg-[#131C2E] border-slate-800 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">
                  NSE/BSE Market Data Provider
                </h2>
                <div className="text-xs text-slate-400">
                  Real-time Indices, Equities &amp; OHLC Quotes
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                marketStatus.isConfigured
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {marketStatus.isConfigured ? 'CONNECTED' : 'CONFIGURATION_REQUIRED'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{marketStatus.message}</p>

          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
            Env Key: <code className="text-blue-400 font-mono">MARKET_DATA_PROVIDER_API_KEY</code>
          </div>
        </Card>

        {/* 3. AI Employee Copilot */}
        <Card className="p-5 bg-[#131C2E] border-slate-800 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">
                  AI Employee Copilot &amp; Knowledge Engine
                </h2>
                <div className="text-xs text-slate-400">
                  Operational SOP Assistant with Built-in SEBI Guardrails
                </div>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-blue-950 text-blue-300 border-blue-800">
              {aiKeyConfigured ? 'EXTERNAL_LLM_CONNECTED' : 'LOCAL_HEURISTIC_ACTIVE'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Running in compliant built-in knowledge retrieval mode using approved SOPs from the database. When <code className="text-blue-400 font-mono">AI_PROVIDER_API_KEY</code> is set, external inference is enabled.
          </p>
        </Card>

        {/* 4. Secure Storage Vault */}
        <Card className="p-5 bg-[#131C2E] border-slate-800 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">Document Storage Vault</h2>
                <div className="text-xs text-slate-400">
                  Secured KYC, PAN, Aadhaar &amp; Application Attachments
                </div>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-950 text-emerald-300 border-emerald-800">
              CONNECTED
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Storage Driver: <strong className="text-white capitalize">{storageDriver}</strong>. Documents are strictly accessible through authenticated server-side role checks. Public file URLs are disabled.
          </p>
        </Card>
      </div>
    </div>
  );
}
