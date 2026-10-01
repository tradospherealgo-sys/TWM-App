import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { sanitizeApiError } from '@/lib/errors';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '@/lib/notifications';

const updateNotificationSchema = z
  .object({
    id: z.string().optional(),
    isRead: z.boolean().optional(),
    markAllRead: z.boolean().optional(),
  })
  .refine((data) => data.id || data.markAllRead, {
    message: 'Either notification id or markAllRead must be provided',
  });

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const category = searchParams.get('category') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Strictly isolated to the authenticated user from session
    const result = await getUserNotifications({
      userId: user.id,
      unreadOnly,
      category,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      notifications: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    return NextResponse.json(
      sanitizeApiError(error, 'Failed to fetch notifications'),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, markAllRead } = parsed.data;

    if (markAllRead) {
      const result = await markAllNotificationsAsRead(user.id);
      const unreadCount = await getUnreadNotificationCount(user.id);
      return NextResponse.json({
        success: true,
        markedCount: result.count,
        unreadCount,
      });
    }

    if (id) {
      const result = await markNotificationAsRead(user.id, id);
      if (result.notFound) {
        return NextResponse.json(
          { error: 'Notification not found or access denied' },
          { status: 404 }
        );
      }

      const unreadCount = await getUnreadNotificationCount(user.id);
      return NextResponse.json({
        success: true,
        notification: result.notification,
        unreadCount,
      });
    }

    return NextResponse.json({ error: 'No operation specified' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      sanitizeApiError(error, 'Failed to update notification state'),
      { status: 500 }
    );
  }
}
