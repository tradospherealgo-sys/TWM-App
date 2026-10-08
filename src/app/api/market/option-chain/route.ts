import { NextRequest, NextResponse } from 'next/server';
import { getOptionChain } from '@/lib/adapters/market-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const underlying = searchParams.get('underlying') || 'NIFTY';

  try {
    const data = await getOptionChain(underlying);
    return NextResponse.json({ success: true, optionChain: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch option chain' },
      { status: 500 }
    );
  }
}
