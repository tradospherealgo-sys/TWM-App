import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { publishSignal } from '@/lib/signals/service';
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
    return NextResponse.json({ error: 'Forbidden: Admin access required to publish signals' }, { status: 403 });
  }

  try {
    const updated = await publishSignal(params.id, user.id);
    return NextResponse.json({
      success: true,
      message: 'Signal successfully published and broadcast to active subscribers.',
      signal: updated,
    });
  } catch (error: any) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to publish signal'), { status: 400 });
  }
}
