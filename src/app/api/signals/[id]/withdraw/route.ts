import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { withdrawSignal } from '@/lib/signals/service';
import { sanitizeApiError } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required to withdraw signals' }, { status: 403 });
  }

  try {
    let reason = 'Withdrawn by editorial desk';
    try {
      const body = await request.json();
      if (body?.reason) reason = body.reason;
    } catch {
      // Body is optional
    }

    const updated = await withdrawSignal(params.id, reason, user.id);
    return NextResponse.json({
      success: true,
      message: 'Signal withdrawn and removed from client access.',
      signal: updated,
    });
  } catch (error: any) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to withdraw signal'), { status: 500 });
  }
}
