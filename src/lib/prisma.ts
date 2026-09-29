import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let rawUrl = (process.env.DATABASE_URL || '').trim();
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
  process.env.DATABASE_URL = rawUrl;
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
