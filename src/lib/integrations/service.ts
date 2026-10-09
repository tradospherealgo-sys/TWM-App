import prisma from '../prisma';
import { INTEGRATION_REGISTRY } from './registry';
import {
  IntegrationCardView,
  IntegrationStatus,
  TestResult,
} from './types';
import {
  encryptSecretsMap,
  decryptSecretsMap,
  isMaskedString,
} from '../encryption';
import {
  testDatabaseConnection,
  testSupabaseConnection,
  testUpstoxConnection,
  testSMCConnection,
  testAIProviderConnection,
  testEmailConnection,
  testStorageConnection,
  testNotificationsConnection,
  testMarketDataProvider,
  testOptionChainConnection,
  testChartsConnection,
  testGoogleAuthConnection,
  testGoogleServicesConnection,
  testPaymentsConnection,
  testFeatureFlagsConnection,
} from './testers';

/**
 * TWM Integration Management Service
 */

let isDbOnline: boolean | null = null;
const inMemoryStore = new Map<string, any>();

/**
 * Initialize default configuration rows in DB if they do not exist
 */
export async function ensureIntegrationDefaults(): Promise<void> {
  if (isDbOnline === false) return;
  try {
    for (const [providerKey, meta] of Object.entries(INTEGRATION_REGISTRY)) {
      let existing: any = null;
      try {
        existing = await prisma.integrationConfig.findUnique({
          where: { providerKey },
        });
        isDbOnline = true;
      } catch (err: any) {
        // Database is unreachable, mark offline and stop querying
        isDbOnline = false;
        break;
      }

      if (!existing) {
        // Check if bootstrap / env has initial values
        let initialStatus: IntegrationStatus = 'NOT_CONFIGURED';
        const initialPublic = meta.defaultPublicConfig || {};
        const initialSecrets: Record<string, string> = {};

        if (providerKey === 'DATABASE') {
          initialStatus = 'REQUIRES_BOOTSTRAP';
        } else if (providerKey === 'STORAGE') {
          initialStatus = 'CONNECTED';
        } else if (providerKey === 'NOTIFICATIONS') {
          initialStatus = 'CONNECTED';
        } else if (providerKey === 'SMC_GLOBAL') {
          if (process.env.SMC_GLOBAL_AP_CODE) {
            initialPublic.apCode = process.env.SMC_GLOBAL_AP_CODE;
            initialStatus = 'CONFIGURED';
          }
        } else if (providerKey === 'AI_PROVIDER') {
          initialStatus = 'CONFIGURED'; // Built-in SOP heuristic is active
        } else if (providerKey === 'MARKET_DATA') {
          initialStatus = 'CONFIGURED';
        } else if (providerKey === 'OPTION_CHAIN') {
          initialStatus = 'CONFIGURED';
        } else if (providerKey === 'CHARTS') {
          initialStatus = 'CONNECTED';
        } else if (providerKey === 'GOOGLE_AUTH') {
          initialStatus = 'NOT_CONFIGURED';
        } else if (providerKey === 'PAYMENTS') {
          initialStatus = 'CONFIGURED'; // Manual mode by default
        } else if (providerKey === 'FEATURE_FLAGS') {
          initialStatus = 'CONNECTED';
        }

        const { encryptedJson, maskedJson } = encryptSecretsMap(initialSecrets);

        try {
          await prisma.integrationConfig.upsert({
            where: { providerKey },
            update: {},
            create: {
              providerKey,
              name: meta.name,
              category: meta.category,
              environment: meta.environment,
              encryptedSecrets: encryptedJson,
              publicConfigJson: JSON.stringify(initialPublic),
              maskedSecretsJson: maskedJson,
              status: initialStatus,
              isRequired: meta.isRequired,
              isBootstrapOnly: meta.isBootstrapOnly,
            },
          });
        } catch {
          break;
        }
      }
    }
  } catch (err: any) {
    console.warn('[INTEGRATIONS] Could not ensure integration defaults in database:', err?.message || err);
  }
}

/**
 * Get all integration cards for Admin -> Integrations
 * Sensitive secrets are NEVER included; only masked strings are returned.
 */
