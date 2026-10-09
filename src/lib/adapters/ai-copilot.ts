import prisma from '../prisma';
import { decryptSecretsMap } from '../encryption';

/**
 * AI Copilot Adapter for TWM Employees & Platform Operations
 * 
 * Boundaries (Section 10, 21, Master Reference):
 * - Assists with: SOP lookup, knowledge retrieval, customer follow-up drafting, report drafting, educational explanations.
 * - STRICTLY PROHIBITED FROM:
 *   - Providing stock tips or buy/sell/hold calls
 *   - Generating price targets or guaranteed returns
 *   - Personal portfolio recommendations or asset allocation advice
 *   - Functioning as an unregistered SEBI Investment Adviser
 */

export interface CopilotResponse {
  answer: string;
  sources: Array<{ title: string; category: string }>;
  isCompliant: boolean;
  warning?: string;
}

// Regulatory and advisory stop patterns based on Section 21 of TWM Specification
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

export async function askEmployeeCopilot(
  query: string,
  context?: { leadName?: string; product?: string }
): Promise<CopilotResponse> {
  const trimmed = query.trim();

  // 1. Regulatory boundary check (Instant block)
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

  // 2. Search approved Knowledge Base articles from DB
  let articles: any[] = [];
  try {
    articles = await prisma.knowledgeArticle.findMany({
      where: {
        status: 'APPROVED',
        applicableRole: { in: ['ALL', 'EMPLOYEE'] },
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
    ];
  }

  const queryWords = trimmed.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const matched = articles.filter((art) => {
    const text = (art.title + ' ' + art.content + ' ' + art.category).toLowerCase();
    return queryWords.some((word) => text.includes(word));
  });

  const relevantArticles = matched.length > 0 ? matched : articles.slice(0, 2);

  // 3. Synthesize structured answer based on approved SOPs
  let answerText = '';

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

  return {
    answer: answerText,
    sources: relevantArticles.map((a) => ({ title: a.title, category: a.category })),
    isCompliant: true,
  };
}
