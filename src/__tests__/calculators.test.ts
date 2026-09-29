import { describe, it, expect } from 'vitest';

describe('Financial Calculators & Projections', () => {
  it('should accurately calculate standard SIP compound growth', () => {
    const monthlyAmount = 5000;
    const years = 10;
    const expectedRate = 12;

    const totalMonths = years * 12; // 120
    const monthlyRate = expectedRate / 100 / 12; // 0.01
    const totalInvested = monthlyAmount * totalMonths; // 600,000

    // Standard formula: P * [((1 + i)^n - 1) / i] * (1 + i)
    const futureValue = Math.round(
      monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
    );

    expect(totalInvested).toBe(600000);
    // Future value of 5,000/mo at 12% for 10 years is approx 1,161,695
    expect(futureValue).toBeGreaterThan(1150000);
    expect(futureValue).toBeLessThan(1170000);

    const gain = futureValue - totalInvested;
    expect(gain).toBeGreaterThan(550000);
  });
});
