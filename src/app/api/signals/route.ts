import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSignalsList, createSignal } from '@/lib/signals/service';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const signals = await getSignalsList(user, { category, status, search });
    return NextResponse.json({ success: true, signals });
  } catch (error: any) {
    console.error('Error fetching signals:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch signals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required to create signals' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      title,
      category,
      subcategory,
      instrument,
      exchange,
      symbol,
      summary,
      content,
      source,
      provider,
      author,
      supportingInfo,
      validityType,
      validUntil,
      riskLevel,
    } = body;

    if (!title || !category || !summary || !content || !source || !provider || !author) {
      return NextResponse.json(
        { error: 'Missing required signal fields (title, category, summary, content, source, provider, author)' },
        { status: 400 }
      );
    }

    const signal = await createSignal(
      {
        title,
        category,
        subcategory,
        instrument,
        exchange,
        symbol,
        summary,
        content,
        source,
        provider,
        author,
        supportingInfo,
        validityType,
        validUntil,
        riskLevel,
      },
      user.id
    );

    return NextResponse.json({ success: true, signal });
  } catch (error: any) {
    console.error('Error creating signal:', error);
    return NextResponse.json({ error: error.message || 'Failed to create signal' }, { status: 500 });
  }
}
