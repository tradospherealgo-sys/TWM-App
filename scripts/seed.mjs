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

  // 8. Seed Signals Subscription Plan & Settings
  const plan = await prisma.subscriptionPlan.upsert({
    where: { code: 'SIGNALS_MONTHLY' },
    update: { price: 499 },
    create: {
      code: 'SIGNALS_MONTHLY',
      name: 'TWM Signals & Market Intelligence',
      description: 'Curated multi-asset market intelligence, approved research, macro analysis, and risk alerts evaluated by the TWM 6-agent review team.',
      price: 499,
      currency: 'INR',
      billingPeriod: 'MONTHLY',
      featuresJson: JSON.stringify([
        'Multi-Asset Intelligence (Equity, F&O, Indices, Commodity, IPO)',
        '6-Agent AI Review & Compliance Transparency',
        'Real-Time In-App Critical Risk Alerts',
        'Approved Research & Educational Breakdowns',
        'Direct SMC Ace Trading Portal Handoffs'
      ]),
      includedCategoriesJson: JSON.stringify([
        'F_AND_O', 'EQUITY', 'INDEX', 'COMMODITY', 'IPO', 'MUTUAL_FUNDS',
        'SIP', 'MARKET_OUTLOOK', 'CORPORATE_ACTIONS', 'MACRO_EVENTS', 'RISK_ALERTS', 'EDUCATIONAL'
      ]),
      disclaimer: 'All signals and market intelligence provided through TWM are for informational and educational purposes only and do not constitute personal investment advice or guaranteed return recommendations. Trading in equities, derivatives, and commodities involves substantial risk of loss.',
      isActive: true,
    },
  });

  await prisma.signalSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      monthlyPrice: 499,
      billingPeriod: 'MONTHLY',
      enabledCategoriesJson: JSON.stringify([
        'F_AND_O', 'EQUITY', 'INDEX', 'COMMODITY', 'IPO', 'MUTUAL_FUNDS',
        'SIP', 'MARKET_OUTLOOK', 'CORPORATE_ACTIONS', 'MACRO_EVENTS', 'RISK_ALERTS', 'EDUCATIONAL'
      ]),
      subscriptionRequired: true,
      notificationsEnabled: true,
      aiProvider: 'heuristic',
      aiModel: 'twm-compliance-engine-v1',
      disclaimer: 'Market intelligence provided is strictly non-advisory. Derivatives and equities carry capital risk. Verify suitability with your financial planner before execution on SMC Ace.',
    },
  });

  // 9. Seed Sample Published Signal with complete AI review team outputs
  const publishedSignal = await prisma.signal.upsert({
    where: { slug: 'nifty-50-range-breakout-analysis' },
    update: {},
    create: {
      slug: 'nifty-50-range-breakout-analysis',
      title: 'NIFTY 50 Range Breakout & Macro Volatility Analysis',
      category: 'INDEX',
      subcategory: 'Macro / Technical',
      instrument: 'NIFTY 50 Index',
      exchange: 'NSE',
      symbol: 'NIFTY',
      summary: 'NIFTY consolidates near upper band of recent trading range with elevated implied volatility ahead of the scheduled monetary policy announcement.',
      content: '## Executive Market Intelligence Summary\n\nNIFTY 50 index is exhibiting consolidation around key technical psychological zones following sustained institutional inflows over recent settlement cycles.\n\n### Macro & Derivatives Structure\n- **Open Interest Distribution**: Maximum call open interest concentration is observed at higher strike bands, indicating immediate resistance, while put writing is prominent at lower support zones.\n- **Volatility Context**: India VIX has edged higher, reflecting event pricing ahead of the upcoming monetary policy decision.\n- **Sector Rotation**: Banking and IT constituents display divergent momentum, with Financial Services providing defensive stabilization.\n\n### Operational Guidance\nThis analysis is provided exclusively for risk framing and strategic scenario evaluation. All trade execution should be routed through official SMC Ace trading terminals.',
      source: 'Institutional Research Desk',
      provider: 'Tradosphere Analytics Desk',
      author: 'Senior Quant Strategist',
      supportingInfo: 'NSE Official Derivative Statistics, RBI MPC Schedule',
      validityType: 'SESSION',
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      riskLevel: 'MODERATE',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      version: 1,
      createdByUserId: adminUser.id,
      approvedByUserId: adminUser.id,
      publishedByUserId: adminUser.id,
      aiReviews: {
        create: [
          {
            agentName: 'ATLAS',
            agentRole: 'Market Context & Macro Intelligence',
            model: 'twm-atlas-v1',
            status: 'SUCCESS',
            complianceStatus: 'PASS',
            summary: 'Macro context is balanced. Domestic liquidity remains supportive while global bond yields present minor headwinds.',
            analysisJson: JSON.stringify({
              context: 'Consolidation phase near historical highs.',
              supportingFactors: ['Domestic institutional net buying', 'Stable core inflation prints'],
              conflictingFactors: ['Elevated crude oil volatility', 'FII hedging activity in index futures'],
              dataQuality: 'GOOD',
              dataTimestamp: new Date().toISOString()
            }),
            latencyMs: 120
          },
          {
            agentName: 'VECTOR',
            agentRole: 'Technical & Quantitative Intelligence',
            model: 'twm-vector-v1',
            status: 'SUCCESS',
            complianceStatus: 'PASS',
            summary: 'Price structure exhibits positive momentum on the daily timeframe; RSI remains neutral with no immediate overbought divergence.',
            analysisJson: JSON.stringify({
              trend: 'Bullish consolidation',
              keyLevels: { support: '20-day EMA support band', resistance: 'Upper Bollinger Band boundary' },
              momentum: 'Moderate positive',
              dataQuality: 'GOOD'
            }),
            latencyMs: 140
          },
          {
            agentName: 'ORION',
            agentRole: 'Fundamental & Event Intelligence',
            model: 'twm-orion-v1',
            status: 'SUCCESS',
            complianceStatus: 'PASS',
            summary: 'Scheduled RBI Monetary Policy Committee statement represents the primary material event risk in the current settlement cycle.',
            analysisJson: JSON.stringify({
              upcomingEvents: ['RBI MPC Interest Rate Decision', 'US Initial Jobless Claims'],
              earningsImpact: 'Neutral across index heavyweights',
              eventRisk: 'MODERATE'
            }),
            latencyMs: 110
          },
          {
            agentName: 'SENTINEL',
            agentRole: 'Risk & Data Integrity Intelligence',
            model: 'twm-sentinel-v1',
            status: 'SUCCESS',
            complianceStatus: 'PASS',
            summary: 'Derivatives data freshness verified. Implied volatility premium elevated by 4.2% across near-month strikes.',
            analysisJson: JSON.stringify({
              volatilityRisk: 'MODERATE',
              liquidityStatus: 'DEEP_AND_LIQUID',
              dataFreshness: 'FRESH',
              staleDataWarnings: []
            }),
            latencyMs: 95
          },
          {
            agentName: 'AEGIS',
            agentRole: 'Compliance & Regulatory Review',
            model: 'twm-aegis-v1',
            status: 'SUCCESS',
            complianceStatus: 'PASS',
            summary: 'Content reviewed against SEBI Authorised Person guidelines. Contains zero buy/sell directives, zero price targets, and full statutory disclaimers.',
            analysisJson: JSON.stringify({
              verdict: 'PASS',
              prohibitedClaimsCheck: 'CLEAN - No guaranteed returns or directional tips',
              disclosuresPresent: true,
              sourceAttributed: true
            }),
            latencyMs: 80
          },
          {
            agentName: 'NEXUS',
            agentRole: 'Intelligence Synthesis Coordinator',
            model: 'twm-nexus-v1',
            status: 'SUCCESS',
            complianceStatus: 'PASS',
            summary: 'Atlas, Vector, Orion, Sentinel, and Aegis in consensus. Recommended human action: REVIEW FOR PUBLICATION.',
            analysisJson: JSON.stringify({
              recommendedHumanAction: 'REVIEW',
              consensusScore: 96,
              agentAgreements: 'Technical momentum aligns with domestic macro stability; derivatives caution highlighted by Sentinel.',
              conflicts: [],
              missingInformation: []
            }),
            latencyMs: 150
          }
        ]
      }
    }
  });

  // 10. Seed a Draft Signal for workflow testing
  await prisma.signal.upsert({
    where: { slug: 'reliance-grm-petrochemical-outlook' },
    update: {},
    create: {
      slug: 'reliance-grm-petrochemical-outlook',
      title: 'Reliance Industries Refining Margins & Energy Outlook',
      category: 'EQUITY',
      subcategory: 'Energy & Petrochemicals',
      instrument: 'RELIANCE Equity',
      exchange: 'NSE',
      symbol: 'RELIANCE',
      summary: 'Gross refining margins stabilize while downstream petrochemical margins recover from cyclical lows.',
      content: '## Fundamental Research Brief\n\nReliance Industries demonstrates structural operational resilience with integrated refinery margins outperforming Singapore benchmark GRMs.\n\n### Operational Observations\n- **Refining Utilization**: Throughput remains consistently above nameplate capacity.\n- **Retail & Digital Momentum**: Continued double-digit top-line growth in consumer business verticals.\n- **Balance Sheet Deleveraging**: Net debt-to-EBITDA remains comfortably below threshold benchmarks.\n\n*Review required prior to publication.*',
      source: 'NSE Corporate Filings & Annual Disclosures',
      provider: 'Tradosphere Research Desk',
      author: 'Energy Research Lead',
      validityType: 'SWING',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      riskLevel: 'LOW',
      status: 'DRAFT',
      version: 1,
      createdByUserId: adminUser.id,
    }
  });

  // 11. Log initial audit entry
  await prisma.activityLog.create({
    data: {
      actorUserId: adminUser.id,
      actorRole: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'System',
      detailsJson: JSON.stringify({ version: '1.1.0', environment: 'development', module: 'SIGNALS' }),
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
