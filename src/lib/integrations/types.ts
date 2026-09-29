/**
 * TWM Integrations Types & Schemas
 */

export type IntegrationStatus =
  | 'NOT_CONFIGURED'
  | 'INCOMPLETE'
  | 'CONFIGURED'
  | 'TESTING'
  | 'CONNECTED'
  | 'CONNECTION_FAILED'
  | 'DISABLED'
  | 'OPTIONAL'
  | 'REQUIRES_BOOTSTRAP';

export type IntegrationCategory =
  | 'DATABASE'
  | 'BROKER_GATEWAY'
  | 'MARKET_DATA'
  | 'AI'
  | 'COMMUNICATION'
  | 'STORAGE'
  | 'FINANCIAL_SERVICE';

export interface IntegrationFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select' | 'url';
  placeholder?: string;
  isSecret?: boolean;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  description?: string;
}

export interface IntegrationMetadata {
  providerKey: string;
  name: string;
  category: IntegrationCategory;
  purpose: string;
  environment: 'PRODUCTION' | 'SANDBOX';
  isRequired: boolean;
  isBootstrapOnly: boolean; // Must be set at deployment/environment level, cannot be safely hot-reloaded
  docsUrl?: string;
  docsHelp: string;
  fields: IntegrationFieldDefinition[];
  defaultPublicConfig?: Record<string, any>;
}

export interface IntegrationCardView {
  providerKey: string;
  name: string;
  category: IntegrationCategory;
  purpose: string;
  environment: string;
  status: IntegrationStatus;
  isRequired: boolean;
  isBootstrapOnly: boolean;
  completeness: number; // 0 to 100 percentage
  lastTestedAt: string | null;
  lastTestResult: {
    success: boolean;
    message: string;
    latencyMs?: number;
    details?: Record<string, any>;
  } | null;
  lastError: string | null;
  publicConfig: Record<string, any>;
  maskedSecrets: Record<string, string>;
  missingFields: string[];
  docsHelp: string;
  fields: IntegrationFieldDefinition[];
}

export interface TestResult {
  success: boolean;
  status: IntegrationStatus;
  message: string;
  latencyMs: number;
  details?: Record<string, any>;
  error?: string;
}
