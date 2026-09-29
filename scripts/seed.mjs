import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding TWM System Foundation Data ---');

  // 1. Password hashing
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const employeePasswordHash = await bcrypt.hash('Employee@123456', 10);
  const clientPasswordHash = await bcrypt.hash('Client@123456', 10);

  // 2. Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@tradosphere.in' },
    update: {},
    create: {
      email: 'admin@tradosphere.in',
      passwordHash: adminPasswordHash,
      name: 'TWM Principal Admin',
      phone: '+91 98765 00001',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // 3. Employee User
  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@tradosphere.in' },
    update: {},
    create: {
      email: 'employee@tradosphere.in',
      passwordHash: employeePasswordHash,
      name: 'Rajesh Sharma',
      phone: '+91 98765 00002',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      employeeProfile: {
        create: {
          employeeCode: 'TWM-EMP-001',
          department: 'Wealth Management',
          designation: 'Senior Relationship Manager',
          status: 'ACTIVE',
        },
      },
    },
    include: { employeeProfile: true },
  });

  // 4. Client User
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@tradosphere.in' },
    update: {},
    create: {
      email: 'client@tradosphere.in',
      passwordHash: clientPasswordHash,
      name: 'Aditya Mehta',
      phone: '+91 98765 00003',
      role: 'CLIENT',
      status: 'ACTIVE',
      customerProfile: {
        create: {
          customerCode: 'TWM-CUST-1001',
          pan: 'ABCDE1234F',
          kycStatus: 'VERIFIED',
          assignedEmployeeId: employeeUser.employeeProfile?.id,
        },
      },
      watchlists: {
        create: {
          name: 'Core Holdings Watchlist',
          symbolsJson: JSON.stringify(['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK']),
        },
      },
    },
    include: { customerProfile: true },
  });

  // 5. Approved Product Catalog
  const products = [
    {
      code: 'SMC_DEMAT',
      name: 'SMC Global Trading & Demat Account',
      category: 'TRADING',
      description: 'Facilitated account opening through Tradosphere as an Authorised Person of SMC Global. Direct execution via SMC Ace.',
      isActive: true,
      requiredDocuments: JSON.stringify(['PAN Card', 'Aadhaar Card', 'Cancelled Cheque', 'Income Proof (for F&O)']),
      configJson: JSON.stringify({ partner: 'SMC Global', segment: 'Equity, F&O, Commodity, Currency' }),
    },
    {
      code: 'MUTUAL_FUNDS',
      name: 'Mutual Fund Distribution & Advisory Desk',
      category: 'INVESTMENT',
      description: 'Direct and regular mutual fund schemes spanning Equity, Debt, and Hybrid categories from top AMCs.',
      isActive: true,
      requiredDocuments: JSON.stringify(['PAN Card', 'Aadhaar Card', 'Bank Mandate (NACH)']),
      configJson: JSON.stringify({ executionPlatform: 'BSE StAR MF / MFU' }),
    },
    {
      code: 'SIP',
      name: 'Systematic Investment Plan (SIP)',
      category: 'INVESTMENT',
      description: 'Disciplined monthly rupee-cost averaging in approved mutual fund schemes with automated mandate setup.',
      isActive: true,
      requiredDocuments: JSON.stringify(['PAN Card', 'Bank Account Verification']),
      configJson: JSON.stringify({ minimumAmount: 500, frequencies: ['Monthly', 'Quarterly'] }),
    },
    {
      code: 'IPO_DESK',
      name: 'Initial Public Offering (IPO) Desk',
      category: 'INVESTMENT',
      description: 'Unified UPI-based ASBA bidding assistance for Mainboard and SME IPOs.',
      isActive: true,
      requiredDocuments: JSON.stringify(['PAN Card', 'Demat Account Number (DP ID)', 'UPI ID']),
      configJson: JSON.stringify({ asbaEnabled: true }),
    },
    {
      code: 'HEALTH_INSURANCE',
      name: 'Comprehensive Health Insurance',
      category: 'INSURANCE',
      description: 'Comprehensive health coverage plans with cashless hospitalization across network hospitals.',
      isActive: true,
      requiredDocuments: JSON.stringify(['PAN Card', 'Address Proof', 'Medical History Disclosure']),
      configJson: JSON.stringify({ intermediaries: ['Approved General Insurance Partners'] }),
    },
    {
      code: 'TERM_LIFE_INSURANCE',
      name: 'Pure Term Life Protection',
      category: 'INSURANCE',
      description: 'High sum assured protection plans with optional critical illness and accidental disability riders.',
      isActive: true,
      requiredDocuments: JSON.stringify(['PAN Card', 'Salary Slips (3 months)', 'ITR (2 years)', 'Aadhaar Card']),
      configJson: JSON.stringify({ minTenureYears: 10, maxTenureYears: 40 }),
    },
    {
      code: 'PERSONAL_LOAN',
      name: 'Personal & Professional Loan Facilitation',
      category: 'LOAN',
      description: 'Collateral-free personal loans from partner NBFCs and scheduled commercial banks.',
      isActive: true,
      requiredDocuments: JSON.stringify(['PAN Card', 'Aadhaar Card', 'Bank Statements (6 months)', 'Salary Certificate']),
      configJson: JSON.stringify({ tenureMonths: '12 to 60' }),
    },
    {
      code: 'LOAN_AGAINST_SECURITIES',
      name: 'Loan Against Securities (LAS)',
      category: 'LOAN',
      description: 'Instant liquidity against approved shares and mutual fund holdings without liquidating portfolio.',
      isActive: true,
      requiredDocuments: JSON.stringify(['PAN Card', 'Demat Holding Statement', 'Pledge Authorization']),
      configJson: JSON.stringify({ ltvRange: '50% - 65%' }),
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: product,
      create: product,
    });
  }

  // 6. Approved Knowledge Base Articles & SOPs
  const knowledgeArticles = [
    {
      title: 'SOP-01: SMC Global Demat & Trading Onboarding Workflow',
      category: 'SOPS',
      productCode: 'SMC_DEMAT',
      content: `### SOP-01: SMC Global Demat Onboarding Protocol
1. **Verification**: Verify client PAN against income tax records and CKYC registry.
2. **Authorised Person Disclosure**: Disclose clearly to client that Tradosphere Wealth Management operates as an Authorised Person of SMC Global Securities Ltd.
3. **Execution Boundary**: All actual trade routing and depository accounts reside directly with SMC Global.
4. **Document Checklist**:
   - PAN Card (Self-attested)
   - Aadhaar Card (DigiLocker verified or masked XML)
   - Bank Proof (Bank Statement with IFSC or Cancelled Cheque with name printed)
   - Income Proof (mandatory for Derivatives segment: 6-month bank statement or latest ITR-V)
5. **No Guarantees**: Never promise trading returns or price targets under any circumstances.`,
      status: 'APPROVED',
      applicableRole: 'ALL',
      authorName: 'TWM Compliance Dept',
    },
    {
      title: 'SOP-02: Systematic Investment Plan (SIP) Processing & Disclaimers',
      category: 'SOPS',
      productCode: 'SIP',
      content: `### SOP-02: SIP Processing Standards
1. **Suitability & Risk Profiling**: Ensure customer understands that mutual funds are subject to market risks. Read all scheme related documents carefully.
2. **Mandate Creation**: Explain e-Mandate / NACH cycle (usually takes T+2 business days for banking registration).
3. **Illustrations vs Guarantees**: Any calculator or growth projection is strictly illustrative. Do not promise fixed percentage returns.
4. **Step-Up SIP Options**: Explain the optional annual top-up feature for compounding benefits.`,
      status: 'APPROVED',
      applicableRole: 'EMPLOYEE',
      authorName: 'Wealth Operations',
    },
    {
      title: 'SOP-03: Loan Against Securities (LAS) Eligibility & Pledging',
      category: 'SOPS',
      productCode: 'LOAN_AGAINST_SECURITIES',
      content: `### SOP-03: Loan Against Securities Operations
1. **Approved Scrip List**: Verify customer's demat holdings against the approved category A & B scrip list.
2. **Loan-To-Value (LTV)**: Equity shares carry a maximum regulatory LTV of 50%. Debt mutual funds carry up to 80%.
3. **Pledge Invocation**: Inform borrower about margin call triggers if collateral value drops below maintenance margin (125%).
4. **Disbursement**: Funds disbursed directly by partner NBFC/Bank to the customer's linked savings account.`,
      status: 'APPROVED',
      applicableRole: 'EMPLOYEE',
      authorName: 'Credit Operations',
    },
    {
      title: 'Compliance Guideline: Regulatory Boundaries for TWM Representatives',
      category: 'COMPLIANCE',
      productCode: 'GENERAL',
      content: `### SEBI Regulatory Boundaries for TWM
1. **No Unregistered Advisory**: TWM is NOT a SEBI-registered Investment Adviser (RIA) or Research Analyst (RA).
2. **Prohibited Conduct**:
   - Do NOT provide personalized stock buy/sell/hold calls.
   - Do NOT provide intraday trading tips or WhatsApp broadcast calls.
   - Do NOT operate discretionary client accounts.
   - Do NOT promise guaranteed returns on equity or mutual fund products.
3. **Permitted Conduct**:
   - Provide factual market information, index constituents, and publicly reported financial data.
   - Assist clients in opening accounts and using SMC Ace execution platform.
   - Assist in document collection, KYC completion, and status tracking.
   - Provide financial literacy and educational material.`,
      status: 'APPROVED',
      applicableRole: 'ALL',
      authorName: 'Principal Officer',
    },
  ];

  for (const article of knowledgeArticles) {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { title: article.title },
    });
    if (!existing) {
      await prisma.knowledgeArticle.create({ data: article });
    }
  }

  // 7. Initial Customer Application & Notification (Development/Test)
  if (clientUser.customerProfile && employeeUser.employeeProfile) {
    const existingApp = await prisma.application.findFirst({
      where: { customerId: clientUser.customerProfile.id },
    });

    if (!existingApp) {
      const app = await prisma.application.create({
        data: {
          applicationNumber: 'TWM-APP-2026-0001',
          customerId: clientUser.customerProfile.id,
          productCategory: 'DEMAT',
          productCode: 'SMC_DEMAT',
          assignedEmployeeId: employeeUser.employeeProfile.id,
          status: 'UNDER_REVIEW',
          detailsJson: JSON.stringify({
            applicantName: 'Aditya Mehta',
            email: 'client@tradosphere.in',
            segments: ['Cash', 'F&O'],
            depository: 'NSDL',
            bankName: 'HDFC Bank Ltd',
          }),
          notes: 'DigiLocker KYC documents received and verified. Awaiting exchange signature upload.',
        },
      });

      // Add a test task for employee
      await prisma.task.create({
        data: {
          title: 'Review exchange signature for Aditya Mehta (TWM-APP-2026-0001)',
          description: 'Check IPV video verification clip and signature consistency for Demat activation.',
          customerId: clientUser.customerProfile.id,
          assignedEmployeeId: employeeUser.employeeProfile.id,
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Add a test notification for client
      await prisma.notification.create({
        data: {
          userId: clientUser.id,
          title: 'Application Under Review',
          message: 'Your SMC Demat & Trading application #TWM-APP-2026-0001 is currently under review by our operations desk.',
          category: 'APPLICATION',
          linkUrl: '/applications',
        },
      });

      // Add a test lead for CRM pipeline
      await prisma.lead.create({
        data: {
          name: 'Priya Sundaram',
          phone: '+91 98111 22334',
          email: 'priya.sundaram@test.example',
          source: 'WEBSITE',
          productInterest: 'MUTUAL_FUND',
          status: 'NEW_LEAD',
          assignedEmployeeId: employeeUser.employeeProfile.id,
          notes: 'Inquired about balanced advantage fund SIPs for retirement planning.',
        },
      });
    }
  }

  // 8. Log initial audit entry
  await prisma.activityLog.create({
    data: {
      actorUserId: adminUser.id,
      actorRole: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'System',
      detailsJson: JSON.stringify({ version: '1.0.0', environment: 'development' }),
    },
  });

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
