import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const watchlistSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(50),
  symbols: z.array(z.string()).default([]),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const watchlists = await prisma.watchlist.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const parsed = watchlists.map((w) => ({
    id: w.id,
    name: w.name,
    symbols: JSON.parse(w.symbolsJson || '[]') as string[],
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }));

  return NextResponse.json({ watchlists: parsed });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = watchlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { id, name, symbols } = parsed.data;

    if (id) {
      // Update existing watchlist owned by user
      const existing = await prisma.watchlist.findFirst({
        where: { id, userId: user.id },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
      }

      const updated = await prisma.watchlist.update({
        where: { id },
        data: {
          name,
          symbolsJson: JSON.stringify(symbols),
        },
      });

      return NextResponse.json({
        watchlist: {
          id: updated.id,
          name: updated.name,
          symbols: JSON.parse(updated.symbolsJson) as string[],
        },
      });
    } else {
      // Create new watchlist
      const created = await prisma.watchlist.create({
        data: {
          userId: user.id,
          name,
          symbolsJson: JSON.stringify(symbols),
        },
      });

      return NextResponse.json({
        watchlist: {
          id: created.id,
          name: created.name,
          symbols: JSON.parse(created.symbolsJson) as string[],
        },
      });
    }
  } catch (error) {
    console.error('Watchlist save error:', error);
    return NextResponse.json({ error: 'Failed to save watchlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Watchlist ID required' }, { status: 400 });
  }

  const existing = await prisma.watchlist.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
  }

  await prisma.watchlist.delete({ where: { id } });

  return NextResponse.json({ success: true, message: 'Watchlist deleted' });
}
