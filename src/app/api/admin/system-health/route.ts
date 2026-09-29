import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { runSystemHealthCheck } from '@/lib/system-health';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const report = await runSystemHealthCheck();
    return NextResponse.json({ success: true, health: report });
  } catch (error: any) {
    console.error('System health check error:', error);
    return NextResponse.json(
      { error: 'Failed to run system health check', message: error.message },
      { status: 500 }
    );
  }
}