export async function getAllIntegrationCards(): Promise<IntegrationCardView[]> {
  await ensureIntegrationDefaults();

  let configs: any[] = [];
  if (isDbOnline !== false) {
    try {
      configs = await prisma.integrationConfig.findMany({
        orderBy: { createdAt: 'asc' },
      });
      isDbOnline = true;
    } catch (err: any) {
      isDbOnline = false;
      console.warn('[INTEGRATIONS] Could not load configs from DB, using registry defaults:', err?.message || err);
    }
  }

  if (configs.length === 0) {
    // Build cards from registry directly
    configs = Object.entries(INTEGRATION_REGISTRY).map(([providerKey, meta]) => ({
      providerKey,
      name: meta.name,
      environment: meta.environment,
      status: providerKey === 'DATABASE' ? 'REQUIRES_BOOTSTRAP' : 'NOT_CONFIGURED',
      isRequired: meta.isRequired,
      isBootstrapOnly: meta.isBootstrapOnly,
      publicConfigJson: JSON.stringify(meta.defaultPublicConfig || {}),
      maskedSecretsJson: '{}',
      lastTestResult: null,
      lastTestedAt: null,
      lastError: null,
    }));
  }

  // Overlay any inMemoryStore configs
  for (const [providerKey, mem] of inMemoryStore.entries()) {
    const idx = configs.findIndex((c) => c.providerKey === providerKey);
    if (idx >= 0) {
      configs[idx] = { ...configs[idx], ...mem };
    } else {
      configs.push(mem);
    }
  }

  const cards: IntegrationCardView[] = [];

  for (const config of configs) {
    const meta = INTEGRATION_REGISTRY[config.providerKey];
    if (!meta) continue;

    let publicConfig: Record<string, any> = {};
    try {
      publicConfig = JSON.parse(config.publicConfigJson || '{}');
    } catch {
      publicConfig = {};
    }

    let maskedSecrets: Record<string, string> = {};
    try {
      maskedSecrets = JSON.parse(config.maskedSecretsJson || '{}');
    } catch {
      maskedSecrets = {};
    }

    let lastTestResult = null;
    try {
      lastTestResult = config.lastTestResult ? JSON.parse(config.lastTestResult) : null;
    } catch {
      lastTestResult = null;
    }

    // Determine missing required fields
    const missingFields: string[] = [];
    for (const field of meta.fields) {
      if (field.required) {
        if (field.isSecret) {
          const val = maskedSecrets[field.key];
          if (!val || val.trim().length === 0) {
            missingFields.push(field.label);
          }
        } else {
          const val = publicConfig[field.key];
          if (!val || String(val).trim().length === 0) {
            missingFields.push(field.label);
          }
        }
      }
    }

    // Completeness score
    const totalRequired = meta.fields.filter((f) => f.required).length;
    const completeness =
      totalRequired === 0
        ? 100
        : Math.round(((totalRequired - missingFields.length) / totalRequired) * 100);

    cards.push({
      providerKey: config.providerKey,
      name: config.name,
      category: meta.category,
      purpose: meta.purpose,
      environment: config.environment,
      status: config.status as IntegrationStatus,
      isRequired: config.isRequired,
      isBootstrapOnly: config.isBootstrapOnly,
      completeness,
      lastTestedAt: config.lastTestedAt ? (typeof config.lastTestedAt === 'string' ? config.lastTestedAt : config.lastTestedAt.toISOString()) : null,
      lastTestResult,
      lastError: config.lastError,
      publicConfig,
      maskedSecrets,
      missingFields,
      docsHelp: meta.docsHelp,
      fields: meta.fields,
    });
  }

  return cards;
}

/**
 * Get internal decrypted integration credentials (SERVER-SIDE ONLY)
 */
export async function getDecryptedIntegration(providerKey: string): Promise<{
  secrets: Record<string, string>;
  publicConfig: Record<string, any>;
  status: string;
}> {
  let config: any = inMemoryStore.get(providerKey) || null;

  if (!config && isDbOnline !== false) {
    try {
      config = await prisma.integrationConfig.findUnique({
        where: { providerKey },
      });
      isDbOnline = true;
    } catch (err: any) {
      isDbOnline = false;
      config = null;
    }
  }

  if (!config) {
    const meta = INTEGRATION_REGISTRY[providerKey];
    return {
      secrets: {},
      publicConfig: meta?.defaultPublicConfig || {},
      status: 'NOT_CONFIGURED',
    };
  }

  const secrets = decryptSecretsMap(config.encryptedSecrets);
  let publicConfig: Record<string, any> = {};
  try {
    publicConfig = JSON.parse(config.publicConfigJson || '{}');
  } catch {
    publicConfig = {};
  }

  return { secrets, publicConfig, status: config.status };
}

/**
 * Save / Update Integration Configuration from Admin Panel
 * Encrypts secrets, updates audit log, triggers automated test.
 */
