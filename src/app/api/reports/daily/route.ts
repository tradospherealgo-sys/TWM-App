import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { sanitizeApiError } from '@/lib/errors';

const dailyReportSchema = z.object({
  callsCount: z.number().min(0).default(0),
  contactsCount: z.number().min(0).default(0),
  newLeadsCount: z.number().min(0).default(0),
  followUpsCount: z.number().min(0).default(0),
  applicationsCount: z.number().min(0).default(0),
  documentsCount: z.number().min(0).default(0),
  conversionsCount: z.number().min(0).default(0),
  pendingWork: z.string().optional(),
  bottlenecks: z.string().optional(),
  tomorrowPriorities: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    const whereClause: Record<string, unknown> = {};

    if (user.role === 'EMPLOYEE' && user.employeeProfile) {
      whereClause.employeeId = user.employeeProfile.id;
    } else if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const reports = await prisma.employeeDailyReport.findMany({
      where: whereClause,
      include: {
        employee: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to fetch daily reports'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Forbidden: Only active employees can submit daily reports' }, { status: 403 });
  }

  if (!user.employeeProfile) {
    return NextResponse.json({ error: 'Employee profile not found' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = dailyReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid report data', details: parsed.error.flatten() }, { status: 400 });
    }

    const report = await prisma.employeeDailyReport.create({
      data: {
        employeeId: user.employeeProfile.id,
        reportDate: new Date(),
        ...parsed.data,
      },
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'DAILY_REPORT_SUBMIT',
      entityType: 'EmployeeDailyReport',
      entityId: report.id,
      details: {
        calls: parsed.data.callsCount,
        applications: parsed.data.applicationsCount,
        conversions: parsed.data.conversionsCount,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to submit report'), { status: 500 });
  }
}
