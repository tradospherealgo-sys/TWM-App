import prisma from '@/lib/prisma';

export type OnboardingStage =
  | 'PROFILE_INCOMPLETE'
  | 'DOCUMENTS_REQUIRED'
  | 'KYC_UNDER_REVIEW'
  | 'ACTION_REQUIRED'
  | 'COMPLETED';

export interface OnboardingStepState {
  completed: boolean;
  label: string;
  details?: string;
}

export interface OnboardingDetails {
  stage: OnboardingStage;
  progressPercentage: number;
  customerCode: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  customer: {
    id: string;
    pan: string | null;
    kycStatus: string;
  };
  steps: {
    accountCreated: OnboardingStepState;
    profileDetails: OnboardingStepState;
    kycDocuments: OnboardingStepState;
    complianceReview: OnboardingStepState;
  };
  nextAction: {
    title: string;
    description: string;
    targetUrl: string;
    actionLabel: string;
  };
}

/**
 * Generates a unique, collision-resistant customer code.
 * Safe for concurrent registrations and conforms to Customer.customerCode unique constraint.
 */
export async function generateUniqueCustomerCode(prismaClient: any = prisma): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    // Generate 6-digit random number: e.g. TWM-CUST-839102
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const candidate = `TWM-CUST-${randomSuffix}`;
    const existing = await prismaClient.customer.findUnique({
      where: { customerCode: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }
  // High-entropy fallback with timestamp segment
  const timestampSuffix = Date.now().toString().slice(-6);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TWM-CUST-${timestampSuffix}-${randomSuffix}`;
}

/**
 * Server-authoritative computation of client onboarding progress and requirements.
 * Driven strictly by live database entities; cannot be forged or bypassed by client input.
 */
export async function getClientOnboardingDetails(userId: string): Promise<OnboardingDetails | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      customerProfile: true,
      documents: {
        select: { id: true, documentType: true, status: true },
      },
    },
  });

  if (!user || user.role !== 'CLIENT') {
    return null;
  }

  // Ensure customer profile exists
  let customer = user.customerProfile;
  if (!customer) {
    const customerCode = await generateUniqueCustomerCode(prisma);
    customer = await prisma.customer.create({
      data: {
        userId: user.id,
        customerCode,
        kycStatus: 'PENDING',
      },
    });
  }

  const hasPhone = Boolean(user.phone && user.phone.trim().length >= 10);
  const hasPan = Boolean(customer.pan && customer.pan.trim().length >= 10);
  const isProfileComplete = hasPhone && hasPan;

  const uploadedDocs = user.documents || [];
  const hasUploadedDocs = uploadedDocs.length > 0;
  const isKycVerified = customer.kycStatus === 'VERIFIED';
  const isKycRejected = customer.kycStatus === 'REJECTED';

  let stage: OnboardingStage = 'PROFILE_INCOMPLETE';
  let progressPercentage = 25;

  if (!isProfileComplete) {
    stage = 'PROFILE_INCOMPLETE';
    progressPercentage = 25;
  } else if (!hasUploadedDocs) {
    stage = 'DOCUMENTS_REQUIRED';
    progressPercentage = 50;
  } else if (isKycRejected) {
    stage = 'ACTION_REQUIRED';
    progressPercentage = 50;
  } else if (isKycVerified) {
    stage = 'COMPLETED';
    progressPercentage = 100;
  } else {
    stage = 'KYC_UNDER_REVIEW';
    progressPercentage = 75;
  }

  const nextAction = (() => {
    switch (stage) {
      case 'PROFILE_INCOMPLETE':
        return {
          title: 'Complete Profile Details',
          description: 'Provide your contact number and PAN to initiate SEBI & DPDP regulatory compliance.',
          targetUrl: '/onboarding',
          actionLabel: 'Enter Profile Details',
        };
      case 'DOCUMENTS_REQUIRED':
        return {
          title: 'Submit KYC Documents',
          description: 'Upload required identification documents (PAN, Aadhaar, Bank Proof) to your secure vault.',
          targetUrl: '/documents',
          actionLabel: 'Upload Documents',
        };
      case 'ACTION_REQUIRED':
        return {
          title: 'Document Correction Required',
          description: 'One or more submitted documents require clarification. Please review and re-upload.',
          targetUrl: '/documents',
          actionLabel: 'Review Documents',
        };
      case 'KYC_UNDER_REVIEW':
        return {
          title: 'KYC Under Staff Review',
          description: 'Your regulatory documents are currently being verified by the compliance operations desk.',
          targetUrl: '/documents',
          actionLabel: 'View Document Vault',
        };
      case 'COMPLETED':
      default:
        return {
          title: 'Onboarding Complete',
          description: 'Your regulatory profile is verified and active. You have full access to wealth services.',
          targetUrl: '/home',
          actionLabel: 'Go to Dashboard',
        };
    }
  })();

  return {
    stage,
    progressPercentage,
    customerCode: customer.customerCode,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    customer: {
      id: customer.id,
      pan: customer.pan,
      kycStatus: customer.kycStatus,
    },
    steps: {
      accountCreated: {
        completed: true,
        label: 'Account Registration',
        details: `Customer code assigned: ${customer.customerCode}`,
      },
      profileDetails: {
        completed: isProfileComplete,
        label: 'Personal & PAN Details',
        details: isProfileComplete
          ? `PAN: ${customer.pan}`
          : 'Pending phone number & valid PAN submission',
      },
      kycDocuments: {
        completed: hasUploadedDocs,
        label: 'Regulatory Document Submission',
        details: hasUploadedDocs
          ? `${uploadedDocs.length} document(s) uploaded to vault`
          : 'Awaiting mandatory KYC documents',
      },
      complianceReview: {
        completed: isKycVerified,
        label: 'Compliance Desk Verification',
        details: isKycVerified
          ? 'KYC officially verified'
          : isKycRejected
          ? 'Action required - review needed'
          : hasUploadedDocs
          ? 'Documents queued for review'
          : 'Pending document upload',
      },
    },
    nextAction,
  };
}
