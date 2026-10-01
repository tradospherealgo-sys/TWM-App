'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, BookOpen, ShieldCheck, Tag, Copy, Check, FileText } from 'lucide-react';

export interface KnowledgeArticleItem {
  id: string;
  title: string;
  category: string;
  productCode: string | null;
  content: string;
  version: number;
  status: string;
  applicableRole: string;
  authorName: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

const CATEGORIES = [
  { value: 'ALL', label: 'All SOPs' },
  { value: 'SMC_TRADING', label: 'SMC Demat & Trading' },
  { value: 'MUTUAL_FUNDS', label: 'Mutual Funds' },
  { value: 'SIP', label: 'SIP Protocols' },
  { value: 'IPO', label: 'IPO Guidelines' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'LOANS', label: 'Loans' },
  { value: 'COMPLIANCE', label: 'Regulatory Compliance' },
  { value: 'SOPS', label: 'Operational SOPs' },
];

export function KnowledgeArticlesViewer({ articles }: { articles: KnowledgeArticleItem[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredArticles = articles.filter((art) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      art.category.toUpperCase() === selectedCategory.toUpperCase();

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      art.title.toLowerCase().includes(q) ||
      art.content.toLowerCase().includes(q) ||
      art.category.toLowerCase().includes(q) ||
      (art.productCode && art.productCode.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search operational SOPs, workflows, SEBI rules, partner codes..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((art) => (
            <Card key={art.id} className="p-4 space-y-3 bg-[#131C2E] border-slate-800 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase bg-blue-950 text-blue-300 border border-blue-800">
                        {art.category.replace(/_/g, ' ')}
                      </span>
                      {art.productCode && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono text-slate-400 bg-slate-900 border border-slate-800">
                          {art.productCode}
                        </span>
                      )}
                    </div>
                    <h2 className="font-bold text-sm text-white mt-1.5">{art.title}</h2>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                      v{art.version}.0 Approved
                    </span>
                    <button
                      onClick={() => handleCopy(art.id, art.content)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Copy protocol text"
                    >
                      {copiedId === art.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 max-h-60 overflow-y-auto">
                  {art.content}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span>Authorized: {art.authorName}</span>
                <span>Updated: {new Date(art.updatedAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-xs text-slate-400">
          No knowledge articles or SOPs found matching &quot;{searchQuery}&quot; in category &quot;{selectedCategory}&quot;.
        </Card>
      )}
    </div>
  );
}
