/**
 * Signals & Market Intelligence Type Definitions
 * Tradosphere Wealth Management (TWM)
 */

export type SignalCategory =
  | 'F_AND_O'
  | 'EQUITY'
  | 'INDEX'
  | 'COMMODITY'
  | 'IPO'
  | 'MUTUAL_FUNDS'
  | 'SIP'
  | 'MARKET_OUTLOOK'
  | 'CORPORATE_ACTIONS'
  | 'MACRO_EVENTS'
  | 'RISK_ALERTS'
  | 'EDUCATIONAL';

export type SignalStatus =
  | 'DRAFT'
  | 'AI_REVIEW'
  | 'HUMAN_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ACTIVE'
  | 'CLOSED'
  | 'EXPIRED'
  | 'REJECTED'
  | 'SENT_BACK';

export type SignalRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

export type AgentName = 'ATLAS' | 'VECTOR' | 'ORION' | 'SENTINEL' | 'AEGIS' | 'NEXUS';

export type ComplianceVerdict = 'PASS' | 'WARNING' | 'BLOCK';

export type DataQualityStatus = 'GOOD' | 'WARNING' | 'INSUFFICIENT' | 'DATA_UNAVAILABLE';

export type RecommendedHumanAction =
  | 'REVIEW'
  | 'REVIEW_WITH_WARNINGS'
  | 'DO_NOT_PUBLISH_COMPLIANCE_BLOCK';

export interface AgentReviewResult {
  agentName: AgentName;
  agentRole: string;
  model: string;
  status: 'SUCCESS' | 'WARNING' | 'BLOCK' | 'FAILED' | 'AGENT_UNAVAILABLE';
  complianceStatus: ComplianceVerdict;
  summary: string;
  analysis: Record<string, any>;
  latencyMs: number;
}

export interface NexusSynthesisResult extends AgentReviewResult {
  analysis: {
    marketContextSummary: string;
    technicalSummary: string;
    fundamentalSummary: string;
    riskSummary: string;
    complianceVerdict: ComplianceVerdict;
    dataQuality: DataQualityStatus;
    conflicts: string[];
    missingInformation: string[];
    recommendedHumanAction: RecommendedHumanAction;
    nonAdvisoryDisclaimer: string;
    canPublish: boolean;
  };
}

export interface CreateSignalInput {
  title: string;
  category: SignalCategory;
  subcategory?: string;
  instrument?: string;
  exchange?: string;
  symbol?: string;
  summary: string;
  content: string;
  source: string;
  provider: string;
  author: string;
  supportingInfo?: string;
  validityType?: string;
  validUntil?: string | Date;
  riskLevel?: SignalRiskLevel;
}

export interface UpdateSignalInput extends Partial<CreateSignalInput> {
  id: string;
  changeReason?: string;
}

export interface HumanDecisionInput {
  action: 'APPROVE' | 'REJECT' | 'SEND_BACK';
  notes?: string;
}

export interface SubscriptionStatusInfo {
  hasActiveSubscription: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'NONE' | 'TRIAL' | 'CANCELLED';
  planName?: string;
  monthlyPrice?: number;
  startDate?: string;
  endDate?: string;
  daysRemaining?: number;
  canAccessPaidContent: boolean;
}
