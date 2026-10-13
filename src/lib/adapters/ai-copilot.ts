import prisma from '../prisma';
import { decryptSecretsMap } from '../encryption';

/**
 * Shared AI Copilot Adapter for Tradosphere Wealth Management (TWM)
 * Shared backend powering Admin, Employee Desk, and Client Guidance.
 * 
 * Boundaries (Section 4, 14-23, Master Reference):
 * - Strict SEBI non-advisory guardrails across ALL roles.
 * - Authenticated server-side role gating:
 *   - CLIENT: Service guidance, onboarding & KYC checklist, application status, educational concepts.
 *   - EMPLOYEE: Daily task priorities, compliant client outreach drafts, case summaries, SOP lookup.
 *   - ADMIN: CRM & pipeline metrics, staff workload insights, signal governance, operations.
 * - Supports Google Gemini, Groq Cloud, and OpenAI when credentials are configured.
 * - Graceful fallback to verified compliant database SOP engine when offline or unconfigured.
 */

export interface CopilotResponse {
  answer: string;
  sources: Array<{ title: string; category: string }>;
  isCompliant: boolean;
  warning?: string;
  providerUsed?: string;
}

export interface CopilotUserContext {
  id: string;
  role: string;
  name?: string;
  employeeProfile?: { id: string; department?: string; designation?: string } | null;
  customerProfile?: { id: string; customerCode?: string; kycStatus?: string } | null;
}

// Regulatory and advisory stop patterns based on SEBI non-advisory regulations
export const PROHIBITED_ADVISORY_PATTERNS = [
  /buy\s+[a-z0-9]+/i,
  /sell\s+[a-z0-9]+/i,
  /buy.*(stock|share|equity|call|put|derivative)/i,
  /sell.*(stock|share|equity|call|put|derivative)/i,
  /(stock|share|equity).*buy/i,
  /(stock|share|equity).*sell/i,
  /should\s+i\s+(buy|sell|invest\s+in)/i,
  /what\s+stock\s+should/i,
  /which\s+stock/i,
  /stock\s+tip/i,
  /target\s+price/i,
  /guarantee.*(return|profit|gain|outcome)/i,
  /guaranteed\s+(return|profit|gain)/i,
  /sure\s*shot/i,
  /best\s+stock/i,
  /multibagger/i,
  /trading\s+signal/i,
  /customer.*invest\s+in/i,
  /client.*invest\s+in/i,
  /(give|create|build|recommend).*(portfolio|stock\s+allocation)/i,
  /give\s+this\s+customer\s+a\s+portfolio/i,
  /approve\s+(loan|demat|application)\s+automatically/i,
];

/**
 * Fetch configured AI provider credentials server-side from IntegrationConfig or env
 */
async function getAIProviderConfig(): Promise<{
  provider: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
} | null> {
  // 1. Check IntegrationConfig in DB
  try {
    const config = await prisma.integrationConfig.findUnique({
      where: { providerKey: 'AI_PROVIDER' },
    });

    if (config) {
      const secrets = decryptSecretsMap(config.encryptedSecrets);
      const publicConfig = JSON.parse(config.publicConfigJson || '{}');
      const apiKey = secrets.apiKey || process.env.AI_PROVIDER_API_KEY;

      if (apiKey && apiKey.trim().length > 0) {
        return {
          provider: publicConfig.provider || 'google',
          apiKey: apiKey.trim(),
          model: publicConfig.model || (publicConfig.provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-1.5-flash'),
          baseUrl: publicConfig.baseUrl,
        };
      }
    }
  } catch {
    // Continue to env fallback
  }

  // 2. Check process.env fallback
  const envKey = process.env.AI_PROVIDER_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    return {
      provider: 'google',
      apiKey: envKey.trim(),
      model: process.env.AI_PROVIDER_MODEL || 'gemini-1.5-flash',
    };
  }

  return null;
}

/**
 * Safe external LLM invocation with strict timeout and fallback
 */
