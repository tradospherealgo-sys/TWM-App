import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSignalDetail, updateSignal } from '@/lib/signals/service';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const signal = await getSignalDetail(params.id, user);
    return NextResponse.json({ success: true, signal });
  } catch (error: any) {
    console.error('Error fetching signal detail:', error);
    return NextResponse.json({ error: error.message || 'Signal not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updated = await updateSignal({ id: params.id, ...body }, user.id);
    return NextResponse.json({ success: true, signal: updated });
  } catch (error: any) {
    console.error('Error updating signal:', error);
    return NextResponse.json({ error: error.message || 'Failed to update signal' }, { status: 500 });
  }
}
