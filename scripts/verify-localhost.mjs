// scripts/verify-localhost.mjs
// Comprehensive live verification script for Tradosphere Wealth Management (TWM)
// Includes Core Baseline + Signals & Market Intelligence Module

const BASE_URL = 'http://localhost:3000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // not JSON
  }
  return { status: res.status, headers: res.headers, text, json };
}

function parseCookie(headers) {
  const setCookie = headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/twm_session=([^;]+)/);
  return match ? `twm_session=${match[1]}` : null;
}

const results = [];

function record(name, pass, details = '') {
  results.push({ name, pass, details });
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} [${name}]: ${details}`);
}

async function run() {
  console.log('====================================================');
  console.log('STARTING TWM LOCALHOST LIVE SYSTEM VERIFICATION');
  console.log('Target:', BASE_URL);
  console.log('====================================================\n');

  // 1. AUTHENTICATION & SESSIONS
  console.log('--- 1. AUTHENTICATION & SESSIONS ---');
  
  const clientLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'client@tradosphere.in', password: 'Client@123456' })
  });
  const clientCookie = parseCookie(clientLogin.headers);
  record('Client Login', clientLogin.status === 200 && !!clientCookie, `Status ${clientLogin.status}, Session: ${!!clientCookie}`);

  const empLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'employee@tradosphere.in', password: 'Employee@123456' })
  });
  const empCookie = parseCookie(empLogin.headers);
  record('Employee Login', empLogin.status === 200 && !!empCookie, `Status ${empLogin.status}, Session: ${!!empCookie}`);

  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@tradosphere.in', password: 'Admin@123456' })
  });
  const adminCookie = parseCookie(adminLogin.headers);
  record('Admin Login', adminLogin.status === 200 && !!adminCookie, `Status ${adminLogin.status}, Session: ${!!adminCookie}`);

  // 2. CLIENT WORKFLOWS & PAGES
  console.log('\n--- 2. CLIENT BASELINE WORKFLOWS ---');
  
  const clientHome = await request('/home', { headers: { Cookie: clientCookie } });
  record('Client /home Access', clientHome.status === 200, `Status ${clientHome.status}`);

  const clientMarkets = await request('/markets', { headers: { Cookie: clientCookie } });
  record('Client /markets Access', clientMarkets.status === 200, `Status ${clientMarkets.status}`);

  const equitiesRes = await request('/api/market/stocks?q=RELIANCE', { headers: { Cookie: clientCookie } });
  const hasReliance = equitiesRes.json?.stocks?.some(s => s.symbol === 'RELIANCE');
  record('Equities Directory Search (NSE)', equitiesRes.status === 200 && hasReliance, `Found RELIANCE in directory`);

  const quoteRes = await request('/api/market/stocks/RELIANCE', { headers: { Cookie: clientCookie } });
  const quoteStatus = quoteRes.json?.stock?.status;
  record('Equities Quote Honesty Check', quoteRes.status === 200 && quoteStatus === 'DATA_UNAVAILABLE', `Status: ${quoteStatus} (No fake data)`);

  const appRes = await request('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientCookie },
    body: JSON.stringify({
      productCategory: 'DEMAT',
      productCode: 'smc-demat-trading',
      details: { applicantName: 'Test Client', pan: 'ABCDE1234F', mobile: '9876543210' },
      notes: 'Live verification test application'
    })
  });
  const createdApp = appRes.json?.application;
  record('Client Application Submission', appRes.status === 200 && !!createdApp?.id, `App Number: ${createdApp?.applicationNumber}`);

  const ticketRes = await request('/api/support/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientCookie },
    body: JSON.stringify({
      subject: 'Inquiry regarding Demat onboarding',
      description: 'Need assistance with client registration.',
      priority: 'MEDIUM',
      applicationId: createdApp?.id
    })
  });
  const createdTicket = ticketRes.json?.ticket;
  record('Client Support Ticket Submission', ticketRes.status === 200 && !!createdTicket?.id, `Ticket Number: ${createdTicket?.ticketNumber}`);

  // 3. EMPLOYEE OS WORKFLOWS
  console.log('\n--- 3. EMPLOYEE OS WORKFLOWS ---');

  const empDash = await request('/employee', { headers: { Cookie: empCookie } });
  record('Employee /employee Access', empDash.status === 200, `Status ${empDash.status}`);

  const copilotSop = await request('/api/copilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: empCookie },
    body: JSON.stringify({ query: 'What is the procedure for Demat onboarding?' })
  });
  record('AI Copilot SOP Retrieval', copilotSop.status === 200 && (copilotSop.json?.response?.answer?.length || 0) > 20, `Answer received`);

  const copilotAdvisory = await request('/api/copilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: empCookie },
    body: JSON.stringify({ query: 'Which stock should I buy for 20% return?' })
  });
  record('AI Copilot Non-Advisory Blocking', copilotAdvisory.status === 200 && copilotAdvisory.json?.response?.isCompliant === false, `Blocked with warning`);

  // 4. SIGNALS & MARKET INTELLIGENCE MODULE VERIFICATION
  console.log('\n--- 4. SIGNALS & MARKET INTELLIGENCE MODULE ---');

  // Client non-subscribed: Paywall verification
  const signalsClientRes = await request('/api/signals', { headers: { Cookie: clientCookie } });
  const clientSignals = signalsClientRes.json?.signals || [];
  const isPaywalled = clientSignals.some(s => s.requiresSubscription === true && s.content === null);
  record('Signals Paywall (Non-Subscribed Client)', signalsClientRes.status === 200 && isPaywalled, `Signals received with paywall redaction`);

  // Client subscription activation
  const subRes = await request('/api/signals/subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientCookie },
    body: JSON.stringify({ action: 'SUBSCRIBE' })
  });
  record('Signals Subscription Activation (₹499/mo Plan)', subRes.status === 200 && subRes.json?.success === true, `Subscribed successfully`);

  // Subscribed client: Content unlocked
  const signalsUnlockedRes = await request('/api/signals', { headers: { Cookie: clientCookie } });
  const unlockedSignals = signalsUnlockedRes.json?.signals || [];
  const isUnlocked = unlockedSignals.some(s => s.requiresSubscription === false);
  record('Signals Entitlement (Subscribed Client)', signalsUnlockedRes.status === 200 && isUnlocked, `Content successfully unlocked for subscriber`);

  // Client UI route checks
  const clientSignalsPage = await request('/signals', { headers: { Cookie: clientCookie } });
  record('Client /signals Page Access', clientSignalsPage.status === 200, `Status ${clientSignalsPage.status}`);

  if (unlockedSignals.length > 0) {
    const signalDetailPage = await request(`/signals/${unlockedSignals[0].id}`, { headers: { Cookie: clientCookie } });
    record('Client /signals/[id] Detail Page Access', signalDetailPage.status === 200, `Status ${signalDetailPage.status}`);
  }

  // Admin Create Signal Draft
  const createSignalRes = await request('/api/signals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      title: 'State Bank of India Asset Quality Review',
      category: 'EQUITY',
      instrument: 'SBIN Equity',
      exchange: 'NSE',
      symbol: 'SBIN',
      summary: 'Public sector banking credit cycle and net interest margin trajectory.',
      content: '## Research Brief: State Bank of India\n\nAsset quality continues to reflect multi-year lows in gross and net non-performing asset ratios.\n\n### Operational Metrics\n- Credit growth tracking above system averages.\n- Provision coverage ratio remains strong at 75%+.\n\nNon-advisory research for institutional context.',
      source: 'Banking Sector Desk',
      provider: 'Tradosphere Analytics',
      author: 'Senior Financials Analyst',
      validityType: 'SWING',
      riskLevel: 'LOW'
    })
  });
  const createdSignal = createSignalRes.json?.signal;
  record('Admin Signal Creation (DRAFT)', createSignalRes.status === 200 && !!createdSignal?.id, `Created Signal ID: ${createdSignal?.id}`);

  // Admin Trigger 6-Agent AI Review Team
  let aiReviewOk = false;
  let hasAtlas = false;
  let hasVector = false;
  let hasOrion = false;
  let hasSentinel = false;
  let hasAegis = false;
  let hasNexus = false;

  if (createdSignal?.id) {
    const aiRes = await request(`/api/signals/${createdSignal.id}/ai-review`, {
      method: 'POST',
      headers: { Cookie: adminCookie }
    });
    aiReviewOk = aiRes.status === 200 && aiRes.json?.success === true;
    const reviews = aiRes.json?.signal?.aiReviews || [];
    hasAtlas = reviews.some(r => r.agentName === 'ATLAS');
    hasVector = reviews.some(r => r.agentName === 'VECTOR');
    hasOrion = reviews.some(r => r.agentName === 'ORION');
    hasSentinel = reviews.some(r => r.agentName === 'SENTINEL');
    hasAegis = reviews.some(r => r.agentName === 'AEGIS');
    hasNexus = reviews.some(r => r.agentName === 'NEXUS');
  }
  record('6-Agent AI Review Execution', aiReviewOk && hasAtlas && hasVector && hasOrion && hasSentinel && hasAegis && hasNexus, `Atlas, Vector, Orion, Sentinel, Aegis, Nexus all executed`);

  // Human Review & Approval
  let approveOk = false;
  if (createdSignal?.id) {
    const approveRes = await request(`/api/signals/${createdSignal.id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ action: 'APPROVE', notes: 'Approved for publication' })
    });
    approveOk = approveRes.status === 200 && approveRes.json?.signal?.status === 'APPROVED';
  }
  record('Admin Human Review & Approval', approveOk, `Status transitioned to APPROVED`);

  // Publish Signal & Dispatch Subscriber Notifications
  let publishOk = false;
  if (createdSignal?.id) {
    const pubRes = await request(`/api/signals/${createdSignal.id}/publish`, {
      method: 'POST',
      headers: { Cookie: adminCookie }
    });
    publishOk = pubRes.status === 200 && pubRes.json?.signal?.status === 'PUBLISHED';
  }
  record('Admin Publish Signal & Broadcast Notifications', publishOk, `Status transitioned to PUBLISHED`);

  // Regulatory Hardening: Aegis BLOCK on Prohibited Claim
  const badSignalRes = await request('/api/signals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      title: 'Prohibited Stock Tip with Guaranteed Returns',
      category: 'F_AND_O',
      summary: '100% guaranteed profit sure shot call',
      content: 'Guaranteed return risk-free jackpot call. You must buy now.',
      source: 'Internal',
      provider: 'Internal',
      author: 'Anonymous'
    })
  });
  const badSignal = badSignalRes.json?.signal;

  let aegisBlocked = false;
  let humanApproveDenied = false;
  if (badSignal?.id) {
    const badAiRes = await request(`/api/signals/${badSignal.id}/ai-review`, {
      method: 'POST',
      headers: { Cookie: adminCookie }
    });
    const reviews = badAiRes.json?.signal?.aiReviews || [];
    const aegis = reviews.find(r => r.agentName === 'AEGIS');
    aegisBlocked = aegis?.complianceStatus === 'BLOCK';

    const badApproveRes = await request(`/api/signals/${badSignal.id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ action: 'APPROVE' })
    });
    humanApproveDenied = badApproveRes.status === 400;
  }
  record('Aegis Compliance Gatekeeper BLOCK Enforcement', aegisBlocked && humanApproveDenied, `Aegis BLOCK prevented human approval (Status 400)`);

  // Employee Signals View-Only Access & Publishing RBAC Barrier
  const empSignalsPage = await request('/employee/signals', { headers: { Cookie: empCookie } });
  record('Employee /employee/signals Page Access', empSignalsPage.status === 200, `Status ${empSignalsPage.status}`);

  if (createdSignal?.id) {
    const empPublishAttempt = await request(`/api/signals/${createdSignal.id}/publish`, {
      method: 'POST',
      headers: { Cookie: empCookie }
    });
    record('Employee Publishing RBAC Barrier', empPublishAttempt.status === 403, `Staff denied publish access (Status ${empPublishAttempt.status})`);
  }

  // Admin Signals Settings
  const settingsRes = await request('/api/admin/signals/settings', { headers: { Cookie: adminCookie } });
  record('Admin Signals Settings API', settingsRes.status === 200 && settingsRes.json?.settings?.monthlyPrice !== undefined, `Configured Price: ₹${settingsRes.json?.settings?.monthlyPrice}/mo`);

  // 5. SYSTEM HEALTH PRE-FLIGHT
  console.log('\n--- 5. SYSTEM HEALTH PRE-FLIGHT ---');
  const healthRes = await request('/api/admin/system-health', { headers: { Cookie: adminCookie } });
  const healthData = healthRes.json?.health;
  record(
    'System Health 15-Subsystem Pre-Flight',
    healthRes.status === 200 && healthData?.subsystems?.length === 15,
    `Launch Gate: "${healthData?.gateMessage || healthData?.overallStatus}"`
  );

  console.log('\n====================================================');
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  console.log(`SUMMARY: ${passed} / ${total} VERIFICATIONS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================');
}

run().catch(console.error);
