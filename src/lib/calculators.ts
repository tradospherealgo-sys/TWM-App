/**
 * Financial Calculators Library
 * Implements pure financial math functions with strict validation and edge-case handling.
 */

export interface SIPCalculationInput {
  monthlyAmount: number;
  years: number;
  expectedRate: number;
}

export interface SIPCalculationResult {
  totalMonths: number;
  totalInvested: number;
  estimatedFutureValue: number;
  estimatedGain: number;
}

/**
 * Calculates Systematic Investment Plan (SIP) returns using the standard compound interest formula:
 * FV = P * [((1 + i)^n - 1) / i] * (1 + i)
 * where:
 *   P = Monthly investment amount
 *   i = Periodic (monthly) interest rate (expectedRate / 100 / 12)
 *   n = Number of payments (years * 12)
 *
 * Edge cases handled:
 * - expectedRate === 0: Returns total invested without division-by-zero (NaN)
 * - non-positive inputs: handled cleanly
 * - non-finite / NaN inputs: defaulted to 0
 */
export function calculateSIP(input: SIPCalculationInput): SIPCalculationResult {
  const rawAmount = Number(input.monthlyAmount);
  const rawYears = Number(input.years);
  const rawRate = Number(input.expectedRate);

  const monthlyAmount = isNaN(rawAmount) || rawAmount < 0 ? 0 : rawAmount;
  const years = isNaN(rawYears) || rawYears < 0 ? 0 : Math.min(rawYears, 100);
  const expectedRate = isNaN(rawRate) ? 0 : rawRate;

  const totalMonths = Math.round(years * 12);
  const totalInvested = Math.round(monthlyAmount * totalMonths);

  if (totalMonths === 0 || monthlyAmount === 0) {
    return {
      totalMonths: 0,
      totalInvested: 0,
      estimatedFutureValue: 0,
      estimatedGain: 0,
    };
  }

  // Handle 0% return edge-case (prevents 0 / 0 NaN)
  if (expectedRate === 0) {
    return {
      totalMonths,
      totalInvested,
      estimatedFutureValue: totalInvested,
      estimatedGain: 0,
    };
  }

  const monthlyRate = expectedRate / 100 / 12;
  const futureValue = Math.round(
    monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
  );

  const estimatedFutureValue = Math.max(0, futureValue);
  const estimatedGain = Math.round(estimatedFutureValue - totalInvested);

  return {
    totalMonths,
    totalInvested,
    estimatedFutureValue,
    estimatedGain,
  };
}
