import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { askEmployeeCopilot } from '@/lib/adapters/ai-copilot';
import { logActivity } from '@/lib/audit';

const copilotSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters'),
  context: z
    .object({
      leadName: z.string().optional(),
      product: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = copilotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 });
    }

    const { query, context } = parsed.data;
    const response = await askEmployeeCopilot(query, context);

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'COPILOT_QUERY',
      entityType: 'AICopilot',
      details: {
        queryLength: query.length,
        isCompliant: response.isCompliant,
        hadWarning: Boolean(response.warning),
      },
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Copilot error:', error);
    return NextResponse.json({ error: 'Failed to process AI copilot query' }, { status: 500 });
  }
}
