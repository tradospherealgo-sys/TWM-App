import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let rawUrl = (
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  ''
).trim();
if (rawUrl.startsWith('DATABASE_URL=')) {
  rawUrl = rawUrl.substring('DATABASE_URL='.length).trim();
} else if (rawUrl.startsWith('DATABASE_URL =')) {
  rawUrl = rawUrl.substring('DATABASE_URL ='.length).trim();
} else if (rawUrl.startsWith('DATABASE_URL:')) {
  rawUrl = rawUrl.substring('DATABASE_URL:'.length).trim();
}

if ((rawUrl.startsWith('"') && rawUrl.endsWith('"')) || (rawUrl.startsWith("'") && rawUrl.endsWith("'"))) {
  rawUrl = rawUrl.slice(1, -1).trim();
}
rawUrl = rawUrl.replace(/^\\"/, '').replace(/\\"$/, '').trim();

if (rawUrl) {
  // Supabase Transaction Pooler (port 6543) requires pgbouncer=true so Prisma avoids prepared statement collisions
  if ((rawUrl.includes(':6543') || rawUrl.includes('pooler.supabase.com')) && !rawUrl.includes('pgbouncer=true')) {
    const separator = rawUrl.includes('?') ? '&' : '?';
    rawUrl = `${rawUrl}${separator}pgbouncer=true`;
  }
  process.env.DATABASE_URL = rawUrl;
} else {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/twm_db';
}

if (process.env.NODE_ENV === 'production') {
  if (!rawUrl || rawUrl.startsWith('file:')) {
    console.error(
      '[PRISMA_CONFIG] FATAL: Production requires a valid PostgreSQL connection string in DATABASE_URL. Received:',
      rawUrl ? 'sqlite/file scheme' : 'undefined/empty'
    );
  }
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: rawUrl ? { db: { url: rawUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
