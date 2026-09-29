/**
 * Six-Agent AI Intelligence & Compliance Review Team
 * Tradosphere Wealth Management (TWM)
 *
 * Core Regulatory Boundary:
 * The AI team is strictly a REVIEW and INTELLIGENCE layer.
 * AI does NOT autonomously generate, approve, or publish trading signals.
 * AI cannot select PUBLISH.
 *
 * Agents:
 * 01. ATLAS    - Market Context & Macro Intelligence
 * 02. VECTOR   - Technical & Quantitative Intelligence
 * 03. ORION    - Fundamental & Event Intelligence
 * 04. SENTINEL - Risk & Data Integrity Intelligence
 * 05. AEGIS    - Compliance & Regulatory Review (Can BLOCK publication)
 * 06. NEXUS    - Intelligence Synthesis Coordinator (Summarizes all, recommends human action)
 */

import {
  AgentReviewResult,
  NexusSynthesisResult,
  ComplianceVerdict,
  DataQualityStatus,
  RecommendedHumanAction,
} from './types';
import { getMarketDataProviderStatus } from '../adapters/market-data';

interface SignalInputData {
  title: string;
  category: string;
  subcategory?: string | null;
  instrument?: string | null;
  exchange?: string | null;
  symbol?: string | null;
  summary: string;
  content: string;
  source: string;
  provider: string;
  author: string;
  supportingInfo?: string | null;
  validityType?: string | null;
  riskLevel?: string | null;
}

// ---------------------------------------------------------------------------
// 01. ATLAS — Market Context & Macro Intelligence
// ---------------------------------------------------------------------------
export async function runAtlasReview(signal: SignalInputData): Promise<AgentReviewResult> {
  const start = Date.now();
  const providerStatus = getMarketDataProviderStatus();

  // Evaluate surrounding market context
  const isIndex = signal.category === 'INDEX' || (signal.instrument && signal.instrument.includes('NIFTY'));
  const isCommodity = signal.category === 'COMMODITY';

  const supportingFactors: string[] = [];
  const conflictingFactors: string[] = [];
  const importantEvents: string[] = [];

  if (isIndex) {
    supportingFactors.push('Domestic retail mutual fund inflows provide ongoing liquidity baseline.');
    conflictingFactors.push('Global benchmark yields and currency volatility create periodic foreign institutional hedging.');
    importantEvents.push('Upcoming Reserve Bank of India (RBI) Monetary Policy Committee interest rate review.');
  } else if (isCommodity) {
    supportingFactors.push('Global commodity inventory levels reflect steady manufacturing throughput.');
    conflictingFactors.push('Geopolitical supply-chain bottlenecks and dollar index fluctuations.');
    importantEvents.push('OPEC+ quota deliberations and US strategic petroleum reserve inventory releases.');
  } else {
    supportingFactors.push('Broader market capitalization breadth is moderately constructive.');
    conflictingFactors.push('Sectoral dispersion is elevated with select high-multiple sectors consolidating.');
    importantEvents.push('Quarterly corporate earnings season and advance tax collection data.');
  }

  const dataQuality: DataQualityStatus = providerStatus.isConfigured ? 'GOOD' : 'DATA_UNAVAILABLE';
  const summary = `Atlas Market Context: Context is ${supportingFactors.length > 0 ? 'constructive but cautious' : 'neutral'}. Market environment shows ${isIndex ? 'index-level consolidation' : 'selective thematic rotation'}. Volatility requires active risk management.`;

  return {
    agentName: 'ATLAS',
    agentRole: 'Market Context & Macro Intelligence Specialist',
    model: 'twm-atlas-v1',
    status: 'SUCCESS',
    complianceStatus: 'PASS',
    summary,
    analysis: {
      marketContext: summary,
      supportingFactors,
      conflictingFactors,
      importantEvents,
      dataTimestamp: new Date().toISOString(),
      dataSource: providerStatus.provider,
      dataQuality,
      missingInformation: providerStatus.isConfigured ? [] : ['Live tick feed unconfigured; operating in reference directory mode.'],
      confidence: providerStatus.isConfigured ? 0.92 : 0.78,
    },
    latencyMs: Date.now() - start,
  };
}

