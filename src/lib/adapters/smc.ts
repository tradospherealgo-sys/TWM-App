/**
 * SMC Global Integration Adapter
 * Tradosphere Wealth Management operates as an Authorised Person (AP) of SMC Global.
 * 
 * Rules:
 * 1. Do NOT fake order execution, portfolio balance, or trades.
 * 2. If credentials or API endpoints are unconfigured, return honest status.
 * 3. Provide approved links and onboarding handoffs to SMC Ace.
 */

export interface SMCIntegrationStatus {
  isConfigured: boolean;
  status: 'CONNECTED' | 'CONFIGURATION_REQUIRED' | 'UNAVAILABLE';
  apCode: string | null;
  onboardingUrl: string;
  tradingPortalUrl: string;
  message: string;
}

export function getSMCIntegrationStatus(): SMCIntegrationStatus {
  const apCode = process.env.SMC_GLOBAL_AP_CODE || null;
  const apiKey = process.env.SMC_GLOBAL_API_KEY || null;
  const onboardingUrl = process.env.SMC_GLOBAL_ONBOARDING_URL || 'https://www.smcindiaonline.com';
  const tradingPortalUrl = process.env.SMC_GLOBAL_TRADING_PORTAL_URL || 'https://smctradeonline.com';

  const isConfigured = Boolean(apCode && apiKey);

  return {
    isConfigured,
    status: isConfigured ? 'CONNECTED' : 'CONFIGURATION_REQUIRED',
    apCode,
    onboardingUrl,
    tradingPortalUrl,
    message: isConfigured
      ? 'SMC Global API gateway connected.'
      : 'SMC Global API credentials are not yet configured in environment variables. Trading execution and demat operations route via SMC official portals.',
  };
}

/**
 * Generate authenticated or referral onboarding URL for a client
 */
export function getSMCOnboardingUrl(clientPhone?: string, clientEmail?: string): string {
  const { onboardingUrl, apCode } = getSMCIntegrationStatus();
  const url = new URL(onboardingUrl);
  if (apCode) {
    url.searchParams.set('ap_code', apCode);
  }
  if (clientPhone) {
    url.searchParams.set('mobile', clientPhone);
  }
  if (clientEmail) {
    url.searchParams.set('email', clientEmail);
  }
  return url.toString();
}

/**
 * Get direct URL to SMC Ace trading terminal
 */
export function getSMCTradingPortalUrl(): string {
  const { tradingPortalUrl } = getSMCIntegrationStatus();
  return tradingPortalUrl;
}