export async function saveIntegration(
  providerKey: string,
  updatedSecrets: Record<string, string>,
  updatedPublicConfig: Record<string, any>,
  adminUserId: string
): Promise<{ success: boolean; testResult: TestResult }> {
  const meta = INTEGRATION_REGISTRY[providerKey];
  if (!meta) {
    throw new Error(`Unknown provider key: ${providerKey}`);
  }

  if (meta.isBootstrapOnly) {
    throw new Error(
      `${meta.name} is a bootstrap deployment configuration and cannot be modified at runtime.`
    );
  }

  // Load existing decrypted secrets
  const current = await getDecryptedIntegration(providerKey);
  const mergedSecrets: Record<string, string> = { ...current.secrets };

  // Only update secrets that were provided with new non-masked values
  for (const [key, val] of Object.entries(updatedSecrets)) {
    if (val && !isMaskedString(val) && val.trim().length > 0) {
      mergedSecrets[key] = val.trim();
    }
  }

  const mergedPublic = {
    ...current.publicConfig,
    ...updatedPublicConfig,
  };

  const { encryptedJson, maskedJson } = encryptSecretsMap(mergedSecrets);

  // Update in-memory store immediately
  inMemoryStore.set(providerKey, {
    providerKey,
    name: meta.name,
    category: meta.category,
    environment: meta.environment,
    encryptedSecrets: encryptedJson,
    maskedSecretsJson: maskedJson,
    publicConfigJson: JSON.stringify(mergedPublic),
    status: 'CONFIGURED',
    isRequired: meta.isRequired,
    isBootstrapOnly: meta.isBootstrapOnly,
    updatedByUserId: adminUserId,
  });

  // Update DB record if reachable
  if (isDbOnline !== false) {
    try {
      await prisma.integrationConfig.upsert({
        where: { providerKey },
        update: {
          encryptedSecrets: encryptedJson,
          maskedSecretsJson: maskedJson,
          publicConfigJson: JSON.stringify(mergedPublic),
          status: 'CONFIGURED',
          updatedByUserId: adminUserId,
        },
        create: {
          providerKey,
          name: meta.name,
          category: meta.category,
          environment: meta.environment,
          encryptedSecrets: encryptedJson,
          maskedSecretsJson: maskedJson,
          publicConfigJson: JSON.stringify(mergedPublic),
          status: 'CONFIGURED',
          isRequired: meta.isRequired,
          isBootstrapOnly: meta.isBootstrapOnly,
          updatedByUserId: adminUserId,
        },
      });

      // Resolve valid actor user ID for FK constraint
      let validActorId: string | null = null;
      if (adminUserId) {
        const user = await prisma.user.findUnique({ where: { id: adminUserId }, select: { id: true } });
        if (user) validActorId = user.id;
      }

      // Audit log entry (NEVER log the secret itself)
      await prisma.activityLog.create({
        data: {
          actorUserId: validActorId,
          actorRole: 'ADMIN',
          action: 'INTEGRATION_UPDATE',
          entityType: 'IntegrationConfig',
          entityId: providerKey,
          detailsJson: JSON.stringify({
            providerKey,
            updatedFields: Object.keys(updatedSecrets).concat(Object.keys(updatedPublicConfig)),
          }),
        },
      });
      isDbOnline = true;
    } catch (err: any) {
      isDbOnline = false;
      console.warn(`[INTEGRATIONS] DB write skipped for ${providerKey}:`, err?.message || err);
    }
  }

  // Run automatic connection test
  const testResult = await runProviderTest(providerKey);

  return { success: true, testResult };
}

/**
 * Rotate or clear an integration credential
 */
