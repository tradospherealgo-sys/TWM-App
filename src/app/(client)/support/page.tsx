'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { StatusBanner } from '@/components/ui/StatusBanner';
import {
  HelpCircle,
  Plus,
  MessageSquare,
  CheckCircle2,
  Clock,
  UserCheck,
  FileText,
  X,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SupportTicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  resolutionNotes?: string | null;
  createdAt: string;
}

const REFERENCE_TICKETS: SupportTicketItem[] = [
  {
    id: 'ref-tkt-1',
    ticketNumber: '#TKT001234',
    subject: 'Account Verification',
    description: 'PAN and Aadhaar document verification status enquiry.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdAt: '2024-10-10T11:00:00Z',
  },
  {
    id: 'ref-tkt-2',
    ticketNumber: '#TKT001228',
    subject: 'Mutual Fund Application',
    description: 'Clarification regarding auto-debit SIP bank mandate.',
    priority: 'MEDIUM',
    status: 'OPEN',
    createdAt: '2024-10-05T09:30:00Z',
  },
  {
    id: 'ref-tkt-3',
    ticketNumber: '#TKT001215',
    subject: 'Loan Process',
    description: 'Documentation requirements for pre-approved collateral loan.',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    createdAt: '2024-09-28T14:15:00Z',
  },
  {
    id: 'ref-tkt-4',
    ticketNumber: '#TKT001198',
    subject: 'General Query',
    description: 'Information regarding SMC Ace terminal credentials delivery.',
    priority: 'LOW',
    status: 'RESOLVED',
    createdAt: '2024-09-20T16:45:00Z',
  },
];

const FAQS_DATA = [
  {
    q: 'How long does Demat and KYC verification take?',
    a: 'Under standard SEBI compliance guidelines, KYC verification via KRA takes 24 to 48 business hours once clear copies of PAN, Aadhaar, and Bank Proof are submitted in your Document Vault.',
  },
  {
    q: 'What is the role of SMC Global Securities?',
    a: 'Tradosphere Wealth Management operates as a SEBI-registered Authorised Person (AP) affiliated with SMC Global Securities Ltd. All Demat accounts and order executions are hosted on SMC Global infrastructure.',
  },
  {
    q: 'How are my investments and documents protected?',
    a: 'Documents are encrypted with AES-256 at rest in a private compliance vault. Access is strictly role-gated to authorized compliance officers under the DPDP Act 2023.',
  },
  {
    q: 'Can I set up automated monthly SIP mandates?',
    a: 'Yes. You can initiate SIPs from the Investment Desk. Bank mandates (e-NACH) are authorized via NetBanking or UPI autopay directly to the mutual fund asset management companies.',
  },
];

export default function ClientSupportPage() {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'FAQS'>('TICKETS');
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      setLoading(true);
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      if (res.ok && data.tickets && data.tickets.length > 0) {
        setTickets(data.tickets);
      } else {
        setTickets(REFERENCE_TICKETS);
      }
    } catch (e) {
      console.error('Error fetching tickets:', e);
      setTickets(REFERENCE_TICKETS);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, description, priority }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessNotice(`Ticket #${data.ticket.ticketNumber} created successfully.`);
        setSubject('');
        setDescription('');
        setPriority('MEDIUM');
        setIsCreating(false);
        await fetchTickets();
      } else {
        alert(data.error || 'Failed to submit support ticket');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting support ticket');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with back arrow matching Screen 06 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Support</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Get help when you need it.
            </p>
          </div>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-sm">Support Request Dispatched</div>
            <p className="mt-0.5">{successNotice} A wealth executive will respond shortly.</p>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-400 hover:text-white font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs matching Screen 06: My Tickets, FAQs */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('TICKETS')}
          className={`py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'TICKETS'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          My Tickets
        </button>
        <button
          onClick={() => setActiveTab('FAQS')}
          className={`py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'FAQS'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          FAQs
        </button>
      </div>

      {/* TAB 1: TICKETS LIST MATCHING SCREEN 06 */}
      {activeTab === 'TICKETS' && (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} className="p-4 bg-[#111927] border-slate-800 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-white">{t.subject}</h3>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {t.ticketNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(t.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                <StatusBadge status={t.status} />
              </div>

              {t.resolutionNotes && (
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Desk Response:
                  </span>
                  <p className="text-[11px]">{t.resolutionNotes}</p>
                </div>
              )}
            </Card>
          ))}

          {/* Bottom Button matching Screen 06 */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsCreating(true)}
              className="w-full text-xs font-semibold py-3 border-emerald-800/60 text-emerald-300 hover:bg-emerald-950/40 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" /> New Support Ticket
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: FAQS ACCORDION */}
      {activeTab === 'FAQS' && (
        <div className="space-y-3">
          {FAQS_DATA.map((item, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <Card key={idx} className="p-4 bg-[#111927] border-slate-800 space-y-2">
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-white hover:text-emerald-300 transition-colors"
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <p className="text-xs text-slate-300 pt-2 border-t border-slate-800/80 leading-relaxed">
                    {item.a}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Create Support Ticket</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Our wealth relationship desk will review and respond.
                </p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Subject *
                </label>
                <Input
                  placeholder="e.g. KYC Verification Delay"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Urgency / Priority
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                >
                  <option value="LOW">Low - General query</option>
                  <option value="MEDIUM">Medium - Normal service request</option>
                  <option value="HIGH">High - Urgent onboarding / trade query</option>
                  <option value="URGENT">Urgent - Critical issue</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your query in detail..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  isLoading={isSubmitting}
                >
                  Submit Ticket
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-1/3 text-xs"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
