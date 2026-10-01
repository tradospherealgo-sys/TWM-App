import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { sanitizeApiError } from '@/lib/errors';

const updateProductSchema = z.object({
  id: z.string(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { category: 'asc' },
    });
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to fetch products'), { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid product update', details: parsed.error.flatten() }, { status: 400 });
    }

    const { id, isActive, description } = parsed.data;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(description && { description }),
      },
    });

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'ADMIN_PRODUCT_UPDATE',
      entityType: 'Product',
      entityId: id,
      details: { productCode: existing.code, isActive },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to update product'), { status: 500 });
  }
}
