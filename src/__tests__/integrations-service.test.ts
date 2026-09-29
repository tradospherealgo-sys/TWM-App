import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '../lib/prisma';
import {
  ensureIntegrationDefaults,
  getAllIntegrationCards,
  saveIntegration,
  getDecryptedIntegration,
  rotateIntegrationSecret,
  runProviderTest,
} from '../lib/integrations/service';

describe('TWM Integration Service & Secret Vault', () => {
  let adminUserId = 'test_admin_user_id';

  beforeEach(async () => {
    // Find or create admin user for test
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      adminUserId = admin.id;
    }
  });

  it('should initialize default integration records', async () => {
    await ensureIntegrationDefaults();
    const cards = await getAllIntegrationCards();

    expect(cards.length).toBeGreaterThanOrEqual(8);
    const keys = cards.map((c) => c.providerKey);
    expect(keys).toContain('DATABASE');
    expect(keys).toContain('UPSTOX');
    expect(keys).toContain('SMC_GLOBAL');
    expect(keys).toContain('AI_PROVIDER');
    expect(keys).toContain('STORAGE');
  });

  it('should never expose plaintext secrets in cards view', async () => {
    const rawSecret = 'real_upstox_private_access_token_12345';
    await saveIntegration(
      'UPSTOX',
      { accessToken: rawSecret, clientSecret: 'super_secret_client_key' },
      { baseUrl: 'https://api.upstox.com/v2', clientId: 'UPSTOX_APP_ID' },
      adminUserId
    );

    const cards = await getAllIntegrationCards();
    const upstoxCard = cards.find((c) => c.providerKey === 'UPSTOX');

    expect(upstoxCard).toBeDefined();
    // Verify plaintext is masked
    expect(upstoxCard?.maskedSecrets.accessToken).toBe('••••••••••••2345');
    expect(upstoxCard?.maskedSecrets.accessToken).not.toContain(rawSecret);

    // Verify card JSON doesn't contain raw secret anywhere
    const stringified = JSON.stringify(upstoxCard);
    expect(stringified).not.toContain(rawSecret);
  });

  it('should decrypt secrets server-side for internal adapters only', async () => {
    const decrypted = await getDecryptedIntegration('UPSTOX');
    expect(decrypted.secrets.accessToken).toBe('real_upstox_private_access_token_12345');
    expect(decrypted.publicConfig.clientId).toBe('UPSTOX_APP_ID');
  });

  it('should rotate/clear credentials and log audit event', async () => {
    await rotateIntegrationSecret('UPSTOX', 'accessToken', 'rotated_new_token_9999', adminUserId);

    const decrypted = await getDecryptedIntegration('UPSTOX');
    expect(decrypted.secrets.accessToken).toBe('rotated_new_token_9999');

    // Verify audit log
    const audit = await prisma.activityLog.findFirst({
      where: {
        action: 'INTEGRATION_CREDENTIAL_ROTATED',
        entityId: 'UPSTOX',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeDefined();
    expect(audit?.detailsJson).not.toContain('rotated_new_token_9999');
  });

  it('should execute database connection test and report latency and table counts', async () => {
    const result = await runProviderTest('DATABASE');
    expect(result.success).toBe(true);
    expect(result.status).toBe('CONNECTED');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.details?.userCount).toBeGreaterThan(0);
  });
});
