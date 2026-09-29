import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { runAiReviewForSignal } from '@/lib/signals/service';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
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
    console.error('Error running AI review:', error);
    return NextResponse.json({ error: error.message || 'Failed to run AI review' }, { status: 500 });
  }
}
