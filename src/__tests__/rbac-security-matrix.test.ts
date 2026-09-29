import { describe, it, expect } from 'vitest';
import { signSessionToken, UserRole } from '../lib/auth';
import { getAllIntegrationCards } from '../lib/integrations/service';
import { runSystemHealthCheck } from '../lib/system-health';

describe('Role Security & Permission Boundary Suite (Section 22)', () => {
  it('should generate valid role-specific JWT sessions', async () => {
    const clientToken = await signSessionToken({
      userId: 'test_client_id',
      email: 'client@tradosphere.in',
      role: 'CLIENT',
      name: 'Client User',
    });
    expect(clientToken).toBeDefined();

    const employeeToken = await signSessionToken({
      userId: 'test_employee_id',
      email: 'employee@tradosphere.in',
      role: 'EMPLOYEE',
      name: 'Employee User',
    });
    expect(employeeToken).toBeDefined();

    const adminToken = await signSessionToken({
      userId: 'test_admin_id',
      email: 'admin@tradosphere.in',
      role: 'ADMIN',
      name: 'Admin User',
    });
    expect(adminToken).toBeDefined();
  });

  it('should ensure integration cards never reveal raw API keys or tokens in returned objects', async () => {
    const cards = await getAllIntegrationCards();
    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      // Check masked secrets
      for (const [key, val] of Object.entries(card.maskedSecrets)) {
        if (val) {
          expect(val.startsWith('••••')).toBe(true);
        }
      }

      // Check card serialization
      const json = JSON.stringify(card);
      expect(json).not.toContain('twm_development_session_secret');
      expect(json).not.toContain('Admin@123456');
    }
  });

  it('should audit and evaluate all 15 subsystems in system health check', async () => {
    const health = await runSystemHealthCheck();
    expect(health.subsystems).toHaveLength(15);

    const subsystemIds = health.subsystems.map((s) => s.id);
    expect(subsystemIds).toContain('APPLICATION');
    expect(subsystemIds).toContain('DATABASE');
    expect(subsystemIds).toContain('AUTHENTICATION');
    expect(subsystemIds).toContain('RBAC');
    expect(subsystemIds).toContain('MARKET_DATA');
    expect(subsystemIds).toContain('SMC');
    expect(subsystemIds).toContain('AI');
    expect(subsystemIds).toContain('EMAIL');
    expect(subsystemIds).toContain('STORAGE');
    expect(subsystemIds).toContain('NOTIFICATIONS');
    expect(subsystemIds).toContain('DOCUMENTS');
    expect(subsystemIds).toContain('BACKGROUND_JOBS');
    expect(subsystemIds).toContain('MIGRATIONS');
    expect(subsystemIds).toContain('ENVIRONMENT');
    expect(subsystemIds).toContain('SECURITY');

    expect(health.errorCount).toBe(0);
    expect(health.overallStatus).toBe('WAITING_FOR_CREDENTIALS');
    expect(health.gateMessage).toContain('Waiting for manual integration configuration');
  });
});
