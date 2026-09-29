import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { saveIntegration } from '@/lib/integrations/service';

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
    const body = await request.json();
    const secrets = body.secrets || {};
    const publicConfig = body.publicConfig || {};

    const { success, testResult } = await saveIntegration(
      providerKey,
      secrets,
      publicConfig,
      user.id
    );

    return NextResponse.json({
      success,
      message: `Configuration for ${providerKey} saved and encrypted successfully.`,
      testResult,
    });
  } catch (error: any) {
    console.error(`Save integration error for ${providerKey}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to save integration configuration' },
      { status: 400 }
    );
  }
}
