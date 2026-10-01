import React from 'react';
import prisma from '@/lib/prisma';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { KnowledgeArticlesViewer } from './KnowledgeArticlesViewer';

export default async function EmployeeKnowledgePage() {
  const articles = await prisma.knowledgeArticle.findMany({
    where: {
      status: 'APPROVED',
      applicableRole: { in: ['ALL', 'EMPLOYEE'] },
    },
    orderBy: { category: 'asc' },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Internal Knowledge &amp; Approved SOPs</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Authorized operational protocols, KYC workflows &amp; regulatory guidelines
        </p>
      </div>

      <StatusBanner
        type="regulatory"
        title="Compliance Standard"
        message="All client communications, onboarding workflows, and document handling must strictly follow these approved Standard Operating Procedures."
      />

      <KnowledgeArticlesViewer articles={articles} />
    </div>
  );
}
