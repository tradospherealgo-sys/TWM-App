import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { rotateIntegrationSecret } from '@/lib/integrations/service';

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
    console.error(`Rotate credential error for ${providerKey}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to rotate credential' },
      { status: 500 }
    );
  }
}
