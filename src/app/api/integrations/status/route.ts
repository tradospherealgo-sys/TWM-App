import { NextResponse } from 'next/server';
import { getSMCIntegrationStatus } from '@/lib/adapters/smc';
import { getMarketDataProviderStatus } from '@/lib/adapters/market-data';

export async function GET() {
  const smcStatus = getSMCIntegrationStatus();
  const marketStatus = getMarketDataProviderStatus();
  const aiConfigured = Boolean(process.env.AI_PROVIDER_API_KEY);

  return NextResponse.json({
    integrations: {
      smcGlobal: {
        name: 'SMC Global Securities (Authorised Person)',
        isConfigured: smcStatus.isConfigured,
        status: smcStatus.status,
        apCode: smcStatus.apCode,
        onboardingUrl: smcStatus.onboardingUrl,
        tradingPortalUrl: smcStatus.tradingPortalUrl,
        message: smcStatus.message,
      },
      marketData: {
        name: 'Market Data Feed (NSE/BSE)',
        isConfigured: marketStatus.isConfigured,
        status: marketStatus.isConfigured ? 'CONNECTED' : 'CONFIGURATION_REQUIRED',
        message: marketStatus.isConfigured
          ? 'Live market data feed connected.'
          : 'Live market data feed is awaiting provider configuration.',
      },
      aiCopilot: {
        name: 'AI Employee Copilot & Knowledge Assistant',
        status: aiConfigured ? 'CONNECTED' : 'LOCAL_HEURISTIC_MODE',
        message: aiConfigured
          ? 'External LLM API connected'
          : 'Running in built-in compliant heuristic knowledge mode with approved SOP retrieval',
      },
      storage: {
        name: 'Document Storage Vault',
        status: 'CONNECTED',
        message: 'Secured document storage vault active.',
      },
    },
  });
}
