'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import {
  PhoneCall,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  FileText,
  User,
} from 'lucide-react';

interface FollowUp {
  id: string;
  scheduledAt: string;
  outcome: string | null;
  notes: string | null;
  nextAction: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'MISSED';
  lead?: { name: string; phone: string; productInterest: string } | null;
  customer?: { user: { name: string; phone: string } } | null;
}

export default function EmployeeFollowupsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  // Schedule modal
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFollowUps();
  }, []);

  async function fetchFollowUps() {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/followups');
      const data = await res.json();
      if (data.followUps) setFollowUps(data.followUps);
    } catch (e) {
      console.error('Fetch followups error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduledAt) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/crm/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: new Date(scheduledAt).toISOString(),
          notes: leadName ? `Contact: ${leadName}. ${notes}` : notes,
          nextAction,
          status: 'SCHEDULED',
        }),
      });
      const data = await res.json();
      if (data.followUp) {
        setFollowUps([data.followUp, ...followUps]);
        setIsScheduleOpen(false);
        setLeadName('');
        setScheduledAt('');
        setNotes('');
        setNextAction('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Customer Follow-ups</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log client calls, meeting outcomes &amp; scheduled next steps
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => setIsScheduleOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Schedule Follow-up
        </Button>
      </div>

      {/* Follow-up list */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading follow-ups...</div>
      ) : followUps.length > 0 ? (
        <div className="space-y-3">
          {followUps.map((fu) => (
            <Card key={fu.id} className="p-4 bg-[#131C2E] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-sm text-white">
                      {fu.lead?.name || fu.customer?.user.name || 'Client Call'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {fu.lead?.phone || fu.customer?.user.phone || 'Phone Scheduled'}
                  </div>
                </div>
                <StatusBadge status={fu.status} />
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 py-1 border-y border-slate-800">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(fu.scheduledAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(fu.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {fu.notes && (
                <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                  {fu.notes}
                </p>
              )}

              {fu.nextAction && (
                <div className="text-[11px] text-emerald-400 font-medium">
                  Next Step: {fu.nextAction}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-xs text-slate-400">
          No follow-ups recorded yet. Schedule your first follow-up call.
        </Card>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Schedule Follow-up</h2>
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSchedule} className="space-y-3">
              <Input
                label="Client / Lead Name"
                placeholder="e.g. Aditya Mehta"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
              />

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Discussion Points / Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                  placeholder="e.g. Discuss Demat signature re-upload and F&amp;O segment proof..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Input
                label="Next Action (creates task automatically)"
                placeholder="e.g. Verify CKYC match in KRA portal"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
              />

              <div className="flex gap-2 pt-2">
                <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSubmitting}>
                  Confirm Schedule
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-1/3"
                  onClick={() => setIsScheduleOpen(false)}
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
