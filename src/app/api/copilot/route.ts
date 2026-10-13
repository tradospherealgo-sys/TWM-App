import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { askSharedCopilot } from '@/lib/adapters/ai-copilot';
import { logActivity } from '@/lib/audit';
import { sanitizeApiError } from '@/lib/errors';
import { checkRateLimit } from '@/lib/rate-limit';

const copilotSchema = z.object({
  query: z.string().trim().min(2, 'Query must be at least 2 characters').max(2000, 'Query exceeds maximum allowed length'),
  context: z
    .object({
      leadName: z.string().optional(),
      product: z.string().optional(),
      customerId: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  // Rate limit: 20 AI queries per minute per user
  const rateLimit = checkRateLimit(`copilot:${user.id}`, 20, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'AI Assistant query limit reached. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = copilotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query format', details: parsed.error.flatten() }, { status: 400 });
    }

    const { query, context } = parsed.data;

    // Server-enforced role context from authenticated session
    const response = await askSharedCopilot(
      query,
      {
        id: user.id,
        role: user.role,
        name: user.name,
        employeeProfile: user.employeeProfile,
        customerProfile: user.customerProfile,
      },
      context
    );

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'COPILOT_QUERY',
      entityType: 'AICopilot',
      details: {
        queryLength: query.length,
        role: user.role,
        isCompliant: response.isCompliant,
        hadWarning: Boolean(response.warning),
        providerUsed: response.providerUsed,
      },
    });

    return NextResponse.json({ success: true, response });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to process AI copilot query'), { status: 500 });
  }
}
