import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sanitizeApiError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
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
          include: {
            documents: {
              select: { id: true, title: true, documentType: true, status: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          select: {
            id: true,
            title: true,
            documentType: true,
            status: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          include: {
            assignedEmployee: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        followUps: {
          include: {
            employee: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { scheduledAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Horizontal access control:
    // If user is EMPLOYEE, ensure they are either assigned to this customer or the customer is unassigned
    if (
      user.role === 'EMPLOYEE' &&
      customer.assignedEmployeeId &&
      customer.assignedEmployeeId !== user.employeeProfile?.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden: You are not authorized to access this customer record' },
        { status: 403 }
      );
    }

    // Fetch related activity logs for this user/customer
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        OR: [
          { entityId: customer.id },
          { entityId: customer.userId },
          { actorUserId: customer.userId },
        ],
      },
      select: {
        id: true,
        action: true,
        entityType: true,
        detailsJson: true,
        createdAt: true,
        actorRole: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Build unified chronological interaction history
    type TimelineItem = {
      id: string;
      type: 'REGISTRATION' | 'APPLICATION' | 'DOCUMENT' | 'FOLLOWUP' | 'TASK' | 'ACTIVITY';
      title: string;
      description?: string;
      timestamp: Date;
      status?: string;
    };

    const timeline: TimelineItem[] = [];

    // Registration event
    timeline.push({
      id: `reg-${customer.id}`,
      type: 'REGISTRATION',
      title: 'Customer Profile Initialized',
      description: `Customer code ${customer.customerCode} registered. KYC Status: ${customer.kycStatus}`,
      timestamp: customer.createdAt,
      status: customer.kycStatus,
    });

    // Application events
    for (const app of customer.applications) {
      timeline.push({
        id: `app-${app.id}`,
        type: 'APPLICATION',
        title: `Application #${app.applicationNumber} (${app.productCategory})`,
        description: app.notes || undefined,
        timestamp: app.createdAt,
        status: app.status,
      });
    }

    // Document events
    for (const doc of customer.documents) {
      timeline.push({
        id: `doc-${doc.id}`,
        type: 'DOCUMENT',
        title: `KYC Document: ${doc.title} (${doc.documentType})`,
        description: doc.notes || undefined,
        timestamp: doc.createdAt,
        status: doc.status,
      });
    }

    // Follow-up events
    for (const fu of customer.followUps) {
      timeline.push({
        id: `fu-${fu.id}`,
        type: 'FOLLOWUP',
        title: `Follow-up: ${fu.status}`,
        description: fu.outcome ? `Outcome: ${fu.outcome}. Notes: ${fu.notes || 'None'}` : fu.notes || undefined,
        timestamp: fu.scheduledAt,
        status: fu.status,
      });
    }

    // Task events
    for (const t of customer.tasks) {
      timeline.push({
        id: `task-${t.id}`,
        type: 'TASK',
        title: `Task: ${t.title}`,
        description: t.description || undefined,
        timestamp: t.createdAt,
        status: t.status,
      });
    }

    // Activity log events
    for (const log of activityLogs) {
      timeline.push({
        id: `log-${log.id}`,
        type: 'ACTIVITY',
        title: `Audit Action: ${log.action}`,
        description: log.detailsJson,
        timestamp: log.createdAt,
      });
    }

    // Sort descending by timestamp
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      customer,
      timeline,
    });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to fetch customer details'), { status: 500 });
  }
}