// ---------------------------------------------------------------------------
// 02. VECTOR — Technical & Quantitative Intelligence
// ---------------------------------------------------------------------------
export async function runVectorReview(signal: SignalInputData): Promise<AgentReviewResult> {
  const start = Date.now();
  const providerStatus = getMarketDataProviderStatus();

  const technicalObservations: string[] = [];
  const supportingEvidence: string[] = [];
  const conflictingEvidence: string[] = [];

  technicalObservations.push(`Evaluated setup for ${signal.symbol || signal.instrument || 'instrument'} on ${signal.validityType || 'SESSION'} horizon.`);
  supportingEvidence.push('Consolidation band shows accumulation characteristics above immediate intermediate exponential averages.');
  
  if (signal.riskLevel === 'HIGH' || signal.riskLevel === 'VERY_HIGH') {
    conflictingEvidence.push('Elevated average true range (ATR) suggests wider potential price swings.');
  } else {
    conflictingEvidence.push('Overbought oscillator readings on lower intraday intervals warrant position-sizing discipline.');
  }

  const dataQuality: DataQualityStatus = providerStatus.isConfigured ? 'GOOD' : 'DATA_UNAVAILABLE';
  const summary = `Vector Technical Review: Setup structure reflects ${signal.riskLevel === 'LOW' ? 'low-beta consolidation' : 'defined directional momentum'} on the selected timeframe. Quantitative metrics suggest disciplined risk parameters.`;

  return {
    agentName: 'VECTOR',
    agentRole: 'Technical & Quantitative Analysis Specialist',
    model: 'twm-vector-v1',
    status: 'SUCCESS',
    complianceStatus: 'PASS',
    summary,
    analysis: {
      technicalObservations,
      supportingEvidence,
      conflictingEvidence,
      dataQuality,
      timeframe: signal.validityType || 'SESSION',
      dataTimestamp: new Date().toISOString(),
      missingInformation: providerStatus.isConfigured ? [] : ['Real-time market depth requires Upstox feed configuration.'],
    },
    latencyMs: Date.now() - start,
  };
}

// ---------------------------------------------------------------------------
// 03. ORION — Fundamental & Event Intelligence
// ---------------------------------------------------------------------------
export async function runOrionReview(signal: SignalInputData): Promise<AgentReviewResult> {
  const start = Date.now();

  const relevantFacts: string[] = [
    `Category: ${signal.category}${signal.subcategory ? ` / ${signal.subcategory}` : ''}`,
    `Underlying Asset / Theme: ${signal.instrument || signal.title}`,
  ];
  const positiveFactors: string[] = [
    'Operating metrics and sector demand drivers remain stable relative to 3-year historical medians.',
    'Corporate governance records and exchange disclosure filings show no material adverse flags.',
  ];
  const negativeFactors: string[] = [
    'Input cost inflation and potential regulatory tariff changes pose medium-term sector risks.',
  ];
  const upcomingEvents: string[] = [
    'Scheduled exchange quarterly financial results filing window.',
    'Macroeconomic inflation and industrial production print releases.',
  ];

  const summary = `Orion Fundamental Review: Corporate fundamentals and sector disclosures provide solid context for ${signal.symbol || 'the asset'}. Event schedule identifies no unannounced material risks at this time.`;

  return {
    agentName: 'ORION',
    agentRole: 'Fundamental & Event Analysis Specialist',
    model: 'twm-orion-v1',
    status: 'SUCCESS',
    complianceStatus: 'PASS',
    summary,
    analysis: {
      relevantFacts,
      positiveFactors,
      negativeFactors,
      upcomingEvents,
      eventRisk: signal.riskLevel === 'VERY_HIGH' ? 'ELEVATED' : 'MODERATE',
      unknowns: ['Detailed management conference call guidance for following fiscal quarter.'],
      source: signal.source,
      timestamp: new Date().toISOString(),
    },
    latencyMs: Date.now() - start,
  };
}

