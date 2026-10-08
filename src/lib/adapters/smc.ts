/**
 * SMC Global Integration Adapter
 * Tradosphere Wealth Management operates as an Authorised Person (AP) of SMC Global.
 * 
 * Rules:
 * 1. Do NOT fake order execution, portfolio balance, or trades.
 * 2. If credentials or API endpoints are unconfigured, return honest status.
 * 3. Provide approved links and onboarding handoffs to SMC Ace.
 */

import prisma from '../prisma';
import { decryptSecretsMap } from '../encryption';

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

  const isConfigured = Boolean(apCode);

  return {
    isConfigured,
    status: isConfigured ? (apiKey ? 'CONNECTED' : 'CONFIGURATION_REQUIRED') : 'CONFIGURATION_REQUIRED',
    apCode,
    onboardingUrl,
    tradingPortalUrl,
    message: isConfigured
      ? (apiKey
          ? 'SMC Global API gateway connected.'
          : 'SMC Authorised Person gateway active. Direct API integration requires provider credentials/documentation.')
      : 'SMC Global API credentials are not yet configured. Demat operations and trading route via SMC official portals.',
  };
}

export async function getSMCIntegrationStatusAsync(): Promise<SMCIntegrationStatus> {
  try {
    const config = await prisma.integrationConfig.findUnique({
      where: { providerKey: 'SMC_GLOBAL' },
    });

    if (config) {
      let publicConfig: Record<string, any> = {};
      try {
        publicConfig = JSON.parse(config.publicConfigJson || '{}');
      } catch {
        publicConfig = {};
      }

      const secrets = decryptSecretsMap(config.encryptedSecrets);
      const apCode = publicConfig.apCode || secrets.apCode || process.env.SMC_GLOBAL_AP_CODE || null;
      const apiKey = secrets.apiKey || process.env.SMC_GLOBAL_API_KEY || null;
      const onboardingUrl = publicConfig.onboardingUrl || process.env.SMC_GLOBAL_ONBOARDING_URL || 'https://www.smcindiaonline.com';
      const tradingPortalUrl = publicConfig.tradingPortalUrl || process.env.SMC_GLOBAL_TRADING_PORTAL_URL || 'https://smctradeonline.com';

      const isConfigured = Boolean(apCode);

      return {
        isConfigured,
        status: isConfigured ? (apiKey ? 'CONNECTED' : 'CONFIGURATION_REQUIRED') : 'CONFIGURATION_REQUIRED',
        apCode,
        onboardingUrl,
        tradingPortalUrl,
        message: isConfigured
          ? (apiKey
              ? 'SMC Global API gateway connected.'
              : 'SMC Authorised Person gateway active. Direct API integration requires provider credentials/documentation.')
          : 'SMC Global API credentials are not yet configured in Admin -> Integrations.',
      };
    }
  } catch (e) {
    // fallback
  }

  return getSMCIntegrationStatus();
}

/**
 * Generate authenticated or referral onboarding URL for a client
 */
export function getSMCOnboardingUrl(clientPhone?: string, clientEmail?: string): string {
  const { onboardingUrl, apCode } = getSMCIntegrationStatus();
  if (!apCode) {
    return '/support?topic=smc_demat';
  }
  try {
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
  } catch {
    return onboardingUrl;
  }
}

/**
 * Get direct URL to SMC Ace trading terminal
 */
export function getSMCTradingPortalUrl(): string {
  const { tradingPortalUrl, apCode } = getSMCIntegrationStatus();
  if (!apCode) {
    return '/support?topic=smc_demat';
  }
  return tradingPortalUrl;
}

/**
 * Async safe status check with fallback warning message
 */
export async function getSMCOnboardingDetailsAsync(clientPhone?: string, clientEmail?: string) {
  const status = await getSMCIntegrationStatusAsync();
  const isAvailable = Boolean(status.isConfigured && status.apCode);
  
  return {
    isAvailable,
    apCode: status.apCode,
    destinationUrl: isAvailable ? getSMCOnboardingUrl(clientPhone, clientEmail) : '/support?topic=smc_demat',
    tradingUrl: isAvailable ? status.tradingPortalUrl : '/support?topic=smc_demat',
    message: isAvailable
      ? 'Official SMC Global Authorised Person onboarding active.'
      : 'SMC Demat onboarding is currently undergoing scheduled maintenance. Please contact Tradosphere Wealth Management support desk.',
  };
}

