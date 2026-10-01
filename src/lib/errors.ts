/**
 * Centralized API Error Sanitization for TWM
 * Prevents leaks of Prisma internals, database URLs, stack traces, and internal secrets.
 */

export function sanitizeApiError(
  error: unknown,
  fallbackMessage = 'Internal server error'
): { error: string } {
  // Always log full error server-side for diagnostics
  console.error('[API_ERROR_SANITIZER]', error);

  if (!error) {
    return { error: fallbackMessage };
  }

  // Safe error messages we know can be displayed to clients
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const rawMsg = String((error as any).message);

    // Block known sensitive patterns
    const sensitivePatterns = [
      /postgresql:/i,
      /prisma/i,
      /connect/i,
      /database/i,
      /secret/i,
      /token/i,
      /key/i,
      /column/i,
      /table/i,
      /syntax/i,
      /at /i, // stack trace line
      /ECONNREFUSED/i,
      /ENOTFOUND/i,
    ];

    const hasSensitiveInfo = sensitivePatterns.some((pattern) => pattern.test(rawMsg));

    if (!hasSensitiveInfo && rawMsg.length < 150) {
      return { error: rawMsg };
    }
  }

  return { error: fallbackMessage };
}
