import prisma from '../prisma';
import type { SessionPayload } from '../auth';

export type DocumentWithRelations = {
  id: string;
  userId: string;
  customerId: string | null;
  applicationId: string | null;
  title: string;
  documentType: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: string;
  customer?: { id: string; assignedEmployeeId: string | null } | null;
  application?: { id: string; assignedEmployeeId: string | null } | null;
};

export interface AuthDecision {
  allowed: boolean;
  reason?: string;
  status: number;
}

export interface UserContext {
  id?: string;
  userId?: string;
  role: string;
  customerProfile?: { id: string; assignedEmployeeId?: string | null } | null;
  employeeProfile?: { id: string; department?: string; designation?: string } | null;
  customerId?: string;
  employeeId?: string;
}

/**
 * Validates whether an authenticated user is permitted to download/view a document
 */
export async function canAccessDocument(
  user: UserContext,
  doc: DocumentWithRelations
): Promise<AuthDecision> {
  if (!user) {
    return { allowed: false, reason: 'Authentication required', status: 401 };
  }

  const userId = user.id || user.userId;
  if (!userId) {
    return { allowed: false, reason: 'Invalid user context', status: 401 };
  }

  // 1. ADMIN: Organization-wide access with audit trail
  if (user.role === 'ADMIN') {
    return { allowed: true, status: 200 };
  }

  // 2. CLIENT: Strict ownership boundary
  if (user.role === 'CLIENT') {
    const customerId = user.customerProfile?.id || user.customerId;
    const isOwner = doc.userId === userId || (customerId && doc.customerId === customerId);
    if (isOwner) {
      return { allowed: true, status: 200 };
    }
    return { allowed: false, reason: 'Forbidden: Access denied to unowned document', status: 403 };
  }

  // 3. EMPLOYEE: Assigned customer/application or Compliance/Operations department
  if (user.role === 'EMPLOYEE') {
    let employeeId = user.employeeProfile?.id || user.employeeId;
    let department = user.employeeProfile?.department || '';
    let designation = user.employeeProfile?.designation || '';

    if (!employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { userId },
        select: { id: true, department: true, designation: true },
      });
      if (employee) {
        employeeId = employee.id;
        department = employee.department;
        designation = employee.designation;
      }
    }

    if (!employeeId) {
      return { allowed: false, reason: 'Employee profile not found', status: 403 };
    }

    const dept = (department || '').toLowerCase();
    const desig = (designation || '').toLowerCase();
    const isComplianceOrOps =
      dept.includes('compliance') ||
      dept.includes('operations') ||
      desig.includes('compliance') ||
      desig.includes('operations') ||
      desig.includes('officer');

    if (isComplianceOrOps) {
      return { allowed: true, status: 200 };
    }

    // Assigned check
    const isCustomerAssigned = doc.customer?.assignedEmployeeId === employeeId;
    const isApplicationAssigned = doc.application?.assignedEmployeeId === employeeId;

    if (isCustomerAssigned || isApplicationAssigned) {
      return { allowed: true, status: 200 };
    }

    return {
      allowed: false,
      reason: 'Forbidden: You are not assigned to this client or application',
      status: 403,
    };
  }

  return { allowed: false, reason: 'Forbidden: Unrecognized role', status: 403 };
}

/**
 * Validates whether an authenticated user can verify or reject a document
 */
export async function canVerifyDocument(
  user: UserContext,
  doc: DocumentWithRelations
): Promise<AuthDecision> {
  if (!user) {
    return { allowed: false, reason: 'Authentication required', status: 401 };
  }

  if (user.role === 'CLIENT') {
    return { allowed: false, reason: 'Clients cannot perform document verification', status: 403 };
  }

  if (user.role === 'ADMIN') {
    return { allowed: true, status: 200 };
  }

  if (user.role === 'EMPLOYEE') {
    return canAccessDocument(user, doc);
  }

  return { allowed: false, reason: 'Forbidden', status: 403 };
}

/**
 * Validates whether an authenticated user can delete a document
 */
export async function canDeleteDocument(
  user: UserContext,
  doc: DocumentWithRelations
): Promise<AuthDecision> {
  if (!user) {
    return { allowed: false, reason: 'Authentication required', status: 401 };
  }

  if (user.role === 'ADMIN') {
    return { allowed: true, status: 200 };
  }

  if (user.role === 'CLIENT') {
    const userId = user.id || user.userId;
    const isOwner = doc.userId === userId;
    if (!isOwner) {
      return { allowed: false, reason: 'Forbidden: Cannot delete other user documents', status: 403 };
    }
    if (doc.status === 'VERIFIED') {
      return { allowed: false, reason: 'Forbidden: Verified KYC documents cannot be deleted by client', status: 403 };
    }
    return { allowed: true, status: 200 };
  }

  return { allowed: false, reason: 'Forbidden: Staff cannot delete client KYC records without admin privilege', status: 403 };
}
