import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

const createApplicationSchema = z.object({
  productCategory: z.enum(['DEMAT', 'MUTUAL_FUND', 'SIP', 'IPO', 'INSURANCE', 'LOAN']),
  productCode: z.string().min(1),
  details: z.record(z.unknown()).default({}),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const productFilter = searchParams.get('productCategory');

  // Role-based query filter
  const whereClause: Record<string, unknown> = {};

  if (user.role === 'CLIENT') {
    if (!user.customerProfile) {
      return NextResponse.json({ applications: [] });
    }
    whereClause.customerId = user.customerProfile.id;
  } else if (user.role === 'EMPLOYEE') {
    if (user.employeeProfile) {
      // Employee sees assigned applications
      whereClause.assignedEmployeeId = user.employeeProfile.id;
    }
  } // ADMIN sees all applications

  if (statusFilter) {
    whereClause.status = statusFilter;
  }
  if (productFilter) {
    whereClause.productCategory = productFilter;
  }

  const applications = await prisma.application.findMany({
    where: whereClause,
    include: {
      customer: {
        include: {
          user: {
            select: { name: true, email: true, phone: true },
          },
        },
      },
      assignedEmployee: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
      documents: {
        select: { id: true, title: true, documentType: true, status: true, fileUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ applications });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid application data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { productCategory, productCode, details, notes } = parsed.data;

    // Ensure user has a customer profile
    let customer = await prisma.customer.findUnique({
      where: { userId: user.id },
    });

    if (!customer) {
      // Auto-create customer profile if missing
      const count = await prisma.customer.count();
      customer = await prisma.customer.create({
        data: {
          userId: user.id,
          customerCode: `TWM-CUST-${1000 + count + 1}`,
          kycStatus: 'PENDING',
        },
      });
    }

    // Find default or assigned employee
    let assignedEmployeeId = customer.assignedEmployeeId;
    if (!assignedEmployeeId) {
      const activeEmployee = await prisma.employee.findFirst({
        where: { status: 'ACTIVE' },
      });
      if (activeEmployee) {
        assignedEmployeeId = activeEmployee.id;
        // Associate with customer
        await prisma.customer.update({
          where: { id: customer.id },
          data: { assignedEmployeeId },
        });
      }
    }

    // Generate unique application number
    const appCount = await prisma.application.count();
    const year = new Date().getFullYear();
    const applicationNumber = `TWM-APP-${year}-${String(appCount + 1).padStart(4, '0')}`;

    const application = await prisma.application.create({
      data: {
        applicationNumber,
        customerId: customer.id,
        productCategory,
        productCode,
        assignedEmployeeId,
        status: 'NEW',
        detailsJson: JSON.stringify(details),
        notes: notes || `Application submitted online for ${productCode}`,
      },
      include: {
        customer: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Application Received',
        message: `Your application #${applicationNumber} for ${productCategory} has been created and assigned to our desk.`,
        category: 'APPLICATION',
        linkUrl: `/applications`,
      },
    });

    // If employee assigned, create a task for the employee
    if (assignedEmployeeId) {
      await prisma.task.create({
        data: {
          title: `Process New Application #${applicationNumber} (${productCategory})`,
          description: `Verify KYC documents and initiate onboarding for ${user.name}.`,
          customerId: customer.id,
          assignedEmployeeId,
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h
        },
      });
    }

    // Write audit log
    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'APPLICATION_CREATE',
      entityType: 'Application',
      entityId: application.id,
      details: { applicationNumber, productCategory, productCode },
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