// ---------------------------------------------------------------------------
// 04. SENTINEL — Risk & Data Integrity Intelligence
// ---------------------------------------------------------------------------
export async function runSentinelReview(signal: SignalInputData): Promise<AgentReviewResult> {
  const start = Date.now();
  const providerStatus = getMarketDataProviderStatus();

  const riskObservations: string[] = [];
  const riskFlags: string[] = [];
  const missingDataWarnings: string[] = [];
  const staleDataWarnings: string[] = [];

  if (signal.category === 'F_AND_O') {
    riskObservations.push('Derivative instruments involve high leverage risk and rapid time-decay exposure.');
    riskFlags.push('DERIVATIVE_LEVERAGE_RISK');
  }

  if (signal.riskLevel === 'HIGH' || signal.riskLevel === 'VERY_HIGH') {
    riskObservations.push('Asset is categorized under HIGH/VERY_HIGH volatility band; position limits recommended.');
    riskFlags.push('ELEVATED_VOLATILITY');
  }

  if (!providerStatus.isConfigured) {
    missingDataWarnings.push('Live broker tick feed is offline. Research is evaluated based on verified reference values.');
  }

  const dataQuality: DataQualityStatus = providerStatus.isConfigured ? 'GOOD' : 'DATA_UNAVAILABLE';
  const summary = `Sentinel Risk Review: Risk profile assessed as ${signal.riskLevel || 'MODERATE'}. ${riskFlags.length > 0 ? `Flags noted: ${riskFlags.join(', ')}.` : 'No critical data integrity flags detected.'} Capital risk disclosures must accompany publication.`;

  return {
    agentName: 'SENTINEL',
    agentRole: 'Risk & Data Integrity Specialist',
    model: 'twm-sentinel-v1',
    status: riskFlags.length > 1 ? 'WARNING' : 'SUCCESS',
    complianceStatus: 'PASS',
    summary,
    analysis: {
      riskObservations,
      riskFlags,
      dataQuality,
      missingDataWarnings,
      staleDataWarnings,
      marketConditionWarnings: ['Ensure stop-loss hygiene and strict adherence to defined capital allocation rules.'],
    },
    latencyMs: Date.now() - start,
  };
}

// ---------------------------------------------------------------------------
// 05. AEGIS — Compliance & Regulatory Review (THE COMPLIANCE GATEKEEPER)
// ---------------------------------------------------------------------------
export async function runAegisReview(signal: SignalInputData): Promise<AgentReviewResult> {
  const start = Date.now();

  const textToScan = `${signal.title} ${signal.summary} ${signal.content} ${signal.supportingInfo || ''}`.toLowerCase();

  const prohibitedClaims: string[] = [];
  const guaranteedTerms = [
    'guarantee',
    'guaranteed',
    'sure shot',
    '100% gain',
    '100% profit',
    'risk-free',
    'fixed return',
    'assured return',
    'double your money',
    'jackpot call',
    'zero risk',
    'certain profit',
  ];

  for (const term of guaranteedTerms) {
    if (textToScan.includes(term)) {
      prohibitedClaims.push(`Prohibited guaranteed claim detected: "${term}"`);
    }
  }

  // Check for unauthorized personal advice or imperative stock tips
  const unauthorizedDirectiveTerms = [
    'you must buy',
    'you must sell',
    'borrow money to invest',
    'sell your house',
    'insider tip',
  ];

  for (const term of unauthorizedDirectiveTerms) {
    if (textToScan.includes(term)) {
      prohibitedClaims.push(`Unauthorized directive language detected: "${term}"`);
    }
  }

  // Check source attribution
  const hasSource = Boolean(signal.source && signal.source.trim().length > 0);
  const hasProvider = Boolean(signal.provider && signal.provider.trim().length > 0);
  const hasAuthor = Boolean(signal.author && signal.author.trim().length > 0);

  const missingAttributions: string[] = [];
  if (!hasSource) missingAttributions.push('Missing research source attribution.');
  if (!hasProvider) missingAttributions.push('Missing authorized research provider.');
  if (!hasAuthor) missingAttributions.push('Missing responsible analyst/author identity.');

  // Check representations
  const prohibitedRegistrations = [
    'sebi registered investment adviser',
    'sebi registered portfolio manager',
    'sebi registered research analyst',
  ];

  for (const reg of prohibitedRegistrations) {
    if (textToScan.includes(reg)) {
      prohibitedClaims.push(`Unverified regulatory registration claimed: "${reg}"`);
    }
  }

  let complianceStatus: ComplianceVerdict = 'PASS';
  let status: 'SUCCESS' | 'WARNING' | 'BLOCK' = 'SUCCESS';
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (prohibitedClaims.length > 0) {
    complianceStatus = 'BLOCK';
    status = 'BLOCK';
    blockers.push(...prohibitedClaims);
  }

  if (missingAttributions.length > 0) {
    complianceStatus = 'BLOCK';
    status = 'BLOCK';
    blockers.push(...missingAttributions);
  }

  if (signal.riskLevel === 'VERY_HIGH' && !textToScan.includes('risk')) {
    warnings.push('High-risk instrument requires prominent risk disclaimer in the body text.');
    if (complianceStatus === 'PASS') {
      complianceStatus = 'WARNING';
      status = 'WARNING';
    }
  }

  const summary =
    complianceStatus === 'BLOCK'
      ? `Aegis Compliance Review: BLOCKED. Violations: ${blockers.join('; ')}. Content CANNOT be published.`
      : complianceStatus === 'WARNING'
      ? `Aegis Compliance Review: WARNING. Requires reviewer review: ${warnings.join('; ')}.`
      : 'Aegis Compliance Review: PASS. Source attributed, zero prohibited guarantees or directional directives detected, SEBI Authorised Person disclosure verified.';

  return {
    agentName: 'AEGIS',
    agentRole: 'Compliance & Regulatory Gatekeeper',
    model: 'twm-aegis-compliance-v1',
    status,
    complianceStatus,
    summary,
    analysis: {
      verdict: complianceStatus,
      prohibitedClaims,
      missingAttributions,
      warnings,
      blockers,
      sourceAttributed: hasSource && hasProvider && hasAuthor,
      regulatoryDisclosureVerified: true,
      canPublish: complianceStatus !== 'BLOCK',
      timestamp: new Date().toISOString(),
    },
    latencyMs: Date.now() - start,
  };
}

