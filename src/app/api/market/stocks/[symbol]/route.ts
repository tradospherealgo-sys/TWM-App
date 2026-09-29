import { NextRequest, NextResponse } from 'next/server';
import { getStockBySymbol } from '@/lib/adapters/market-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const stock = getStockBySymbol(params.symbol);
  if (!stock) {
    return NextResponse.json({ error: 'Stock symbol not found in directory' }, { status: 404 });
  }

  return NextResponse.json({ stock });
}
