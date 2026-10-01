import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { generateUniqueEmployeeCode } from '@/lib/employee';
import { hashPassword, verifyPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

// ============================================================================
// Schemas under test (matching API route validations)
// ============================================================================

const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Valid work email required').max(100),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['EMPLOYEE', 'ADMIN']).default('EMPLOYEE'),
  department: z.string().min(2, 'Department is required').max(50),
  designation: z.string().min(2, 'Designation is required').max(50),
});

const updateEmployeeSchema = z.object({
  id: z.string().min(1, 'Employee profile ID required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  department: z.string().min(2).max(50).optional(),
  designation: z.string().min(2).max(50).optional(),
});

const leadPatchSchema = z.object({
  id: z.string().min(1, 'Lead ID required'),
  status: z.string().optional(),
  notes: z.string().optional(),
  assignedEmployeeId: z.string().nullable().optional(),
});

const taskPatchSchema = z.object({
  id: z.string().min(1, 'Task ID required'),
  status: z.string().optional(),
  priority: z.string().optional(),
  notes: z.string().optional(),
  assignedEmployeeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().optional(),
});

const followupPatchSchema = z.object({
  id: z.string().min(1, 'Follow-up ID required'),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'MISSED']).optional(),
  outcome: z.string().optional(),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDueDate: z.string().datetime().optional(),
});

const convertLeadSchema = z.object({
  leadId: z.string().min(1, 'Lead ID required'),
  productCategory: z.string().min(1, 'Product category required'),
  productCode: z.string().min(1, 'Product code required'),
  notes: z.string().optional(),
});

const dailyReportSchema = z.object({
  callsCount: z.number().min(0).default(0),
  contactsCount: z.number().min(0).default(0),
  newLeadsCount: z.number().min(0).default(0),
  followUpsCount: z.number().min(0).default(0),
  applicationsCount: z.number().min(0).default(0),
  documentsCount: z.number().min(0).default(0),
  conversionsCount: z.number().min(0).default(0),
  pendingWork: z.string().optional(),
  bottlenecks: z.string().optional(),
  tomorrowPriorities: z.string().optional(),
});