export async function rotateIntegrationSecret(
  providerKey: string,
  secretKey: string,
  newSecretValue: string,
  adminUserId: string
): Promise<void> {
  const current = await getDecryptedIntegration(providerKey);
  const secrets = { ...current.secrets };

  if (newSecretValue && newSecretValue.trim().length > 0) {
    secrets[secretKey] = newSecretValue.trim();
  } else {
    delete secrets[secretKey];
  }

  const { encryptedJson, maskedJson } = encryptSecretsMap(secrets);

  // Update in-memory store
  if (inMemoryStore.has(providerKey)) {
    const mem = inMemoryStore.get(providerKey);
    inMemoryStore.set(providerKey, {
      ...mem,
      encryptedSecrets: encryptedJson,
      maskedSecretsJson: maskedJson,
      updatedByUserId: adminUserId,
    });
  }

  if (isDbOnline !== false) {
    try {
      await prisma.integrationConfig.update({
        where: { providerKey },
        data: {
          encryptedSecrets: encryptedJson,
          maskedSecretsJson: maskedJson,
          updatedByUserId: adminUserId,
        },
      });

      // Resolve valid actor user ID for FK constraint
      let validActorId: string | null = null;
      if (adminUserId) {
        const user = await prisma.user.findUnique({ where: { id: adminUserId }, select: { id: true } });
        if (user) validActorId = user.id;
      }

      await prisma.activityLog.create({
        data: {
          actorUserId: validActorId,
          actorRole: 'ADMIN',
          action: 'INTEGRATION_CREDENTIAL_ROTATED',
          entityType: 'IntegrationConfig',
          entityId: providerKey,
          detailsJson: JSON.stringify({
            providerKey,
            rotatedField: secretKey,
            action: newSecretValue ? 'ROTATED' : 'CLEARED',
          }),
        },
      });
      isDbOnline = true;
    } catch (err: any) {
      isDbOnline = false;
      console.warn(`[INTEGRATIONS] DB rotation write skipped for ${providerKey}:`, err?.message || err);
    }
  }
}

/**
 * Execute real backend connection test and record outcome in DB
 */
export async function runProviderTest(providerKey: string): Promise<TestResult> {
  const current = await getDecryptedIntegration(providerKey);
  const secrets = current.secrets;
  const publicConfig = current.publicConfig;

  let testResult: TestResult;

  switch (providerKey) {
    case 'DATABASE':
      testResult = await testDatabaseConnection();
      break;
    case 'SUPABASE':
      testResult = await testSupabaseConnection(secrets, publicConfig);
      break;
    case 'UPSTOX':
      testResult = await testUpstoxConnection(secrets, publicConfig);
      break;
    case 'SMC_GLOBAL':
      testResult = await testSMCConnection(secrets, publicConfig);
      break;
    case 'AI_PROVIDER':
      testResult = await testAIProviderConnection(secrets, publicConfig);
      break;
    case 'EMAIL':
      testResult = await testEmailConnection(secrets, publicConfig);
      break;
    case 'STORAGE':
      testResult = await testStorageConnection(secrets, publicConfig);
      break;
    case 'NOTIFICATIONS':
      testResult = await testNotificationsConnection(secrets, publicConfig);
      break;
    case 'MARKET_DATA':
      testResult = await testMarketDataProvider(secrets, publicConfig);
      break;
    case 'OPTION_CHAIN':
      testResult = await testOptionChainConnection(secrets, publicConfig);
      break;
    case 'CHARTS':
      testResult = await testChartsConnection(secrets, publicConfig);
      break;
    case 'GOOGLE_AUTH':
      testResult = await testGoogleAuthConnection(secrets, publicConfig);
      break;
    case 'GOOGLE_SERVICES':
      testResult = await testGoogleServicesConnection(secrets, publicConfig);
      break;
    case 'PAYMENTS':
      testResult = await testPaymentsConnection(secrets, publicConfig);
      break;
    case 'FEATURE_FLAGS':
      testResult = await testFeatureFlagsConnection();
      break;
    default:
      testResult = {
        success: false,
        status: 'CONNECTION_FAILED',
        message: `No tester registered for ${providerKey}`,
        latencyMs: 0,
      };
  }

  // Update in-memory store
  if (inMemoryStore.has(providerKey)) {
    const mem = inMemoryStore.get(providerKey);
    inMemoryStore.set(providerKey, {
      ...mem,
      status: testResult.status,
      lastTestedAt: new Date().toISOString(),
      lastTestResult: JSON.stringify({
        success: testResult.success,
        message: testResult.message,
        latencyMs: testResult.latencyMs,
        details: testResult.details || null,
      }),
      lastError: testResult.error || null,
    });
  }

  // Update DB with test results if reachable
  if (isDbOnline !== false) {
    try {
      await prisma.integrationConfig.update({
        where: { providerKey },
        data: {
          status: testResult.status,
          lastTestedAt: new Date(),
          lastTestResult: JSON.stringify({
            success: testResult.success,
            message: testResult.message,
            latencyMs: testResult.latencyMs,
            details: testResult.details || null,
          }),
          lastError: testResult.error || null,
        },
      });
      isDbOnline = true;
    } catch (err: any) {
      isDbOnline = false;
      console.warn(`[INTEGRATIONS] DB test result update skipped for ${providerKey}:`, err?.message || err);
    }
  }

  return testResult;
}
