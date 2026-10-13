import { NextRequest, NextResponse } from 'next/server';
import { getStockQuoteAsync } from '@/lib/adapters/market-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const stock = await getStockQuoteAsync(params.symbol);
  if (!stock) {
    return NextResponse.json({ error: 'Stock symbol not found in directory' }, { status: 404 });
  }

  return NextResponse.json({ stock });
}
