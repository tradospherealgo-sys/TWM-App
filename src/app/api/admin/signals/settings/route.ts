import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSignalSettings, updateSignalSettings } from '@/lib/signals/service';
import { sanitizeApiError } from '@/lib/errors';

export async function GET(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const settings = await getSignalSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to get settings'), { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updated = await updateSignalSettings(body, user.id);
    return NextResponse.json({
      success: true,
      message: 'Signal settings updated successfully.',
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to update settings'), { status: 500 });
  }
}
