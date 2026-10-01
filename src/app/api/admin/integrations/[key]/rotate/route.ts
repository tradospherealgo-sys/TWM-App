import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { rotateIntegrationSecret } from '@/lib/integrations/service';
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
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body empty or non-JSON
    }
    const { secretKey, newSecretValue } = body;

    if (!secretKey) {
      return NextResponse.json({ error: 'Missing secretKey in request body' }, { status: 400 });
    }

    await rotateIntegrationSecret(providerKey, secretKey, newSecretValue || '', user.id);

    return NextResponse.json({
      success: true,
      message: `Credential ${secretKey} for ${providerKey} has been rotated/cleared.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      sanitizeApiError(error, 'Failed to rotate credential'),
      { status: 500 }
    );
  }
}
