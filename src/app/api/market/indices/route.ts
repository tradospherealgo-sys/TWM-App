import { NextResponse } from 'next/server';
import { getIndices, getMarketDataProviderStatus } from '@/lib/adapters/market-data';

export async function GET() {
  const indices = getIndices();
  const providerStatus = getMarketDataProviderStatus();
  return NextResponse.json({ indices, providerStatus });
}
