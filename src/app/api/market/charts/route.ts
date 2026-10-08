import { NextRequest, NextResponse } from 'next/server';
import { getChartData } from '@/lib/adapters/market-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'NIFTY50';
  const timeframe = searchParams.get('timeframe') || '1D';

  try {
    const data = await getChartData(symbol, timeframe);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}