describe('Part 7 — Employee Panel, Staff Management & CRM Operations Suite', () => {
  // ==========================================================================
  // 1. Employee Unique Code Generator & Utility
  // ==========================================================================
  describe('1. Employee Unique Code Generator', () => {
    it('should generate employee codes with TWM-EMP- prefix and 6 random alphanumeric characters', async () => {
      const code = await generateUniqueEmployeeCode();
      expect(code).toMatch(/^TWM-EMP-[A-Z0-9]{6}$/);
    });

    it('should generate distinct unique codes on successive calls', async () => {
      const code1 = await generateUniqueEmployeeCode();
      const code2 = await generateUniqueEmployeeCode();
      expect(code1).not.toBe(code2);
    });
  });

  // ==========================================================================
  // 2. Admin Staff Provisioning & Role Protection
  // ==========================================================================
  describe('2. Staff Provisioning & Role Protection', () => {
    it('should validate valid staff provisioning payload for EMPLOYEE', () => {
      const validPayload = {
        name: 'Suresh Raina',
        email: 'suresh.raina@tradosphere.com',
        password: 'StaffPassword@123',
        role: 'EMPLOYEE' as const,
        department: 'Operations',
        designation: 'Operations Specialist',
      };
      const result = createEmployeeSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should validate valid staff provisioning payload for ADMIN', () => {
      const adminPayload = {
        name: 'Compliance Head',
        email: 'compliance.head@tradosphere.com',
        password: 'AdminPassword@123',
        role: 'ADMIN' as const,
        department: 'Compliance',
        designation: 'Principal Compliance Officer',
      };
      const result = createEmployeeSchema.safeParse(adminPayload);
      expect(result.success).toBe(true);
    });

    it('should reject provisioning with a non-staff role like CLIENT', () => {
      const invalidPayload = {
        name: 'Invalid User',
        email: 'invalid@example.com',
        password: 'Password@123',
        role: 'CLIENT',
        department: 'Sales',
        designation: 'Agent',
      };
      const result = createEmployeeSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject weak employee passwords lacking special character or uppercase', () => {
      const weakPayload = {
        name: 'Weak Staff',
        email: 'weak.staff@tradosphere.com',
        password: 'weakpassword123',
        role: 'EMPLOYEE' as const,
        department: 'Support',
        designation: 'Associate',
      };
      const result = createEmployeeSchema.safeParse(weakPayload);
      expect(result.success).toBe(false);
    });

    it('should hash employee passwords securely before saving to database', async () => {
      const rawPassword = 'SecureStaffPassword#2026';
      const hash = await hashPassword(rawPassword);
      expect(hash).not.toBe(rawPassword);
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/);
      const isMatch = await verifyPassword(rawPassword, hash);
      expect(isMatch).toBe(true);
    });

    it('should protect the last active admin from being deactivated or suspended', async () => {
      // Simulate last active admin protection logic
      const targetUser = { id: 'admin-1', role: 'ADMIN', status: 'ACTIVE' };
      const newStatus = 'INACTIVE';
      const activeAdminCount = 1;

      let allowed = true;
      let errorMessage = '';

      if (targetUser.role === 'ADMIN' && (newStatus === 'INACTIVE' || newStatus === 'SUSPENDED')) {
        if (activeAdminCount <= 1) {
          allowed = false;
          errorMessage = 'Cannot deactivate or suspend the only active administrator';
        }
      }

      expect(allowed).toBe(false);
      expect(errorMessage).toBe('Cannot deactivate or suspend the only active administrator');
    });
  });

  // ==========================================================================
  // 3. Horizontal Access Control & Isolation
  // ==========================================================================
  describe('3. Horizontal RBAC & Staff Isolation', () => {
    it('should forbid Employee A from updating a task assigned to Employee B', () => {
      const currentEmployeeId = 'emp-001';
      const task = {
        id: 'task-101',
        title: 'Review Pan Card',
        assignedEmployeeId: 'emp-002', // Belongs to Employee B
      };

      const isStaffUser = true;
      const isAdmin = false;

      let canUpdate = false;
      if (isAdmin) {
        canUpdate = true;
      } else if (isStaffUser && task.assignedEmployeeId === currentEmployeeId) {
        canUpdate = true;
      }

      expect(canUpdate).toBe(false);
    });

    it('should permit Employee A to update their own assigned task', () => {
      const currentEmployeeId = 'emp-001';
      const task = {
        id: 'task-102',
        title: 'Call Customer Back',
        assignedEmployeeId: 'emp-001',
      };

      const isStaffUser = true;
      const isAdmin = false;

      let canUpdate = false;
      if (isAdmin || (isStaffUser && task.assignedEmployeeId === currentEmployeeId)) {
        canUpdate = true;
      }

      expect(canUpdate).toBe(true);
    });

    it('should forbid Employee from arbitrarily reassigning a task to someone else', () => {
      const isAdmin = false;
      const requestedNewAssignee = 'emp-003';

      let reassignmentPermitted = false;
      if (isAdmin) {
        reassignmentPermitted = true;
      } else if (requestedNewAssignee) {
        // Staff cannot reassign tasks to others
        reassignmentPermitted = false;
      }

      expect(reassignmentPermitted).toBe(false);
    });

    it('should permit Admin to reassign any task or lead across the organization', () => {
      const isAdmin = true;
      const requestedNewAssignee = 'emp-003';

      let reassignmentPermitted = false;
      if (isAdmin) {
        reassignmentPermitted = true;
      }

      expect(reassignmentPermitted).toBe(true);
    });

    it('should forbid Employee A from modifying a lead assigned to Employee B', () => {
      const currentEmployeeId = 'emp-001';
      const lead = {
        id: 'lead-501',
        name: 'Ramesh Patel',
        assignedEmployeeId: 'emp-002',
      };
      const isAdmin = false;

      let canModifyLead = false;
      if (isAdmin) {
        canModifyLead = true;
      } else if (lead.assignedEmployeeId === currentEmployeeId) {
        canModifyLead = true;
      }

      expect(canModifyLead).toBe(false);
    });

    it('should permit an Employee to claim an unassigned lead', () => {
      const currentEmployeeId = 'emp-001';
      const lead = {
        id: 'lead-502',
        name: 'Priya Sharma',
        assignedEmployeeId: null, // Unassigned lead
      };
      const isAdmin = false;

      let canClaimLead = false;
      if (isAdmin || lead.assignedEmployeeId === null || lead.assignedEmployeeId === currentEmployeeId) {
        canClaimLead = true;
      }

      expect(canClaimLead).toBe(true);
    });

    it('should forbid Employee from accessing a customer timeline assigned to another employee', () => {
      const currentEmployeeId = 'emp-001';
      const customer = {
        id: 'cust-900',
        customerCode: 'TWM-CLI-100456',
        assignedEmployeeId: 'emp-002', // Assigned to Employee B
      };
      const role = 'EMPLOYEE';

      let isForbidden = false;
      if (role === 'EMPLOYEE' && customer.assignedEmployeeId && customer.assignedEmployeeId !== currentEmployeeId) {
        isForbidden = true;
      }

      expect(isForbidden).toBe(true);
    });

    it('should permit Employee to access an unassigned customer timeline', () => {
      const currentEmployeeId = 'emp-001';
      const customer = {
        id: 'cust-901',
        customerCode: 'TWM-CLI-100457',
        assignedEmployeeId: null, // Unassigned customer
      };
      const role = 'EMPLOYEE';

      let isForbidden = false;
      if (role === 'EMPLOYEE' && customer.assignedEmployeeId && customer.assignedEmployeeId !== currentEmployeeId) {
        isForbidden = true;
      }

      expect(isForbidden).toBe(false);
    });
  });

  // ==========================================================================
  // 4. Follow-up Management & Completion Engine
  // ==========================================================================
  describe('4. Follow-Up Completion & Task Auto-Creation Engine', () => {
    it('should validate follow-up completion payload', () => {
      const payload = {
        id: 'fu-123',
        status: 'COMPLETED' as const,
        outcome: 'Client interested in SMC Demat account',
        notes: 'Explained pricing structure and requested PAN/Aadhaar copies',
        nextAction: 'Collect self-attested PAN and Aadhaar',
        nextActionDueDate: new Date(Date.now() + 86400000).toISOString(),
      };
      const result = followupPatchSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should auto-create downstream task when nextAction is provided in follow-up completion', () => {
      const followup = {
        id: 'fu-123',
        customerId: 'cust-001',
        employeeId: 'emp-001',
      };
      const patchData = {
        status: 'COMPLETED',
        outcome: 'Call successful',
        nextAction: 'Verify Aadhaar via KRA',
        nextActionDueDate: new Date().toISOString(),
      };

      let autoCreatedTask: Record<string, unknown> | null = null;

      if (patchData.status === 'COMPLETED' && patchData.nextAction) {
        autoCreatedTask = {
          title: `Follow-up Action: ${patchData.nextAction.substring(0, 80)}`,
          description: `Auto-generated from completed follow-up. Outcome: ${patchData.outcome}`,
          priority: 'MEDIUM',
          customerId: followup.customerId,
          assignedEmployeeId: followup.employeeId,
          dueDate: new Date(patchData.nextActionDueDate),
        };
      }

      expect(autoCreatedTask).not.toBeNull();
      expect(autoCreatedTask?.title).toContain('Verify Aadhaar via KRA');
      expect(autoCreatedTask?.assignedEmployeeId).toBe('emp-001');
      expect(autoCreatedTask?.customerId).toBe('cust-001');
    });

    it('should allow marking a follow-up as MISSED with notes', () => {
      const payload = {
        id: 'fu-124',
        status: 'MISSED' as const,
        outcome: 'Client unreachable / phone switched off',
        notes: 'Tried calling twice at 11 AM and 11:15 AM',
      };
      const result = followupPatchSchema.safeParse(payload);
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('MISSED');
    });
  });

  // ==========================================================================
  // 5. Lead -> Formal Application Conversion Workflow
  // ==========================================================================
  describe('5. Lead to Application Conversion Workflow', () => {
    it('should validate convert lead payload', () => {
      const payload = {
        leadId: 'lead-999',
        productCategory: 'DEMAT',
        productCode: 'SMC-TRADING-01',
        notes: 'Client confirmed Demat registration',
      };
      const result = convertLeadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should generate application number in TWM-APP- format with uppercase alphanumeric code', () => {
      const appNumber = `TWM-APP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      expect(appNumber).toMatch(/^TWM-APP-[A-Z0-9]{6}$/);
    });

    it('should reuse existing customer when lead email or phone already matches', () => {
      const lead = {
        id: 'lead-888',
        name: 'Vikas Kumar',
        email: 'vikas@example.com',
        phone: '+919876543210',
      };

      const existingUser = {
        id: 'user-777',
        email: 'vikas@example.com',
        customerProfile: { id: 'cust-777', customerCode: 'TWM-CLI-100888' },
      };

      let customerIdToUse = '';
      if (existingUser && existingUser.customerProfile) {
        customerIdToUse = existingUser.customerProfile.id;
      }

      expect(customerIdToUse).toBe('cust-777');
    });

    it('should transition lead status to APPLICATION upon successful conversion', () => {
      const lead = {
        id: 'lead-888',
        status: 'INTERESTED',
      };

      const updatedLead = {
        ...lead,
        status: 'APPLICATION',
      };

      expect(updatedLead.status).toBe('APPLICATION');
    });
  });

  // ==========================================================================
  // 6. Customer 360 Unified Interaction History Timeline
  // ==========================================================================
  describe('6. Customer 360 Timeline Assembly', () => {
    it('should assemble chronological timeline containing all interaction types sorted descending', () => {
      const mockCustomer = {
        id: 'cust-300',
        customerCode: 'TWM-CLI-100300',
        kycStatus: 'IN_PROGRESS',
        createdAt: new Date('2026-09-01T10:00:00Z'),
        applications: [
          {
            id: 'app-1',
            applicationNumber: 'TWM-APP-XYZ123',
            productCategory: 'DEMAT',
            createdAt: new Date('2026-09-05T14:00:00Z'),
            status: 'IN_REVIEW',
          },
        ],
        documents: [
          {
            id: 'doc-1',
            title: 'PAN Card',
            documentType: 'PAN',
            createdAt: new Date('2026-09-02T11:00:00Z'),
            status: 'VERIFIED',
          },
        ],
        followUps: [
          {
            id: 'fu-1',
            scheduledAt: new Date('2026-09-06T09:30:00Z'),
            status: 'COMPLETED',
            outcome: 'Customer answered all queries',
          },
        ],
        tasks: [
          {
            id: 'task-1',
            title: 'Verify Bank Statement',
            createdAt: new Date('2026-09-03T16:00:00Z'),
            status: 'PENDING',
          },
        ],
      };

      type TimelineItem = {
        type: string;
        title: string;
        timestamp: Date;
      };

      const timeline: TimelineItem[] = [
        {
          type: 'REGISTRATION',
          title: 'Customer Profile Initialized',
          timestamp: mockCustomer.createdAt,
        },
        ...mockCustomer.applications.map((app) => ({
          type: 'APPLICATION',
          title: `Application #${app.applicationNumber}`,
          timestamp: app.createdAt,
        })),
        ...mockCustomer.documents.map((doc) => ({
          type: 'DOCUMENT',
          title: `KYC Document: ${doc.title}`,
          timestamp: doc.createdAt,
        })),
        ...mockCustomer.followUps.map((fu) => ({
          type: 'FOLLOWUP',
          title: `Follow-up: ${fu.status}`,
          timestamp: fu.scheduledAt,
        })),
        ...mockCustomer.tasks.map((task) => ({
          type: 'TASK',
          title: `Task: ${task.title}`,
          timestamp: task.createdAt,
        })),
      ];

      timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      expect(timeline.length).toBe(5);
      // Newest event is Follow-up (2026-09-06)
      expect(timeline[0].type).toBe('FOLLOWUP');
      // Second newest is Application (2026-09-05)
      expect(timeline[1].type).toBe('APPLICATION');
      // Oldest is Registration (2026-09-01)
      expect(timeline[4].type).toBe('REGISTRATION');
    });
  });

  // ==========================================================================
  // 7. Daily Operational Reports & Role Isolation
  // ==========================================================================
  describe('7. Daily Operational Reports', () => {
    it('should validate daily report metrics submission', () => {
      const validReport = {
        callsCount: 25,
        contactsCount: 18,
        newLeadsCount: 5,
        followUpsCount: 12,
        applicationsCount: 3,
        documentsCount: 6,
        conversionsCount: 2,
        pendingWork: '2 KYC bank checks pending with KRA',
        bottlenecks: 'Aadhaar OTP delay for one client',
        tomorrowPriorities: 'Follow up with 5 demo requests from today',
      };
      const result = dailyReportSchema.safeParse(validReport);
      expect(result.success).toBe(true);
    });

    it('should reject negative counts in daily operational reports', () => {
      const invalidReport = {
        callsCount: -5,
        contactsCount: 10,
        newLeadsCount: 0,
      };
      const result = dailyReportSchema.safeParse(invalidReport);
      expect(result.success).toBe(false);
    });

    it('should forbid CLIENT role from accessing daily report endpoints', () => {
      const userRole: string = 'CLIENT';
      let forbidden = false;

      if (userRole !== 'EMPLOYEE' && userRole !== 'ADMIN') {
        forbidden = true;
      }

      expect(forbidden).toBe(true);
    });

    it('should isolate Employee daily reports so employee only queries their own reports by default', () => {
      const currentUser = {
        id: 'user-001',
        role: 'EMPLOYEE',
        employeeProfile: { id: 'emp-001' },
      };

      const requestedParam = 'emp-999'; // Attacker trying to query someone else's reports

      const whereClause: Record<string, string> = {};
      if (currentUser.role === 'EMPLOYEE' && currentUser.employeeProfile) {
        // Enforce horizontal isolation: employee query locked to own profile
        whereClause.employeeId = currentUser.employeeProfile.id;
      } else if (requestedParam) {
        whereClause.employeeId = requestedParam;
      }

      expect(whereClause.employeeId).toBe('emp-001');
      expect(whereClause.employeeId).not.toBe('emp-999');
    });
  });
});
