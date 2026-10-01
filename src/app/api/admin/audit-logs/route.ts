import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sanitizeApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200);

    const whereClause: Record<string, unknown> = {};
    if (action) whereClause.action = action;
    if (entityType) whereClause.entityType = entityType;

    const logs = await prisma.activityLog.findMany({
      where: whereClause,
      include: {
        actorUser: {
          select: { name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to fetch audit logs'), { status: 500 });
  }
}
