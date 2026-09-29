'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ClipboardList,
  CheckCircle2,
  Calendar,
  Clock,
  Send,
  AlertCircle,
} from 'lucide-react';

interface DailyReport {
  id: string;
  reportDate: string;
  callsCount: number;
  contactsCount: number;
  newLeadsCount: number;
  followUpsCount: number;
  applicationsCount: number;
  conversionsCount: number;
  pendingWork: string | null;
  bottlenecks: string | null;
  tomorrowPriorities: string | null;
  submittedAt: string;
}

export default function EmployeeDailyReportPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [calls, setCalls] = useState<number>(0);
  const [contacts, setContacts] = useState<number>(0);
  const [leads, setLeads] = useState<number>(0);
  const [followups, setFollowups] = useState<number>(0);
  const [applications, setApplications] = useState<number>(0);
  const [conversions, setConversions] = useState<number>(0);
  const [pendingWork, setPendingWork] = useState('');
  const [bottlenecks, setBottlenecks] = useState('');
  const [tomorrowPriorities, setTomorrowPriorities] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      setLoading(true);
      const res = await fetch('/api/reports/daily');
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reports/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callsCount: Number(calls),
          contactsCount: Number(contacts),
          newLeadsCount: Number(leads),
          followUpsCount: Number(followups),
          applicationsCount: Number(applications),
          documentsCount: 0,
          conversionsCount: Number(conversions),
          pendingWork,
          bottlenecks,
          tomorrowPriorities,
        }),
      });

      const data = await res.json();
      if (data.report) {
        setReports([data.report, ...reports]);
        setSuccessMsg(true);
        // Reset form
        setCalls(0);
        setContacts(0);
        setLeads(0);
        setFollowups(0);
        setApplications(0);
        setConversions(0);
        setPendingWork('');
        setBottlenecks('');
        setTomorrowPriorities('');
        setTimeout(() => setSuccessMsg(false), 5000);
      } else {
        alert(data.error || 'Failed to submit report');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Daily Operational Report</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Record your daily productivity, client contacts, conversions &amp; tomorrow&apos;s priorities
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Daily report submitted and recorded in management audit records.</span>
        </div>
      )}

      {/* Submission Form */}
      <Card className="p-5 bg-[#131C2E] border-slate-800 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-400" /> Log Today&apos;s Output
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Calls Placed</label>
              <input
                type="number"
                min="0"
                value={calls}
                onChange={(e) => setCalls(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Clients Contacted</label>
              <input
                type="number"
                min="0"
                value={contacts}
                onChange={(e) => setContacts(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">New Leads Created</label>
              <input
                type="number"
                min="0"
                value={leads}
                onChange={(e) => setLeads(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Follow-ups Done</label>
              <input
                type="number"
                min="0"
                value={followups}
                onChange={(e) => setFollowups(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Applications Handled</label>
              <input
                type="number"
                min="0"
                value={applications}
                onChange={(e) => setApplications(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Conversions Closed</label>
              <input
                type="number"
                min="0"
                value={conversions}
                onChange={(e) => setConversions(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Qualitative fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Pending Work / Follow-up Backlog
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px]"
                placeholder="What files or applications remain incomplete today?"
                value={pendingWork}
                onChange={(e) => setPendingWork(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Bottlenecks / Compliance Escalations
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px]"
                placeholder="Any issues with KRA, bank verification, or partner portals?"
                value={bottlenecks}
                onChange={(e) => setBottlenecks(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Tomorrow&apos;s Priorities
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px]"
                placeholder="Top 3 customer accounts or tasks to execute tomorrow..."
                value={tomorrowPriorities}
                onChange={(e) => setTomorrowPriorities(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSubmitting}>
            <Send className="w-4 h-4 mr-2" /> Submit Daily Report
          </Button>
        </form>
      </Card>

      {/* Previous Submissions History */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Recent Report Submissions
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading reports...</div>
        ) : reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((r) => (
              <Card key={r.id} className="p-4 bg-[#111927] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    {new Date(r.reportDate).toLocaleDateString()}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[11px] py-2 border-y border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Calls</span>
                    <strong className="text-white">{r.callsCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Contacts</span>
                    <strong className="text-white">{r.contactsCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Leads</span>
                    <strong className="text-white">{r.newLeadsCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Follow-ups</span>
                    <strong className="text-white">{r.followUpsCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Apps</span>
                    <strong className="text-white">{r.applicationsCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Conversions</span>
                    <strong className="text-emerald-400">{r.conversionsCount}</strong>
                  </div>
                </div>

                {r.tomorrowPriorities && (
                  <div className="text-[11px] text-slate-400 pt-1">
                    <span className="font-semibold text-slate-300">Tomorrow: </span>
                    {r.tomorrowPriorities}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center text-xs text-slate-400">
            No daily reports logged yet.
          </Card>
        )}
      </div>
    </div>
  );
}
