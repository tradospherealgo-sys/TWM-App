import React from 'react';
import prisma from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { BookOpen, ShieldCheck, Tag } from 'lucide-react';

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((art) => (
          <Card key={art.id} className="p-4 space-y-3 bg-[#131C2E]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase bg-blue-950 text-blue-300 border border-blue-800">
                  {art.category}
                </span>
                <h2 className="font-bold text-sm text-white mt-1.5">{art.title}</h2>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                v{art.version}.0 Approved
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
              {art.content}
            </div>

            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>Author: {art.authorName}</span>
              <span>Updated: {new Date(art.updatedAt).toLocaleDateString()}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
