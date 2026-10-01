import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { runAiReviewForSignal } from '@/lib/signals/service';
import { sanitizeApiError } from '@/lib/errors';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const updated = await runAiReviewForSignal(params.id, user.id);
    return NextResponse.json({
      success: true,
      message: 'AI Review Team (Atlas, Vector, Orion, Sentinel, Aegis, Nexus) analysis complete.',
      signal: updated,
    });
  } catch (error: any) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to run AI review'), { status: 500 });
  }
}