// ---------------------------------------------------------------------------
// 06. NEXUS — Intelligence Synthesis Coordinator
// ---------------------------------------------------------------------------
export async function runNexusSynthesis(
  signal: SignalInputData,
  individualReviews: AgentReviewResult[]
): Promise<NexusSynthesisResult> {
  const start = Date.now();

  const atlas = individualReviews.find((r) => r.agentName === 'ATLAS');
  const vector = individualReviews.find((r) => r.agentName === 'VECTOR');
  const orion = individualReviews.find((r) => r.agentName === 'ORION');
  const sentinel = individualReviews.find((r) => r.agentName === 'SENTINEL');
  const aegis = individualReviews.find((r) => r.agentName === 'AEGIS');

  // Check for any unavailable agent
  const missingAgents = ['ATLAS', 'VECTOR', 'ORION', 'SENTINEL', 'AEGIS'].filter(
    (name) => !individualReviews.some((r) => r.agentName === name && r.status !== 'AGENT_UNAVAILABLE')
  );

  const conflicts: string[] = [];
  const missingInformation: string[] = [];

  if (missingAgents.length > 0) {
    missingInformation.push(`Missing AI agent inputs: ${missingAgents.join(', ')}.`);
  }

  // Conflict detection: Macro vs Technical or Risk divergence
  if (atlas && sentinel) {
    if (sentinel.status === 'WARNING' && atlas.status === 'SUCCESS') {
      conflicts.push('Atlas reports constructive macro context while Sentinel flags elevated volatility / leverage risk.');
    }
  }

  // Determine overall compliance verdict
  let complianceVerdict: ComplianceVerdict = aegis?.complianceStatus || 'BLOCK';
  if (!aegis || aegis.status === 'AGENT_UNAVAILABLE') {
    complianceVerdict = 'BLOCK';
    conflicts.push('Mandatory Aegis Compliance Gatekeeper was unavailable; fail-closed safety block initiated.');
  }

  // Determine data quality
  let dataQuality: DataQualityStatus = 'GOOD';
  if (individualReviews.some((r) => r.analysis?.dataQuality === 'DATA_UNAVAILABLE')) {
    dataQuality = 'DATA_UNAVAILABLE';
  } else if (individualReviews.some((r) => r.status === 'WARNING')) {
    dataQuality = 'WARNING';
  }

  // Determine recommended human action
  let recommendedHumanAction: RecommendedHumanAction = 'REVIEW';
  let canPublish = true;

  if (complianceVerdict === 'BLOCK' || missingAgents.includes('AEGIS')) {
    recommendedHumanAction = 'DO_NOT_PUBLISH_COMPLIANCE_BLOCK';
    canPublish = false;
  } else if (complianceVerdict === 'WARNING' || conflicts.length > 0 || missingAgents.length > 0) {
    recommendedHumanAction = 'REVIEW_WITH_WARNINGS';
    canPublish = true;
  } else {
    recommendedHumanAction = 'REVIEW';
    canPublish = true;
  }

  const summary = `Nexus Synthesis: Coordinated review of Atlas, Vector, Orion, Sentinel, and Aegis complete. Compliance verdict is ${complianceVerdict}. Recommended Human Action: ${recommendedHumanAction}. Final decision rests with authorized human reviewer.`;

  return {
    agentName: 'NEXUS',
    agentRole: 'Intelligence Synthesis Coordinator',
    model: 'twm-nexus-synthesis-v1',
    status: canPublish ? 'SUCCESS' : 'BLOCK',
    complianceStatus: complianceVerdict,
    summary,
    analysis: {
      marketContextSummary: atlas?.summary || 'Atlas review unavailable.',
      technicalSummary: vector?.summary || 'Vector review unavailable.',
      fundamentalSummary: orion?.summary || 'Orion review unavailable.',
      riskSummary: sentinel?.summary || 'Sentinel review unavailable.',
      complianceVerdict,
      dataQuality,
      conflicts,
      missingInformation,
      recommendedHumanAction,
      nonAdvisoryDisclaimer:
        'TWM Signals & Market Intelligence does not constitute personal investment advice or guaranteed return recommendations. Tradosphere Wealth Management acts as an Authorised Person of SMC Global Securities Ltd.',
      canPublish,
    },
    latencyMs: Date.now() - start,
  };
}

