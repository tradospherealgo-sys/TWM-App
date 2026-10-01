import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { recordHumanDecision } from '@/lib/signals/service';
import { sanitizeApiError } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, notes } = body;

    if (!action || !['APPROVE', 'REJECT', 'SEND_BACK'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'APPROVE', 'REJECT', or 'SEND_BACK'." },
        { status: 400 }
      );
    }

    const updated = await recordHumanDecision(params.id, { action, notes }, user.id);
    return NextResponse.json({
      success: true,
      message: `Signal status updated to ${updated.status}.`,
      signal: updated,
    });
  } catch (error: any) {
    return NextResponse.json(sanitizeApiError(error, 'Failed to record decision'), { status: 400 });
  }
}
