import { NextRequest, NextResponse } from 'next/server';
import { searchStocks } from '@/lib/adapters/market-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const results = searchStocks(q);
  return NextResponse.json({ stocks: results });
}