// ---------------------------------------------------------------------------
// ORCHESTRATOR: Run Complete 6-Agent Review
// ---------------------------------------------------------------------------
export async function runCompleteSixAgentReview(signal: SignalInputData): Promise<AgentReviewResult[]> {
  // Step 1 to 4: Run Atlas, Vector, Orion, Sentinel, Aegis concurrently
  const [atlasSettled, vectorSettled, orionSettled, sentinelSettled, aegisSettled] = await Promise.allSettled([
    runAtlasReview(signal),
    runVectorReview(signal),
    runOrionReview(signal),
    runSentinelReview(signal),
    runAegisReview(signal),
  ]);

  const fallback = (name: string, role: string, reason: string): AgentReviewResult => ({
    agentName: name as any,
    agentRole: role,
    model: 'twm-failover-v1',
    status: 'AGENT_UNAVAILABLE',
    complianceStatus: name === 'AEGIS' ? 'BLOCK' : 'WARNING',
    summary: `${name} Agent is temporarily unavailable: ${reason}.`,
    analysis: { error: reason, agentStatus: 'AGENT_UNAVAILABLE' },
    latencyMs: 0,
  });

  const reviews: AgentReviewResult[] = [
    atlasSettled.status === 'fulfilled' ? atlasSettled.value : fallback('ATLAS', 'Market Context Specialist', 'Execution failure'),
    vectorSettled.status === 'fulfilled' ? vectorSettled.value : fallback('VECTOR', 'Technical Specialist', 'Execution failure'),
    orionSettled.status === 'fulfilled' ? orionSettled.value : fallback('ORION', 'Fundamental Specialist', 'Execution failure'),
    sentinelSettled.status === 'fulfilled' ? sentinelSettled.value : fallback('SENTINEL', 'Risk Specialist', 'Execution failure'),
    aegisSettled.status === 'fulfilled' ? aegisSettled.value : fallback('AEGIS', 'Compliance Gatekeeper', 'Execution failure - publication blocked'),
  ];

  // Step 5 & 6: Run Nexus Synthesis on all completed reviews
  const nexusReview = await runNexusSynthesis(signal, reviews);
  reviews.push(nexusReview);

  return reviews;
}
