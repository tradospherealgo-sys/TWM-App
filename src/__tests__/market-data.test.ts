import { describe, it, expect } from 'vitest';
import { searchStocks, getStockBySymbol, getIndices } from '../lib/adapters/market-data';
import { getSMCIntegrationStatus, getSMCOnboardingUrl } from '../lib/adapters/smc';

describe('Market Data & SMC Integration Adapters', () => {
  it('should search genuine Indian market stocks', () => {
    const results = searchStocks('reliance');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].symbol).toBe('RELIANCE');
    expect(results[0].exchange).toBe('NSE');
  });

  it('should return honest DATA_UNAVAILABLE state when provider is unconfigured', () => {
    const quote = getStockBySymbol('TCS');
    expect(quote).not.toBeNull();
    expect(quote?.lastPrice).toBeNull();
    expect(quote?.status).toBe('DATA_UNAVAILABLE');
  });

  it('should return genuine index symbols with honest status', () => {
    const indices = getIndices();
    expect(indices.length).toBeGreaterThan(2);
    expect(indices.some((i) => i.symbol === 'NIFTY50')).toBe(true);
    expect(indices.every((i) => i.lastPrice === null)).toBe(true);
  });

  it('should return valid SMC Global integration configuration and onboarding link', () => {
    const status = getSMCIntegrationStatus();
    expect(status.status).toBeDefined();
    expect(status.onboardingUrl).toContain('smc');

    const url = getSMCOnboardingUrl('9876543210', 'client@test.com');
    expect(url).toContain('9876543210');
  });
});
