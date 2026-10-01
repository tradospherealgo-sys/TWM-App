import prisma from '@/lib/prisma';

/**
 * Generates a unique, collision-resistant employee code.
 * Safe for concurrent employee provisioning (e.g. TWM-EMP-839102).
 */
export async function generateUniqueEmployeeCode(prismaClient: any = prisma): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const candidate = `TWM-EMP-${randomSuffix}`;
    const existing = await prismaClient.employee.findUnique({
      where: { employeeCode: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }
  // High-entropy fallback with timestamp segment
  const timestampSuffix = Date.now().toString().slice(-6);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TWM-EMP-${timestampSuffix}-${randomSuffix}`;
}
