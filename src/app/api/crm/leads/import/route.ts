import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { sanitizeApiError } from '@/lib/errors';
import { notifyEmployee } from '@/lib/notifications';

const leadRowSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().trim().min(10, 'Valid 10-digit phone required').max(15).regex(/^[0-9+\s-]{10,15}$/, 'Invalid phone format'),
  email: z.string().trim().email('Invalid email').max(100).optional().or(z.literal('')),
  productInterest: z.string().max(50).default('GENERAL'),
  source: z.string().max(50).default('CSV_IMPORT'),
  notes: z.string().max(1000).optional(),
  assignedEmployeeId: z.string().optional(),
});

const importPayloadSchema = z.object({
  leads: z.array(z.record(z.unknown())).min(1, 'At least one lead row is required').max(500, 'Batch limit is 500 rows'),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN' && user.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = importPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload format', details: parsed.error.flatten() }, { status: 400 });
    }

    const rawRows = parsed.data.leads;
    const errors: Array<{ row: number; name?: string; phone?: string; message: string }> = [];
    const validLeadsToInsert: any[] = [];

    // Pre-fetch existing lead phones and emails for efficient duplicate detection
    const existingLeads = await prisma.lead.findMany({
      select: { phone: true, email: true },
    });

    const seenPhonesInDb = new Set(existingLeads.map((l) => l.phone.replace(/[^0-9+]/g, '')));
    const seenEmailsInDb = new Set(existingLeads.filter((l) => l.email).map((l) => l.email!.toLowerCase().trim()));

    // Track within-batch duplicates
    const seenPhonesInBatch = new Set<string>();

    for (let i = 0; i < rawRows.length; i++) {
      const rowNum = i + 1;
      const raw = rawRows[i];

      const rowParsed = leadRowSchema.safeParse({
        name: String(raw.name || raw.Name || raw['Full Name'] || '').trim(),
        phone: String(raw.phone || raw.Phone || raw['Mobile'] || raw['Contact'] || '').trim(),
        email: raw.email || raw.Email || raw['Email Address'] ? String(raw.email || raw.Email || raw['Email Address']).trim() : '',
        productInterest: raw.productInterest || raw.Product || raw['Product Interest'] ? String(raw.productInterest || raw.Product || raw['Product Interest']).toUpperCase().trim() : 'GENERAL',
        source: raw.source || raw.Source ? String(raw.source || raw.Source).trim() : 'CSV_IMPORT',
        notes: raw.notes || raw.Notes ? String(raw.notes || raw.Notes).trim() : undefined,
        assignedEmployeeId: raw.assignedEmployeeId || raw.assignedEmployee || undefined,
      });

      if (!rowParsed.success) {
        const firstError = Object.values(rowParsed.error.flatten().fieldErrors)[0]?.[0] || 'Invalid data format';
        errors.push({
          row: rowNum,
          name: String(raw.name || ''),
          phone: String(raw.phone || ''),
          message: firstError,
        });
        continue;
      }

      const cleanPhone = rowParsed.data.phone.replace(/[^0-9+]/g, '');
      const cleanEmail = rowParsed.data.email ? rowParsed.data.email.toLowerCase().trim() : null;

      // Duplicate check against DB
      if (seenPhonesInDb.has(cleanPhone)) {
        errors.push({
          row: rowNum,
          name: rowParsed.data.name,
          phone: cleanPhone,
          message: 'Duplicate: Mobile number already exists in CRM database',
        });
        continue;
      }

      if (cleanEmail && seenEmailsInDb.has(cleanEmail)) {
        errors.push({
          row: rowNum,
          name: rowParsed.data.name,
          phone: cleanPhone,
          message: 'Duplicate: Email address already registered in CRM database',
        });
        continue;
      }

      // Duplicate check within batch
      if (seenPhonesInBatch.has(cleanPhone)) {
        errors.push({
          row: rowNum,
          name: rowParsed.data.name,
          phone: cleanPhone,
          message: 'Duplicate: Mobile number appears multiple times in uploaded file',
        });
        continue;
      }

      seenPhonesInBatch.add(cleanPhone);

      validLeadsToInsert.push({
        name: rowParsed.data.name,
        phone: cleanPhone,
        email: cleanEmail,
        productInterest: rowParsed.data.productInterest,
        source: rowParsed.data.source,
        notes: rowParsed.data.notes || null,
        assignedEmployeeId: rowParsed.data.assignedEmployeeId || null,
        status: 'NEW_LEAD',
      });
    }

    // Insert valid leads
    let insertedCount = 0;
    if (validLeadsToInsert.length > 0) {
      for (const leadData of validLeadsToInsert) {
        await prisma.lead.create({ data: leadData });
        insertedCount++;
      }
    }

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'LEAD_CSV_IMPORT',
      entityType: 'Lead',
      details: {
        totalRows: rawRows.length,
        importedCount: insertedCount,
        errorCount: errors.length,
      },
    });

    return NextResponse.json({
      success: true,
      totalRows: rawRows.length,
      importedCount: insertedCount,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to import CSV leads'), { status: 500 });
  }
}
