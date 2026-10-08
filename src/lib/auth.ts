import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma';

export const SESSION_COOKIE_NAME = 'twm_session';
const DEFAULT_DEV_JWT_SECRET = 'twm_development_session_secret_change_in_production_min_32_chars!';

export function getJwtSecret(): Uint8Array {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (!secret || secret === DEFAULT_DEV_JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: Production requires a secure, high-entropy JWT_SECRET (min 32 chars). Development fallback secret is strictly prohibited in production.'
      );
    }
    return new TextEncoder().encode(DEFAULT_DEV_JWT_SECRET);
  }
  if (secret.length < 32 && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET must be at least 32 characters in production.');
  }
  return new TextEncoder().encode(secret);
}

export type UserRole = 'CLIENT' | 'EMPLOYEE' | 'ADMIN';

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  employeeId?: string;
  customerId?: string;
  exp?: number;
}

/**
 * Sign a secure JWT session token (valid for 7 days)
 */
export async function signSessionToken(payload: Omit<SessionPayload, 'exp'>): Promise<string> {
  const key = getJwtSecret();
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

/**
 * Verify a JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const key = getJwtSecret();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Hash password securely with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Retrieve current authenticated session from HTTP cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Server-side RBAC guard: Get verified user or null
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      customerProfile: {
        select: { id: true, customerCode: true, kycStatus: true, pan: true, assignedEmployeeId: true },
      },
      employeeProfile: {
        select: { id: true, employeeCode: true, department: true, designation: true },
      },
    },
  });

  if (!user || user.status !== 'ACTIVE') return null;
  return user;
}

/**
 * Determine default dashboard path based on role
 */
export function getRoleDashboardPath(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'EMPLOYEE':
      return '/employee';
    case 'CLIENT':
    default:
      return '/home';
  }
}
