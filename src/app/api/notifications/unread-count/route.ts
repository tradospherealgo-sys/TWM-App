import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { sanitizeApiError } from '@/lib/errors';
import { getUnreadNotificationCount } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  try {
    const unreadCount = await getUnreadNotificationCount(user.id);
    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    return NextResponse.json(
      sanitizeApiError(error, 'Failed to fetch unread notification count'),
      { status: 500 }
    );
  }
}
