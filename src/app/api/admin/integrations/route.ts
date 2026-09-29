import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllIntegrationCards } from '@/lib/integrations/service';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const cards = await getAllIntegrationCards();
    return NextResponse.json({ success: true, integrations: cards });
  } catch (error: any) {
    console.error('Failed to get integration cards:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve integrations', message: error.message },
      { status: 500 }
    );
  }
}
