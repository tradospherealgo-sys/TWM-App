import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchStocks, getStockBySymbol, getIndices, getIndicesWithLiveQuotes } from '../lib/adapters/market-data';
import { getSMCIntegrationStatus, getSMCOnboardingUrl } from '../lib/adapters/smc';
import { testUpstoxConnection } from '../lib/integrations/testers';

describe('Market Data & SMC Integration Adapters', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  describe('Upstox API v2 Market-Data LTP Connection Tester', () => {
    it('should return NOT_CONFIGURED when accessToken is missing', async () => {
      const res = await testUpstoxConnection({}, {});
      expect(res.success).toBe(false);
      expect(res.status).toBe('NOT_CONFIGURED');
      expect(res.error).toBe('Missing accessToken');
    });

    it('should query market-quote/ltp with NSE_INDEX|Nifty 50 and return CONNECTED on real quote response', async () => {
      let requestedUrl = '';
      let authHeader = '';

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any, init: any) => {
        requestedUrl = String(url);
        authHeader = init?.headers?.Authorization || '';
        return new Response(
          JSON.stringify({
            status: 'success',
            data: {
              'NSE_INDEX:Nifty 50': {
                instrument_token: 'NSE_INDEX|Nifty 50',
                last_price: 24823.15,
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await testUpstoxConnection(
        { accessToken: 'valid_test_analytics_token_xyz' },
        { baseUrl: 'https://api.upstox.com/v2' }
      );

      expect(requestedUrl).toBe(
        'https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_INDEX%7CNifty%2050'
      );
      expect(authHeader).toBe('Bearer valid_test_analytics_token_xyz');
      expect(res.success).toBe(true);
      expect(res.status).toBe('CONNECTED');
      expect(res.details?.broker).toBe('Upstox');
      expect(res.details?.lastPrice).toContain('24823.15');
      expect(res.details?.instrument).toBe('NSE_INDEX|Nifty 50');
    });

    it('should distinguish HTTP 401 unauthorized token without claiming session expired', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            status: 'error',
            errors: [{ message: 'Invalid access token' }],
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await testUpstoxConnection(
        { accessToken: 'bad_token' },
        { baseUrl: 'https://api.upstox.com/v2' }
      );

      expect(res.success).toBe(false);
      expect(res.status).toBe('CONNECTION_FAILED');
      expect(res.error).toContain('HTTP 401 Unauthorized');
      expect(res.message).toContain('Invalid or unauthorized access token');
      expect(res.error).not.toContain('Session token expired');
    });

    it('should distinguish HTTP 403 forbidden access', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            status: 'error',
            errors: [{ message: 'Forbidden access' }],
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await testUpstoxConnection(
        { accessToken: 'forbidden_token' },
        { baseUrl: 'https://api.upstox.com/v2' }
      );

      expect(res.success).toBe(false);
      expect(res.status).toBe('CONNECTION_FAILED');
      expect(res.error).toContain('HTTP 403 Forbidden');
      expect(res.message).toContain('Access forbidden');
    });

    it('should handle HTTP 429 rate limiting gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response('Too Many Requests', { status: 429 });
      });

      const res = await testUpstoxConnection(
        { accessToken: 'rate_limited_token' },
        { baseUrl: 'https://api.upstox.com/v2' }
      );

      expect(res.success).toBe(false);
      expect(res.status).toBe('CONNECTION_FAILED');
      expect(res.error).toContain('HTTP 429 Too Many Requests');
      expect(res.message).toContain('rate limit reached');
    });

    it('should handle HTTP 400 invalid request format or instrument key', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            status: 'error',
            errors: [{ message: 'Invalid instrument key' }],
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await testUpstoxConnection(
        { accessToken: 'token_bad_key' },
        { baseUrl: 'https://api.upstox.com/v2' }
      );

      expect(res.success).toBe(false);
      expect(res.status).toBe('CONNECTION_FAILED');
      expect(res.error).toContain('HTTP 400 Bad Request');
      expect(res.message).toContain('Invalid request format');
    });

    it('should reject empty quote payloads on HTTP 200', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            status: 'success',
            data: {},
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const res = await testUpstoxConnection(
        { accessToken: 'empty_payload_token' },
        { baseUrl: 'https://api.upstox.com/v2' }
      );

      expect(res.success).toBe(false);
      expect(res.status).toBe('CONNECTION_FAILED');
      expect(res.message).toContain('empty or invalid quote payload');
    });

    it('should handle network gateway connection errors without crashing', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        throw new Error('connect ECONNREFUSED 127.0.0.1:443');
      });

      const res = await testUpstoxConnection(
        { accessToken: 'any_token' },
        { baseUrl: 'https://api.upstox.com/v2' }
      );

      expect(res.success).toBe(false);
      expect(res.status).toBe('CONNECTION_FAILED');
      expect(res.message).toContain('Unable to reach Upstox API gateway');
    });
  });
});
