import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

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
  if (!user || (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

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
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Only active employees can submit daily reports' }, { status: 403 });
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
    console.error('Daily report submission error:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
