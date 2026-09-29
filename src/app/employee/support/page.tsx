'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  MessageSquare,
  Clock,
  UserCheck,
  CheckCircle2,
  X,
  AlertCircle,
  Send,
} from 'lucide-react';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  resolutionNotes: string | null;
  createdAt: string;
  user: { name: string; email: string; phone: string | null };
  application?: { applicationNumber: string; productCode: string } | null;
}

export default function EmployeeSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateTicket() {
    if (!selectedTicket) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolutionNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(
          tickets.map((t) => (t.id === selectedTicket.id ? { ...t, ...data.ticket } : t))
        );
        setSelectedTicket(null);
      } else {
        alert(data.error || 'Failed to update ticket');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Support Desk Management</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Respond to customer questions, Demat onboarding inquiries &amp; service escalations
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading support queue...</div>
      ) : tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card
              key={t.id}
              variant="interactive"
              onClick={() => {
                setSelectedTicket(t);
                setNewStatus(t.status);
                setResolutionNotes(t.resolutionNotes || '');
              }}
              className="p-4 bg-[#131C2E] hover:border-slate-700 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-blue-400">
                      {t.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                        t.priority === 'URGENT' || t.priority === 'HIGH'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white mt-1">{t.subject}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Client: <strong className="text-slate-200">{t.user.name}</strong> ({t.user.email})
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                {t.description}
              </p>

              {t.resolutionNotes && (
                <div className="text-[11px] text-blue-300 bg-blue-950/20 p-2 rounded border border-blue-900/30">
                  <strong>Latest Response:</strong> {t.resolutionNotes}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
                <span className="text-blue-400 font-semibold hover:underline">
                  Respond &amp; Update Status →
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-xs text-slate-400">
          No support tickets in queue.
        </Card>
      )}

      {/* RESOLUTION MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs text-blue-400 font-bold block">
                  {selectedTicket.ticketNumber}
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">{selectedTicket.subject}</h2>
                <div className="text-xs text-slate-400">
                  Client: {selectedTicket.user.name} ({selectedTicket.user.phone || selectedTicket.user.email})
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Customer Message
              </span>
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.description}
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Ticket Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OPEN">Open - Awaiting Review</option>
                  <option value="IN_PROGRESS">In Progress - Processing with Desk</option>
                  <option value="RESOLVED">Resolved - Solution Provided</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Resolution Notes / Response to Client *
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[90px]"
                  placeholder="Explain steps taken, verification status, or guidance for the customer..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full text-xs"
                  isLoading={isUpdating}
                  onClick={handleUpdateTicket}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Save Response &amp; Update
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  className="w-1/3 text-xs"
                  onClick={() => setSelectedTicket(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
