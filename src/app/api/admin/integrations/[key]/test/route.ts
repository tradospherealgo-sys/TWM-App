import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { runProviderTest } from '@/lib/integrations/service';
import { logActivity } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const providerKey = params.key.toUpperCase();

  try {
    const testResult = await runProviderTest(providerKey);

    await logActivity({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'INTEGRATION_TEST',
      entityType: 'IntegrationConfig',
      entityId: providerKey,
      details: {
        providerKey,
        success: testResult.success,
        status: testResult.status,
        latencyMs: testResult.latencyMs,
      },
    });

    return NextResponse.json({
      success: true,
      testResult,
    });
  } catch (error: any) {
    console.error(`Test integration error for ${providerKey}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Connection test failed',
        testResult: {
          success: false,
          status: 'CONNECTION_FAILED',
          message: error.message || 'Connection test encountered an error',
          latencyMs: 0,
        },
      },
      { status: 500 }
    );
  }
}
