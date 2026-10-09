import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllIntegrationCards } from '@/lib/integrations/service';
import { sanitizeApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const cards = await getAllIntegrationCards();
    return NextResponse.json({ success: true, integrations: cards });
  } catch (error: any) {
    console.error('[API_ADMIN_INTEGRATIONS_ERROR]', error);
    try {
      const fallbackCards = await getAllIntegrationCards();
      return NextResponse.json({ success: true, integrations: fallbackCards });
    } catch {
      return NextResponse.json(sanitizeApiError(error, 'Failed to retrieve integrations'), { status: 500 });
    }
  }
}
