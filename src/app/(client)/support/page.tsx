'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { EmptyState } from '@/components/ui/EmptyState';
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
  application?: { applicationNumber: string; productCode: string } | null;
  assignedEmployee?: { user: { name: string; email: string } } | null;
}

export default function ClientSupportPage() {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      setLoading(true);
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      if (data.tickets) {
        setTickets(data.tickets);
      }
    } catch (e) {
      console.error('Error fetching tickets:', e);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Customer Support Desk</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Demat onboarding queries, service requests &amp; wealth assistance
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsCreating(true)}
          className="text-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> New Ticket
        </Button>
      </div>

      <StatusBanner
        type="info"
        title="Authorised Person Relationship Support"
        message="For order execution or margin matters on SMC Ace, you may also reach SMC Global directly via smctradeonline.com. TWM desk officers assist with documentation, KYC, and service facilitation."
      />

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

      {/* Tickets List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading support history...</div>
      ) : tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-blue-400 font-bold">
                      {t.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                        t.priority === 'URGENT' || t.priority === 'HIGH'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white mt-1">{t.subject}</h3>
                </div>
                <StatusBadge status={t.status} />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                {t.description}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(t.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>

                {t.assignedEmployee && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Officer: {t.assignedEmployee.user.name}
                  </span>
                )}
              </div>

              {/* Resolution Notes from Staff */}
              {t.resolutionNotes && (
                <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs text-blue-200">
                  <span className="text-[10px] uppercase font-bold text-blue-400 block mb-0.5">
                    Operations Desk Response:
                  </span>
                  <p className="whitespace-pre-line text-[11px]">{t.resolutionNotes}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No support tickets"
          description="Have questions about Demat opening, Mutual Funds, or KYC? Create a support request and our team will assist you."
          actionLabel="Open New Ticket"
          onAction={() => setIsCreating(true)}
        />
      )}

      {/* CREATE TICKET MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Create Support Request</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  A dedicated Relationship Officer will review and respond.
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
                  placeholder="e.g. Demat signature mismatch or SIP mandate inquiry"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Priority
                </label>
                <select
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                >
                  <option value="LOW">Low - General Information</option>
                  <option value="MEDIUM">Medium - Application / KYC Follow-up</option>
                  <option value="HIGH">High - Urgent Document Verification</option>
                  <option value="URGENT">Urgent - Account Access Issue</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Description *
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[90px]"
                  placeholder="Provide complete details so our team can resolve your query quickly..."
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
                  className="w-full text-xs"
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
