import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export type NotificationCategory =
  | 'ACCOUNT'
  | 'KYC'
  | 'APPLICATION'
  | 'TASK'
  | 'FOLLOW_UP'
  | 'LEAD'
  | 'CUSTOMER'
  | 'SUPPORT'
  | 'SECURITY'
  | 'SYSTEM'
  | 'STAFF'
  | 'MARKET';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  category?: NotificationCategory;
  linkUrl?: string | null;
  /** Deduplication window in milliseconds (defaults to 10000ms / 10s) */
  dedupeWindowMs?: number;
}

export interface GetNotificationsParams {
  userId: string;
  unreadOnly?: boolean;
  category?: string;
  page?: number;
  limit?: number;
}

/**
 * Creates an in-app database notification with built-in recipient validation
 * and retry/duplicate protection.
 */
export async function createNotification({
  userId,
  title,
  message,
  category = 'SYSTEM',
  linkUrl = null,
  dedupeWindowMs = 10000,
}: CreateNotificationParams) {
  try {
    if (!userId || !title || !message) {
      return null;
    }

    // Verify recipient user exists and is active
    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!recipient || recipient.status === 'DEACTIVATED' || recipient.status === 'SUSPENDED') {
      return null;
    }

    // Duplicate protection: check if identical notification was created within the dedupe window
    if (dedupeWindowMs > 0) {
      const windowStart = new Date(Date.now() - dedupeWindowMs);
      const duplicate = await prisma.notification.findFirst({
        where: {
          userId,
          title,
          linkUrl: linkUrl || null,
          createdAt: { gte: windowStart },
        },
      });

      if (duplicate) {
        return duplicate;
      }
    }

    // Create the notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        category,
        linkUrl: linkUrl || null,
        isRead: false,
      },
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Non-blocking: avoid rolling back unrelated business transactions
    return null;
  }
}

/**
 * Dispatches an in-app notification to all active administrators.
 */
export async function notifyAdmins({
  title,
  message,
  category = 'SYSTEM',
  linkUrl = null,
}: Omit<CreateNotificationParams, 'userId'>) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    const results = await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          title,
          message,
          category,
          linkUrl,
        })
      )
    );

    return results.filter(Boolean);
  } catch (error) {
    console.error('Failed to notify admins:', error);
    return [];
  }
}

/**
 * Dispatches an in-app notification to an employee by employee profile ID.
 */
export async function notifyEmployee({
  employeeId,
  title,
  message,
  category = 'SYSTEM',
  linkUrl = null,
}: {
  employeeId: string;
  title: string;
  message: string;
  category?: NotificationCategory;
  linkUrl?: string | null;
}) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { userId: true, user: { select: { status: true } } },
    });

    if (!employee || !employee.userId || employee.user?.status !== 'ACTIVE') {
      return null;
    }

    return await createNotification({
      userId: employee.userId,
      title,
      message,
      category,
      linkUrl,
    });
  } catch (error) {
    console.error('Failed to notify employee:', error);
    return null;
  }
}

/**
 * Retrieves paginated notifications strictly isolated to the specified userId.
 */
export async function getUserNotifications({
  userId,
  unreadOnly = false,
  category,
  page = 1,
  limit = 20,
}: GetNotificationsParams) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const whereClause: Record<string, unknown> = {
    userId,
  };

  if (unreadOnly) {
    whereClause.isRead = false;
  }

  if (category && category !== 'ALL') {
    whereClause.category = category;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    }),
    prisma.notification.count({ where: whereClause }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
      hasMore: skip + notifications.length < total,
    },
    unreadCount,
  };
}

/**
 * Marks a specific notification as read, ensuring it belongs to the authenticated user.
 */
export async function markNotificationAsRead(userId: string, notificationId: string) {
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!existing) {
    return { success: false, notFound: true };
  }

  if (existing.isRead) {
    return { success: true, notification: existing };
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return { success: true, notification: updated };
}

/**
 * Marks all unread notifications as read for a given user.
 */
export async function markAllNotificationsAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { success: true, count: result.count };
}

/**
 * Fast unread counter for navigation badges.
 */
export async function getUnreadNotificationCount(userId: string) {
  return await prisma.notification.count({
    where: { userId, isRead: false },
  });
}
