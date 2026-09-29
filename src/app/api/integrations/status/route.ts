import { NextResponse } from 'next/server';
import { getSMCIntegrationStatus } from '@/lib/adapters/smc';
import { getMarketDataProviderStatus } from '@/lib/adapters/market-data';

export async function GET() {
  const smcStatus = getSMCIntegrationStatus();
  const marketStatus = getMarketDataProviderStatus();

  const aiConfigured = Boolean(process.env.AI_PROVIDER_API_KEY);
  const storageDriver = process.env.STORAGE_DRIVER || 'local';

  return NextResponse.json({
    integrations: {
      smcGlobal: {
        name: 'SMC Global Securities (Authorised Person)',
        ...smcStatus,
      },
      marketData: {
        name: 'Market Data Feed (NSE/BSE)',
        status: marketStatus.isConfigured ? 'CONNECTED' : 'CONFIGURATION_REQUIRED',
        ...marketStatus,
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
        driver: storageDriver,
        message: `Secured storage driver: ${storageDriver}`,
      },
    },
  });
}
