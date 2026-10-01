import prisma from './prisma';

interface LogActivityParams {
  actorUserId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

/**
 * Record an audit log entry.
 * Note: Never log passwords, tokens, or unmasked sensitive PII!
 */
export async function logActivity(params: LogActivityParams) {
  try {
    const cleanDetails = { ...params.details };
    // Redact any accidental sensitive fields
    const sensitiveKeys = ['password', 'passwordhash', 'token', 'secret', 'jwt', 'apikey', 'api_key', 'auth', 'cookie', 'bearer'];
    for (const key of Object.keys(cleanDetails)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        cleanDetails[key] = '[REDACTED]';
      }
    }

    await prisma.activityLog.create({
      data: {
        actorUserId: params.actorUserId || null,
        actorRole: params.actorRole || 'SYSTEM',
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        detailsJson: JSON.stringify(cleanDetails),
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
