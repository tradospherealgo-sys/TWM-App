'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  productInterest: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  followUps?: Array<{ id: string; scheduledAt: string; status: string; outcome: string | null }>;
}

const PIPELINE_STAGES = [
  { value: 'ALL', label: 'All Leads' },
  { value: 'NEW_LEAD', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'FOLLOW_UP', label: 'Follow Up' },
  { value: 'DOCUMENTS_REQUIRED', label: 'Docs Req.' },
  { value: 'APPLICATION', label: 'Application' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'LOST_CLOSED', label: 'Lost / Closed' },
];

export default function EmployeeLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // New Lead Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('DIRECT');
  const [productInterest, setProductInterest] = useState('DEMAT');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update Stage State
  const [newStage, setNewStage] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/leads');
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
    } catch (e) {
      console.error('Fetch leads error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          source,
          productInterest,
          notes,
        }),
      });
      const data = await res.json();
      if (data.lead) {
        setLeads([data.lead, ...leads]);
        setIsCreateOpen(false);
        setName('');
        setPhone('');
        setEmail('');
        setNotes('');
      } else {
        alert(data.error || 'Failed to create lead');
      }
    } catch (e) {
      console.error('Create lead error:', e);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateLeadStage() {
    if (!selectedLead || !newStage) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedLead.id,
          status: newStage,
          notes: updateNotes,
        }),
      });
      const data = await res.json();
      if (data.lead) {
        setLeads(leads.map((l) => (l.id === data.lead.id ? data.lead : l)));
        setSelectedLead(data.lead);
        setUpdateNotes('');
      }
    } catch (e) {
      console.error('Update lead stage error:', e);
    } finally {
      setIsUpdating(false);
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesStage = selectedStage === 'ALL' || lead.status === selectedStage;
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.productInterest.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">CRM &amp; Lead Pipeline</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage customer interactions and lead stage progression
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add New Lead
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Search by name, phone, or product..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Stage Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {PIPELINE_STAGES.map((st) => (
            <button
              key={st.value}
              onClick={() => setSelectedStage(st.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedStage === st.value
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table / Card List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading leads...</div>
      ) : filteredLeads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredLeads.map((lead) => (
            <Card
              key={lead.id}
              variant="interactive"
              onClick={() => {
                setSelectedLead(lead);
                setNewStage(lead.status);
              }}
              className="p-4 space-y-3 bg-[#131C2E] hover:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">{lead.name}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{lead.phone}</span>
                  </div>
                </div>
                <StatusBadge status={lead.status} />
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-medium">
                  {lead.productInterest}
                </span>
                <span>Source: {lead.source}</span>
              </div>

              {lead.notes && (
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed bg-slate-900/50 p-2 rounded-lg">
                  {lead.notes}
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-xs text-slate-400">
          No leads matching current search/filter.
        </Card>
      )}

      {/* LEAD DETAILS / STAGE UPDATE MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedLead.name}</h2>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{selectedLead.phone}</span>
                  {selectedLead.email && <span>• {selectedLead.email}</span>}
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Stage & Fast Update */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase block">
                Update Pipeline Stage
              </label>
              <select
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PIPELINE_STAGES.filter((s) => s.value !== 'ALL').map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Add Interaction Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                  placeholder="Record outcome of conversation or next requirements..."
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                />
              </div>

              <Button
                size="sm"
                variant="primary"
                className="w-full text-xs"
                isLoading={isUpdating}
                onClick={handleUpdateLeadStage}
              >
                Save Stage Update
              </Button>
            </div>

            {/* Notes history */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Interaction History
              </h3>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                {selectedLead.notes || 'No previous notes logged.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW LEAD MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Create New Lead</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3">
              <Input
                label="Full Name"
                required
                placeholder="e.g. Ramesh Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Mobile Phone"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Input
                label="Email (Optional)"
                type="email"
                placeholder="ramesh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Source
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DIRECT">Direct Contact</option>
                    <option value="WEBSITE">Website Form</option>
                    <option value="REFERRAL">Client Referral</option>
                    <option value="CAMPAIGN">Campaign</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Interest
                  </label>
                  <select
                    value={productInterest}
                    onChange={(e) => setProductInterest(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DEMAT">SMC Demat / Trading</option>
                    <option value="MUTUAL_FUND">Mutual Funds</option>
                    <option value="SIP">SIP Mandate</option>
                    <option value="IPO">IPO Application</option>
                    <option value="INSURANCE">Insurance</option>
                    <option value="LOAN">Loan Services</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Initial Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                  placeholder="Record customer requirement..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSubmitting}>
                  Create Lead
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-1/3"
                  onClick={() => setIsCreateOpen(false)}
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
