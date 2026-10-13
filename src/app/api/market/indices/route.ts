import { NextResponse } from 'next/server';
import { getIndicesWithLiveQuotes } from '@/lib/adapters/market-data';

export async function GET() {
  const { indices, providerStatus } = await getIndicesWithLiveQuotes();
  return NextResponse.json({ indices, providerStatus });
}
