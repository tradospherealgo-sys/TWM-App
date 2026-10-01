import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { saveIntegration } from '@/lib/integrations/service';
import { sanitizeApiError } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
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
    return NextResponse.json(
      sanitizeApiError(error, 'Failed to save integration configuration'),
      { status: 400 }
    );
  }
}
