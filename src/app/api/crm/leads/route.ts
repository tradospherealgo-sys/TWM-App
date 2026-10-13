import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { sanitizeApiError } from '@/lib/errors';
import { notifyEmployee } from '@/lib/notifications';
import { checkRateLimit } from '@/lib/rate-limit';

const createLeadSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().trim().min(10, 'Valid phone required').max(15).regex(/^[0-9+\s-]{10,15}$/, 'Invalid phone number format'),
  email: z.string().trim().email('Invalid email address').max(100).optional().or(z.literal('')),
  source: z.string().max(50).default('DIRECT'),
  productInterest: z.string().max(50).default('GENERAL'),
  notes: z.string().max(1000).optional(),
  assignedEmployeeId: z.string().max(50).optional(),
  website_url: z.string().max(0, 'Bot detected').optional().or(z.literal('')), // Honeypot field
});

const updateLeadSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(10).max(15).optional(),
  email: z.string().trim().email().max(100).optional().or(z.literal('')),
  productInterest: z.string().max(50).optional(),
  source: z.string().max(50).optional(),
  status: z
    .enum([
      'NEW_LEAD',
      'CONTACTED',
      'INTERESTED',
      'FOLLOW_UP',
      'DOCUMENTS_REQUIRED',
      'APPLICATION',
      'SUBMITTED',
      'COMPLETED',
      'LOST_CLOSED',
    ])
    .optional(),
  notes: z.string().max(2000).optional(),
  lostReason: z.string().max(500).optional(),
  assignedEmployeeId: z.string().nullable().optional(),
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
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const source = searchParams.get('source');
    const productInterest = searchParams.get('productInterest');
    const employeeId = searchParams.get('employeeId');
    const unassigned = searchParams.get('unassigned') === 'true';

    const whereClause: Record<string, unknown> = {};

    if (user.role === 'EMPLOYEE' && user.employeeProfile) {
      // Optional filter: assigned to this employee or unassigned
      const viewAll = searchParams.get('all') === 'true';
      if (!viewAll) {
        whereClause.OR = [
          { assignedEmployeeId: user.employeeProfile.id },
          { assignedEmployeeId: null },
        ];
      }
    } else if (user.role === 'ADMIN') {
      if (unassigned) {
        whereClause.assignedEmployeeId = null;
      } else if (employeeId) {
        whereClause.assignedEmployeeId = employeeId;
      }
    }

    if (status) {
      whereClause.status = status;
    }
    if (source) {
      whereClause.source = source;
    }
    if (productInterest) {
      whereClause.productInterest = productInterest;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        assignedEmployee: {
          include: { user: { select: { name: true, email: true } } },
        },
        tasks: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { dueDate: 'asc' },
        },
        followUps: {
          orderBy: { scheduledAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to fetch leads'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // 1. Abuse Protection: Rate limit lead submissions by client IP (5 per minute)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const rateLimit = checkRateLimit(`lead_submit:${ip}`, 5, 60000);
  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.ceil(rateLimit.retryAfterMs / 1000);
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute and try again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      }
    );
  }

  const user = await getCurrentUser();

  try {
    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid lead data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, phone, email, source, productInterest, notes, assignedEmployeeId, website_url } = parsed.data;

    // Honeypot anti-bot validation
    if (website_url && website_url.length > 0) {
      return NextResponse.json({ error: 'Automated submission rejected' }, { status: 400 });
    }

    // Determine effective source and assignment:
    // Only staff can explicitly set internal source or assign to specific employee
    const isStaff = user && (user.role === 'EMPLOYEE' || user.role === 'ADMIN');
    const effectiveSource = isStaff ? (source || 'DIRECT') : (user ? 'PORTAL_CLIENT' : 'WEBSITE');
    const effectiveAssignedId = isStaff
      ? (assignedEmployeeId || (user.role === 'EMPLOYEE' ? user.employeeProfile?.id : null))
      : null;

    const cleanPhone = phone.replace(/[^0-9+]/g, '');

    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.toLowerCase().trim() : null,
        source: effectiveSource,
        productInterest: productInterest || 'GENERAL',
        notes: notes ? notes.trim() : null,
        assignedEmployeeId: effectiveAssignedId,
        status: 'NEW_LEAD',
      },
    });

    await logActivity({
      actorUserId: user ? user.id : null,
      actorRole: user ? user.role : 'ANONYMOUS',
      action: 'LEAD_CREATE',
      entityType: 'Lead',
      entityId: lead.id,
      details: { name: lead.name, productInterest: lead.productInterest, source: effectiveSource },
    });

    if (lead.assignedEmployeeId && user?.employeeProfile?.id !== lead.assignedEmployeeId) {
      await notifyEmployee({
        employeeId: lead.assignedEmployeeId,
        title: 'New Lead Assigned',
        message: `Lead "${lead.name}" (${lead.productInterest}) has been assigned to you.`,
        category: 'LEAD',
        linkUrl: '/employee/leads',
      });
    }

    // Return minimal response for public/client submissions, full record for staff
    if (!isStaff) {
      return NextResponse.json({
        success: true,
        lead: {
          id: lead.id,
          name: lead.name,
        },
      });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to create lead'), { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { id, name, phone, email, productInterest, source, status, notes, lostReason, assignedEmployeeId } = parsed.data;

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Horizontal access & assignment permission rules:
    // 1. If assignedEmployeeId is provided:
    //    - ADMIN can assign or reassign any lead to any employee.
    //    - EMPLOYEE can only assign an unassigned lead (existing.assignedEmployeeId === null) to themselves.
    //    - EMPLOYEE cannot reassign another employee's lead to anyone else.
    const isReassigning = assignedEmployeeId !== undefined && assignedEmployeeId !== existing.assignedEmployeeId;
    if (isReassigning) {
      if (user.role === 'EMPLOYEE') {
        const myEmpId = user.employeeProfile?.id;
        const isClaimingUnassigned = existing.assignedEmployeeId === null && assignedEmployeeId === myEmpId;
        if (!isClaimingUnassigned) {
          return NextResponse.json(
            { error: 'Forbidden: Only administrators can reassign leads between staff' },
            { status: 403 }
          );
        }
      }
    }

    // 2. If employee is updating status or notes:
    //    - Must be assigned to this lead, or lead is unassigned, or user is ADMIN
    if (user.role === 'EMPLOYEE' && existing.assignedEmployeeId && existing.assignedEmployeeId !== user.employeeProfile?.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update leads assigned to you' },
        { status: 403 }
      );
    }

    let notesContent: string | undefined = undefined;
    if (lostReason) {
      notesContent = `${existing.notes || ''}\n[${new Date().toISOString()}] LOST REASON: ${lostReason}${notes ? ' - ' + notes : ''}`.trim();
    } else if (notes) {
      notesContent = `${existing.notes || ''}\n[${new Date().toISOString()}] ${notes}`.trim();
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.replace(/[^0-9+]/g, '') }),
        ...(email !== undefined && { email: email ? email.toLowerCase().trim() : null }),
        ...(productInterest && { productInterest }),
        ...(source && { source }),
        ...(status && { status }),
        ...(notesContent !== undefined && { notes: notesContent }),
        ...(assignedEmployeeId !== undefined && { assignedEmployeeId }),
      },
    });

    if (isReassigning) {
      await logActivity({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'LEAD_ASSIGN',
        entityType: 'Lead',
        entityId: updated.id,
        details: {
          previousAssignee: existing.assignedEmployeeId,
          newAssignee: assignedEmployeeId,
          leadName: existing.name,
        },
      });

      if (assignedEmployeeId && assignedEmployeeId !== user.employeeProfile?.id) {
        await notifyEmployee({
          employeeId: assignedEmployeeId,
          title: 'Lead Assigned to You',
          message: `Lead "${existing.name}" (${existing.productInterest}) has been assigned to you.`,
          category: 'LEAD',
          linkUrl: '/employee/leads',
        });
      }
    }

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'LEAD_UPDATE',
      entityType: 'Lead',
      entityId: updated.id,
      details: { previousStatus: existing.status, newStatus: status },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to update lead'), { status: 500 });
  }
}