async function callExternalLLM(
  cfg: { provider: string; apiKey: string; model: string; baseUrl?: string },
  systemInstruction: string,
  userPrompt: string
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    if (cfg.provider === 'google') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        cfg.model
      )}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.2 },
        }),
      });

      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) return candidate.trim();
      }
    } else if (cfg.provider === 'groq') {
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: cfg.model || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 600,
          temperature: 0.2,
        }),
      });

      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const msg = data?.choices?.[0]?.message?.content;
        if (msg) return msg.trim();
      }
    } else if (cfg.provider === 'openai' || cfg.provider === 'custom') {
      const baseUrl = (cfg.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
      const url = `${baseUrl}/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: cfg.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 600,
          temperature: 0.2,
        }),
      });

      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const msg = data?.choices?.[0]?.message?.content;
        if (msg) return msg.trim();
      }
    }
  } catch (err) {
    // Network timeout or provider outage
  } finally {
    clearTimeout(timeoutId);
  }

  return null;
}

/**
 * Shared Copilot entry point for Admin, Employee, and Client
 */
export async function askSharedCopilot(
  query: string,
  user: CopilotUserContext,
  context?: { leadName?: string; product?: string; customerId?: string }
): Promise<CopilotResponse> {
  const trimmed = query.trim();

  // 1. Mandatory Regulatory Boundary Check (Applies strictly across all roles)
  for (const pattern of PROHIBITED_ADVISORY_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        answer:
          'REGULATORY BOUNDARY NOTICE: Tradosphere Wealth Management operates as an Authorised Person (AP) of SMC Global Securities Ltd and is not independently registered as a SEBI Investment Adviser or Research Analyst. The AI Copilot is strictly prohibited from generating stock tips, buy/sell calls, individual portfolio recommendations, price targets, or guaranteed return claims under SEBI compliance guidelines.',
        sources: [
          {
            title: 'Compliance Guideline: Regulatory Boundaries for TWM Representatives',
            category: 'COMPLIANCE',
          },
        ],
        isCompliant: false,
        warning: 'Advisory query blocked under SEBI non-advisory compliance rules.',
      };
    }
  }

  // 2. Fetch approved Knowledge Base articles matching user role
  let articles: any[] = [];
  try {
    const roleFilter = user.role === 'ADMIN'
      ? ['ALL', 'ADMIN', 'EMPLOYEE']
      : user.role === 'EMPLOYEE'
      ? ['ALL', 'EMPLOYEE']
      : ['ALL', 'CLIENT'];

    articles = await prisma.knowledgeArticle.findMany({
      where: {
        status: 'APPROVED',
        applicableRole: { in: roleFilter },
      },
    });
  } catch {
    articles = [
      {
        id: 'built-in-sop-1',
        title: 'Client Demat & Trading Account Onboarding SOP',
        category: 'ONBOARDING',
        content: 'Step 1: Collect PAN and Aadhaar. Step 2: Route through SMC Ace onboarding portal. Step 3: Verify documents.',
        status: 'APPROVED',
      },
      {
        id: 'built-in-sop-2',
        title: 'Customer Follow-up Protocol & Operational Communication',
        category: 'COMMUNICATION',
        content: 'Maintain factual, courteous, non-advisory operational communication regarding account and document status.',
        status: 'APPROVED',
      },
      {
        id: 'built-in-sop-3',
        title: 'Client KYC Documentation Checklist',
        category: 'COMPLIANCE',
        content: 'Mandatory documents: PAN Card, Proof of Identity (Aadhaar/Passport), Address Proof, Bank Proof (Cancelled cheque or 3-month statement), and 6-month bank statement for F&O derivative activation.',
        status: 'APPROVED',
      },
      {
        id: 'built-in-sop-4',
        title: 'Mutual Funds & Systematic Investment Plan (SIP) Guidelines',
        category: 'INVESTMENT',
        content: 'SIP allows automated monthly investments in diversified mutual funds. Mandates are registered via e-NACH/NetBanking. Investments are subject to market risks.',
        status: 'APPROVED',
      },
    ];
  }

  const queryWords = trimmed.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const matched = articles.filter((art) => {
    const text = `${art.title} ${art.content} ${art.category}`.toLowerCase();
    return queryWords.some((word) => text.includes(word));
  });

  const relevantArticles = matched.length > 0 ? matched : articles.slice(0, 3);
  const sources = relevantArticles.map((a) => ({ title: a.title, category: a.category }));

  // 3. Check for external LLM configuration (Gemini / Groq / OpenAI)
  const providerCfg = await getAIProviderConfig();

  if (providerCfg) {
    const roleDirective =
      user.role === 'ADMIN'
        ? 'You are the Executive AI Advisor for Tradosphere Wealth Management Administration. Assist with business metrics, CRM pipeline health, staff workload, and signal governance.'
        : user.role === 'EMPLOYEE'
        ? 'You are the Operational AI Copilot for Tradosphere Wealth Executives. Assist with daily task prioritization, drafting compliant client follow-up scripts, and explaining approved SOPs.'
        : 'You are the Client Wealth Guidance Assistant for Tradosphere Wealth Management. Assist clients with onboarding steps, KYC document checklist, service explanations (Demat, Mutual Funds, SIP, Loans, Insurance), and navigating their application status. Be polite, clear, and reassuring.';

    const systemInstruction = `${roleDirective}
Strict compliance constraints:
1. Tradosphere is an Authorised Person of SMC Global Securities Ltd.
2. NEVER give stock tips, buy/sell recommendations, target prices, or promises of return.
3. Keep answers concise, factual, and professional.
4. Use the following approved reference knowledge:
${relevantArticles.map((a) => `[${a.title} - ${a.category}]: ${a.content}`).join('\n')}`;

    const externalAnswer = await callExternalLLM(providerCfg, systemInstruction, trimmed);
    if (externalAnswer) {
      return {
        answer: externalAnswer,
        sources,
        isCompliant: true,
        providerUsed: `${providerCfg.provider} (${providerCfg.model})`,
      };
    }
  }

  // 4. Compliant Fallback Knowledge Synthesizer (Zero-Failure Engine)
  let answerText = '';

  if (user.role === 'CLIENT') {
    if (
      trimmed.toLowerCase().includes('document') ||
      trimmed.toLowerCase().includes('kyc') ||
      trimmed.toLowerCase().includes('pan') ||
      trimmed.toLowerCase().includes('aadhaar')
    ) {
      answerText = `**Regulatory KYC & Document Checklist:**\n\nTo complete your account verification, please provide:\n- **PAN Card** (Mandatory for all financial services)\n- **Proof of Identity / Address** (Aadhaar or Passport)\n- **Bank Proof** (Cancelled cheque or recent statement)\n- **Income Proof** (Latest 6-month statement or ITR if activating F&O derivatives)\n\nYou can securely upload these directly from your [Document Vault](/documents). Files are encrypted with AES-256 and verified by our compliance desk within 24-48 business hours.`;
    } else if (
      trimmed.toLowerCase().includes('demat') ||
      trimmed.toLowerCase().includes('smc') ||
      trimmed.toLowerCase().includes('trading')
    ) {
      answerText = `**SMC Demat & Trading Services:**\n\nTradosphere Wealth Management partners as an Authorised Person with **SMC Global Securities Ltd**.\n- Trade executions occur directly on the official **SMC Ace** trading terminal.\n- You benefit from competitive brokerage, research intelligence, and seamless digital onboarding.\n- To start onboarding, click **Open Demat** on your [Home Dashboard](/home).`;
    } else if (
      trimmed.toLowerCase().includes('sip') ||
      trimmed.toLowerCase().includes('mutual fund') ||
      trimmed.toLowerCase().includes('invest')
    ) {
      answerText = `**Mutual Funds & Systematic Investment Plan (SIP):**\n\n- **SIP** enables disciplined monthly rupee-cost averaging across equity, hybrid, and debt schemes.\n- You can model returns using our [SIP Return Calculator](/invest?tab=sip).\n- Mandates are securely authenticated via e-NACH or NetBanking directly to SEBI-registered Asset Management Companies (AMCs).\n\n*Notice: Mutual fund investments are subject to market risks. Read all scheme documents carefully.*`;
    } else if (
      trimmed.toLowerCase().includes('status') ||
      trimmed.toLowerCase().includes('application')
    ) {
      answerText = `**Application Status Inquiries:**\n\nYou can track all your active requests (Demat, Mutual Funds, Insurance, and Loans) in real-time under [My Applications](/applications). If your file requires additional documents, our wealth desk will notify you in your in-app Notification Center.`;
    } else {
      answerText = `**Tradosphere Wealth Guidance:**\n\nWe assist clients with Demat account opening via SMC Global, mutual fund investments, SIP mandates, loan facilitations, and insurance planning.\n\nApproved Information:\n${relevantArticles
        .map((a) => `• **${a.title}**: ${a.content.substring(0, 280)}...`)
        .join('\n\n')}\n\nNeed personalized assistance? Open a support ticket under [Support](/support) or connect with your dedicated relationship executive.`;
    }
  } else if (user.role === 'ADMIN') {
    if (
      trimmed.toLowerCase().includes('metric') ||
      trimmed.toLowerCase().includes('crm') ||
      trimmed.toLowerCase().includes('pipeline') ||
      trimmed.toLowerCase().includes('lead')
    ) {
      answerText = `**Administrative CRM & Pipeline Strategy:**\n\n- Monitor unassigned leads regularly in the [CRM Control Center](/admin/crm) to maintain response SLAs under 2 hours.\n- Review employee follow-up filings and conversion rates in the Staff Desk.\n- Ensure all client applications transition through authorized document verification before final broker gateway dispatch.`;
    } else if (trimmed.toLowerCase().includes('task') || trimmed.toLowerCase().includes('workload')) {
      answerText = `**Task Allocation Guidelines:**\n\n- Critical KYC verifications and high-priority lead contacts should be allocated through [Central Tasks](/admin/tasks).\n- Monitor overdue tasks across departments to balance staff workload effectively.`;
    } else {
      answerText = `**Administrative Operations Overview:**\n\n${relevantArticles
        .map((a) => `• **${a.title}** (${a.category}):\n${a.content.substring(0, 320)}...`)
        .join('\n\n')}`;
    }
  } else {
    // EMPLOYEE DESK
    if (
      trimmed.toLowerCase().includes('sop') ||
      trimmed.toLowerCase().includes('workflow') ||
      trimmed.toLowerCase().includes('onboarding') ||
      trimmed.toLowerCase().includes('demat')
    ) {
      answerText = `Based on approved TWM Operational SOPs:\n\n${relevantArticles
        .map((a) => `### ${a.title}\n${a.content.substring(0, 450)}...`)
        .join('\n\n')}`;
    } else if (
      trimmed.toLowerCase().includes('draft') ||
      trimmed.toLowerCase().includes('follow up') ||
      trimmed.toLowerCase().includes('message')
    ) {
      const leadName = context?.leadName || 'Customer';
      const product = context?.product || 'our financial services';
      answerText = `**Suggested Professional Follow-up Draft:**\n\n"Dear ${leadName},\n\nThank you for connecting with Tradosphere Wealth Management regarding ${product}. As an Authorised Person of SMC Global, we assist clients with transparent onboarding and service facilitation.\n\nPlease let us know a convenient time for a brief 5-minute call to answer any questions regarding documentation or next steps.\n\nWarm regards,\nWealth Management Desk\nTradosphere Wealth Management"`;
    } else if (trimmed.toLowerCase().includes('report') || trimmed.toLowerCase().includes('summary')) {
      answerText = `**Daily Report Guidelines:**\n- Record all verified client contacts and outbound follow-up calls.\n- Document status transitions for pending Demat/SIP/Loan files.\n- Detail any customer bottlenecks requiring compliance or management intervention.`;
    } else {
      answerText = `**Approved Knowledge Information:**\n\n${relevantArticles
        .map((a) => `• **${a.title}** (${a.category}):\n${a.content.substring(0, 320)}...`)
        .join('\n\n')}\n\n*Note: All communications must strictly adhere to TWM approved SOPs.*`;
    }
  }

  return {
    answer: answerText,
    sources,
    isCompliant: true,
    providerUsed: 'Built-in Compliant Knowledge Engine',
  };
}

/**
 * Backward-compatible helper for existing employee copilot callers and tests
 */
export async function askEmployeeCopilot(
  query: string,
  context?: { leadName?: string; product?: string }
): Promise<CopilotResponse> {
  return askSharedCopilot(
    query,
    {
      id: 'legacy-employee-caller',
      role: 'EMPLOYEE',
      name: 'Operations Executive',
    },
    context
  );
}
