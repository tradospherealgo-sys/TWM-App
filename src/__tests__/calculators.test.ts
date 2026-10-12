import { describe, it, expect } from 'vitest';
import { calculateSIP } from '@/lib/calculators';

describe('Financial Calculators & Projections - Production calculateSIP', () => {
  it('should accurately calculate standard SIP compound growth', () => {
    const result = calculateSIP({
      monthlyAmount: 5000,
      years: 10,
      expectedRate: 12,
    });

    expect(result.totalMonths).toBe(120);
    expect(result.totalInvested).toBe(600000);
    // FV of 5,000/mo at 12% for 10 years is approx 1,161,695
    expect(result.estimatedFutureValue).toBeGreaterThan(1150000);
    expect(result.estimatedFutureValue).toBeLessThan(1170000);
    expect(result.estimatedGain).toBe(result.estimatedFutureValue - result.totalInvested);
    expect(result.estimatedGain).toBeGreaterThan(550000);
  });

  it('should handle zero percent expected return rate gracefully without returning NaN', () => {
    const result = calculateSIP({
      monthlyAmount: 5000,
      years: 5,
      expectedRate: 0,
    });

    expect(result.totalMonths).toBe(60);
    expect(result.totalInvested).toBe(300000);
    expect(result.estimatedFutureValue).toBe(300000);
    expect(result.estimatedGain).toBe(0);
    expect(Number.isNaN(result.estimatedFutureValue)).toBe(false);
    expect(Number.isNaN(result.estimatedGain)).toBe(false);
  });

  it('should handle zero investment and zero duration', () => {
    const zeroAmount = calculateSIP({
      monthlyAmount: 0,
      years: 10,
      expectedRate: 12,
    });
    expect(zeroAmount.totalInvested).toBe(0);
    expect(zeroAmount.estimatedFutureValue).toBe(0);
    expect(zeroAmount.estimatedGain).toBe(0);

    const zeroYears = calculateSIP({
      monthlyAmount: 5000,
      years: 0,
      expectedRate: 12,
    });
    expect(zeroYears.totalMonths).toBe(0);
    expect(zeroYears.totalInvested).toBe(0);
    expect(zeroYears.estimatedFutureValue).toBe(0);
    expect(zeroYears.estimatedGain).toBe(0);
  });

  it('should safely handle negative or invalid inputs without crashing or returning NaN', () => {
    const negativeResult = calculateSIP({
      monthlyAmount: -5000,
      years: -5,
      expectedRate: -10,
    });
    expect(negativeResult.totalInvested).toBe(0);
    expect(negativeResult.estimatedFutureValue).toBe(0);
    expect(Number.isNaN(negativeResult.estimatedFutureValue)).toBe(false);

    const nanResult = calculateSIP({
      monthlyAmount: NaN,
      years: NaN,
      expectedRate: NaN,
    });
    expect(nanResult.totalInvested).toBe(0);
    expect(nanResult.estimatedFutureValue).toBe(0);
    expect(Number.isNaN(nanResult.estimatedFutureValue)).toBe(false);
  });

  it('should clamp extreme durations to reasonable maximum boundary (100 years)', () => {
    const extremeResult = calculateSIP({
      monthlyAmount: 1000,
      years: 250,
      expectedRate: 10,
    });
    // Years clamped to 100 -> 1200 months
    expect(extremeResult.totalMonths).toBe(1200);
    expect(extremeResult.totalInvested).toBe(1200000);
    expect(Number.isFinite(extremeResult.estimatedFutureValue)).toBe(true);
  });
});
