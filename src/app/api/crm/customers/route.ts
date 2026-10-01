import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sanitizeApiError } from '@/lib/errors';

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
    const search = searchParams.get('search')?.trim();
    const kycStatus = searchParams.get('kycStatus');
    const employeeId = searchParams.get('employeeId');

    const whereClause: Record<string, unknown> = {};

    // Horizontal isolation: employee sees assigned customers or unassigned
    if (user.role === 'EMPLOYEE' && user.employeeProfile) {
      const viewAll = searchParams.get('all') === 'true';
      if (!viewAll) {
        whereClause.OR = [
          { assignedEmployeeId: user.employeeProfile.id },
          { assignedEmployeeId: null },
        ];
      }
    } else if (employeeId) {
      whereClause.assignedEmployeeId = employeeId;
    }

    if (kycStatus) {
      whereClause.kycStatus = kycStatus;
    }

    if (search) {
      whereClause.OR = [
        { customerCode: { contains: search } },
        { pan: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { user: { phone: { contains: search } } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        assignedEmployee: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        applications: {
          select: {
            id: true,
            applicationNumber: true,
            productCategory: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        documents: {
          select: {
            id: true,
            title: true,
            documentType: true,
            status: true,
          },
        },
        tasks: {
          where: { status: { not: 'COMPLETED' } },
          select: { id: true, title: true, priority: true, dueDate: true },
        },
        followUps: {
          orderBy: { scheduledAt: 'desc' },
          take: 2,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, customers });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to fetch customers'), { status: 500 });
  }
}
