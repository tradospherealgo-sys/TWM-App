import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args.find((a) => a.startsWith('--email='))?.split('=')[1];
  const nameArg = args.find((a) => a.startsWith('--name='))?.split('=')[1] || 'TWM Administrator';
  const passArg = args.find((a) => a.startsWith('--password='))?.split('=')[1];
  const sqlOnly = args.includes('--sql');

  const email = (emailArg || 'admin@tradosphere.in').toLowerCase().trim();
  // If no password provided, generate a cryptographically strong 16-character password
  const password = passArg || crypto.randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = 'c' + crypto.randomUUID().replace(/-/g, '').slice(0, 24);

  if (sqlOnly) {
    const sql = `INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "status", "createdAt", "updatedAt")
VALUES ('${userId}', '${email}', '${passwordHash}', '${nameArg}', 'ADMIN', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  "role" = 'ADMIN',
  "status" = 'ACTIVE',
  "updatedAt" = NOW();`;
    console.log(sql);
    return;
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      email,
      name: nameArg,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`✓ Admin user successfully provisioned: ${user.email}`);
  if (!passArg) {
    console.log(`Temporary Password: ${password}`);
    console.log(`(Please change this password upon initial login)`);
  }
}

main()
  .catch((err) => {
    console.error('Error provisioning admin:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
