import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { generateUniqueCustomerCode } from '@/lib/onboarding';
import { logActivity } from '@/lib/audit';
import { notifyEmployee } from '@/lib/notifications';

const createApplicationSchema = z.object({
  productCategory: z.enum(['DEMAT', 'MUTUAL_FUND', 'SIP', 'IPO', 'INSURANCE', 'LOAN']),
  productCode: z.string().min(1),
  details: z.record(z.unknown()).default({}),
  notes: z.string().optional(),
  leadId: z.string().optional(),
  customerId: z.string().optional(),
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

    const { productCategory, productCode, details, notes, leadId, customerId } = parsed.data;

    let targetCustomerId: string;
    let targetEmployeeId: string | null = null;
    let convertedLeadId: string | null = null;

    if (user.role === 'CLIENT') {
      // Client can only create applications for themselves
      let customer = user.customerProfile;
      if (!customer) {
        const customerCode = await generateUniqueCustomerCode(prisma);
        customer = await prisma.customer.create({
          data: {
            userId: user.id,
            customerCode,
            kycStatus: 'PENDING',
          },
        });
      }
      targetCustomerId = customer.id;
      targetEmployeeId = customer.assignedEmployeeId;
    } else {
      // Staff (EMPLOYEE or ADMIN) creating application for customer or converting lead
      if (leadId) {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) {
          return NextResponse.json({ error: 'Lead not found for conversion' }, { status: 404 });
        }

        convertedLeadId = lead.id;
        targetEmployeeId = lead.assignedEmployeeId || (user.employeeProfile ? user.employeeProfile.id : null);

        // Check if customer already exists matching lead email or phone
        let existingUser = lead.email
          ? await prisma.user.findUnique({
              where: { email: lead.email.toLowerCase().trim() },
              include: { customerProfile: true },
            })
          : null;

        if (!existingUser && lead.phone) {
          existingUser = await prisma.user.findFirst({
            where: { phone: lead.phone.trim() },
            include: { customerProfile: true },
          });
        }

        if (existingUser && existingUser.customerProfile) {
          targetCustomerId = existingUser.customerProfile.id;
        } else if (existingUser) {
          const customerCode = await generateUniqueCustomerCode(prisma);
          const customer = await prisma.customer.create({
            data: {
              userId: existingUser.id,
              customerCode,
              kycStatus: 'PENDING',
              assignedEmployeeId: targetEmployeeId,
            },
          });
          targetCustomerId = customer.id;
        } else {
          // Create new User and Customer profile atomically
          const tempPasswordHash = await hashPassword(`Temp${Date.now()}!Secret`);
          const customerCode = await generateUniqueCustomerCode(prisma);
          const createdUser = await prisma.user.create({
            data: {
              name: lead.name,
              email: lead.email ? lead.email.toLowerCase().trim() : `lead_${lead.id}@twm-internal.in`,
              phone: lead.phone,
              passwordHash: tempPasswordHash,
              role: 'CLIENT',
              status: 'ACTIVE',
              customerProfile: {
                create: {
                  customerCode,
                  kycStatus: 'PENDING',
                  assignedEmployeeId: targetEmployeeId,
                },
              },
            },
            include: { customerProfile: true },
          });

          targetCustomerId = createdUser.customerProfile!.id;
        }

        // Update lead status to APPLICATION
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: 'APPLICATION' },
        });

        await logActivity({
          actorUserId: user.id,
          actorRole: user.role,
          action: 'LEAD_CONVERT_APPLICATION',
          entityType: 'Lead',
          entityId: lead.id,
          details: {
            leadName: lead.name,
            productCategory,
            productCode,
            customerId: targetCustomerId,
          },
        });
      } else if (customerId) {
        const customer = await prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        targetCustomerId = customer.id;
        targetEmployeeId = customer.assignedEmployeeId || (user.employeeProfile ? user.employeeProfile.id : null);
      } else {
        return NextResponse.json({ error: 'Either leadId or customerId is required' }, { status: 400 });
      }
    }

    // Default to an active employee if unassigned
    if (!targetEmployeeId) {
      const activeEmployee = await prisma.employee.findFirst({ where: { status: 'ACTIVE' } });
      targetEmployeeId = activeEmployee?.id || null;
    }

    // Generate collision-resistant application number
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const applicationNumber = `TWM-APP-${year}-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const application = await prisma.application.create({
      data: {
        applicationNumber,
        customerId: targetCustomerId,
        productCategory,
        productCode,
        assignedEmployeeId: targetEmployeeId,
        status: 'NEW',
        detailsJson: JSON.stringify(details),
        notes: notes || `Application submitted for ${productCode}${convertedLeadId ? ' from Lead conversion' : ''}`,
      },
      include: {
        customer: {
          include: { user: { select: { name: true, email: true } } },
        },
        assignedEmployee: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'APPLICATION_CREATE',
      entityType: 'Application',
      entityId: application.id,
      details: {
        applicationNumber: application.applicationNumber,
        productCategory,
        productCode,
        customerId: targetCustomerId,
      },
    });

    // Notify customer user
    const customerRecord = await prisma.customer.findUnique({
      where: { id: targetCustomerId },
      select: { userId: true },
    });

    if (customerRecord) {
      await prisma.notification.create({
        data: {
          userId: customerRecord.userId,
          title: 'Application Received',
          message: `Your application #${application.applicationNumber} for ${productCategory} has been created and assigned to our desk.`,
          category: 'APPLICATION',
          linkUrl: `/applications`,
        },
      });
    }

    if (targetEmployeeId && targetEmployeeId !== user.employeeProfile?.id) {
      await notifyEmployee({
        employeeId: targetEmployeeId,
        title: `Application Assigned: #${application.applicationNumber}`,
        message: `Application for ${productCategory} has been assigned to your desk.`,
        category: 'APPLICATION',
        linkUrl: '/employee/applications',
      });
    }

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
