import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { runSystemHealthCheck } from '@/lib/system-health';
import { sanitizeApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const report = await runSystemHealthCheck();
    return NextResponse.json({ success: true, health: report });
  } catch (error: any) {
    return NextResponse.json(
      sanitizeApiError(error, 'Failed to run system health check'),
      { status: 500 }
    );
  }
}
