import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSignalSettings, updateSignalSettings } from '@/lib/signals/service';

export async function GET(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const settings = await getSignalSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error getting signal settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to get settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
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
    console.error('Error updating signal settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
