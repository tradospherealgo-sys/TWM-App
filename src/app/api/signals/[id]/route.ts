import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSignalDetail, updateSignal } from '@/lib/signals/service';
import { sanitizeApiError } from '@/lib/errors';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  try {
    const signal = await getSignalDetail(params.id, user);
    return NextResponse.json({ success: true, signal });
  } catch (error: any) {
    return NextResponse.json(sanitizeApiError(error, 'Signal not found'), { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
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
    const body = await request.json();
    const updated = await updateSignal({ id: params.id, ...body }, user.id);
    return NextResponse.json({ success: true, signal: updated });
  } catch (error: any) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to update signal'), { status: 500 });
  }
}
