import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { closeSignal } from '@/lib/signals/service';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required to close signals' }, { status: 403 });
  }

  try {
    const updated = await closeSignal(params.id, user.id);
    return NextResponse.json({
      success: true,
      message: 'Signal marked as CLOSED.',
      signal: updated,
    });
  } catch (error: any) {
    console.error('Error closing signal:', error);
    return NextResponse.json({ error: error.message || 'Failed to close signal' }, { status: 500 });
  }
}
