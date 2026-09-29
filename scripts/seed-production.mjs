import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding TWM Production Foundation Data ---');
  console.log('(Insecure development test accounts are strictly EXCLUDED)');

  // 1. Approved Product Catalog
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
  console.log(`✓ Upserted ${products.length} approved financial products`);

  // 2. Approved Knowledge Base Articles & SOPs
  const knowledgeArticles = [
    {
      title: 'SOP-01: SMC Global Demat & Trading Onboarding Workflow',
      category: 'SOPS',
      productCode: 'SMC_DEMAT',
      content: `### SOP-01: SMC Global Demat Onboarding Protocol\n1. **Verification**: Verify client PAN against income tax records and CKYC registry.\n2. **Authorised Person Disclosure**: Disclose clearly to client that Tradosphere Wealth Management operates as an Authorised Person of SMC Global Securities Ltd.\n3. **Execution Boundary**: All actual trade routing and depository accounts reside directly with SMC Global.\n4. **Document Checklist**:\n   - PAN Card (Self-attested)\n   - Aadhaar Card (DigiLocker verified or masked XML)\n   - Bank Proof (Bank Statement with IFSC or Cancelled Cheque with name printed)\n   - Income Proof (mandatory for Derivatives segment: 6-month bank statement or latest ITR-V)\n5. **No Guarantees**: Never promise trading returns or price targets under any circumstances.`,
      status: 'APPROVED',
      applicableRole: 'ALL',
      authorName: 'TWM Compliance Dept',
    },
    {
      title: 'SOP-02: Systematic Investment Plan (SIP) Processing & Disclaimers',
      category: 'SOPS',
      productCode: 'SIP',
      content: `### SOP-02: SIP Processing Standards\n1. **Suitability & Risk Profiling**: Ensure customer understands that mutual funds are subject to market risks. Read all scheme related documents carefully.\n2. **Mandate Creation**: Explain e-Mandate / NACH cycle (usually takes T+2 business days for banking registration).\n3. **Illustrations vs Guarantees**: Any calculator or growth projection is strictly illustrative. Do not promise fixed percentage returns.\n4. **Step-Up SIP Options**: Explain the optional annual top-up feature for compounding benefits.`,
      status: 'APPROVED',
      applicableRole: 'EMPLOYEE',
      authorName: 'Wealth Operations',
    },
    {
      title: 'SOP-03: Loan Against Securities (LAS) Eligibility & Pledging',
      category: 'SOPS',
      productCode: 'LOAN_AGAINST_SECURITIES',
      content: `### SOP-03: Loan Against Securities Operations\n1. **Approved Scrip List**: Verify customer's demat holdings against the approved category A & B scrip list.\n2. **Loan-To-Value (LTV)**: Equity shares carry a maximum regulatory LTV of 50%. Debt mutual funds carry up to 80%.\n3. **Pledge Invocation**: Inform borrower about margin call triggers if collateral value drops below maintenance margin (125%).\n4. **Disbursement**: Funds disbursed directly by partner NBFC/Bank to the customer's linked savings account.`,
      status: 'APPROVED',
      applicableRole: 'EMPLOYEE',
      authorName: 'Credit Operations',
    },
    {
      title: 'Compliance Guideline: Regulatory Boundaries for TWM Representatives',
      category: 'COMPLIANCE',
      productCode: 'GENERAL',
      content: `### SEBI Regulatory Boundaries for TWM\n1. **No Unregistered Advisory**: TWM is NOT a SEBI-registered Investment Adviser (RIA) or Research Analyst (RA).\n2. **Prohibited Conduct**:\n   - Do NOT provide personalized stock buy/sell/hold calls.\n   - Do NOT provide intraday trading tips or WhatsApp broadcast calls.\n   - Do NOT operate discretionary client accounts.\n   - Do NOT promise guaranteed returns on equity or mutual fund products.\n3. **Permitted Conduct**:\n   - Provide factual market information, index constituents, and publicly reported financial data.\n   - Assist clients in opening accounts and using SMC Ace execution platform.\n   - Assist in document collection, KYC completion, and status tracking.\n   - Provide financial literacy and educational material.`,
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
  console.log(`✓ Verified ${knowledgeArticles.length} approved SOP knowledge articles`);

  // 3. Signals Subscription Plan (₹499/mo)
  await prisma.subscriptionPlan.upsert({
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
  console.log('✓ Upserted SIGNALS_MONTHLY subscription plan (₹499/mo)');

  // 4. Signal Settings Singleton
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
  console.log('✓ Upserted default Signal Settings');

  console.log('--- Production Foundation Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Production seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
