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
  ArrowRight,
  FileText,
  ShieldCheck,
  Layers,
  History,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  UserCheck,
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
  assignedEmployeeId?: string | null;
  followUps?: Array<{ id: string; scheduledAt: string; status: string; outcome: string | null }>;
}

interface CustomerSummary {
  id: string;
  customerCode: string;
  kycStatus: string;
  pan: string | null;
  riskProfile: string | null;
  onboardingStatus: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    createdAt: string;
  };
  assignedEmployee?: {
    user: { name: string; email: string };
  } | null;
  applications: Array<{
    id: string;
    applicationNumber: string;
    productCategory: string;
    status: string;
    createdAt: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    documentType: string;
    status: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    dueDate: string | null;
  }>;
  followUps: Array<{
    id: string;
    scheduledAt: string;
    status: string;
  }>;
}

interface TimelineItem {
  id: string;
  type: 'REGISTRATION' | 'APPLICATION' | 'DOCUMENT' | 'FOLLOWUP' | 'TASK' | 'ACTIVITY';
  title: string;
  description?: string;
  timestamp: string;
  status?: string;
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

const PRODUCT_CATEGORIES = [
  { value: 'DEMAT', label: 'SMC Demat & Trading' },
  { value: 'MUTUAL_FUND', label: 'Mutual Funds' },
  { value: 'SIP', label: 'Systematic Investment Plan (SIP)' },
  { value: 'IPO', label: 'IPO Book Building' },
  { value: 'INSURANCE', label: 'Life / General Insurance' },
  { value: 'LOAN', label: 'Secured / Unsecured Loans' },
];

export default function EmployeeLeadsPage() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'customers'>('pipeline');

  // Leads State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [leadSearchQuery, setLeadSearchQuery] = useState('');

  // Customer Directory State
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerKycFilter, setCustomerKycFilter] = useState('ALL');

  // Customer 360 / Timeline Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerSummary | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modals & Forms
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

  // Lead Conversion State
  const [isConverting, setIsConverting] = useState(false);
  const [convertCategory, setConvertCategory] = useState('DEMAT');
  const [convertProductCode, setConvertProductCode] = useState('SMC-TRADING-01');
  const [convertNotes, setConvertNotes] = useState('');
  const [conversionSuccess, setConversionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (activeTab === 'customers' && customers.length === 0) {
      fetchCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function fetchLeads() {
    try {
      setLoadingLeads(true);
      const res = await fetch('/api/crm/leads');
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
    } catch (e) {
      console.error('Fetch leads error:', e);
    } finally {
      setLoadingLeads(false);
    }
  }

  async function fetchCustomers(query = '') {
    try {
      setLoadingCustomers(true);
      const params = new URLSearchParams();
      if (query) params.set('search', query);
      if (customerKycFilter !== 'ALL') params.set('kycStatus', customerKycFilter);

      const res = await fetch(`/api/crm/customers?${params.toString()}`);
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
    } catch (e) {
      console.error('Fetch customers error:', e);
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function openCustomerTimeline(id: string) {
    setSelectedCustomerId(id);
    setLoadingDetail(true);
    setCustomerDetail(null);
    setTimeline([]);
    try {
      const res = await fetch(`/api/crm/customers/${id}`);
      const data = await res.json();
      if (data.success) {
        setCustomerDetail(data.customer);
        setTimeline(data.timeline || []);
      } else {
        alert(data.error || 'Failed to fetch customer timeline');
      }
    } catch (e) {
      console.error('Customer timeline error:', e);
    } finally {
      setLoadingDetail(false);
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

  async function handleConvertLead() {
    if (!selectedLead) return;
    setIsConverting(true);
    setConversionSuccess(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          productCategory: convertCategory,
          productCode: convertProductCode,
          notes: convertNotes || `Converted from lead ${selectedLead.name}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.application) {
        setConversionSuccess(
          `Application #${data.application.applicationNumber} created successfully! Lead status transitioned to APPLICATION.`
        );
        fetchLeads();
        // Update selected lead modal state
        setSelectedLead({
          ...selectedLead,
          status: 'APPLICATION',
        });
      } else {
        alert(data.error || 'Failed to convert lead to application');
      }
    } catch (e) {
      console.error('Convert lead error:', e);
      alert('Network error occurred during conversion');
    } finally {
      setIsConverting(false);
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesStage = selectedStage === 'ALL' || lead.status === selectedStage;
    const matchesSearch =
      lead.name.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
      lead.phone.includes(leadSearchQuery) ||
      lead.productInterest.toLowerCase().includes(leadSearchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">CRM &amp; Client Operations</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational pipeline, lead-to-application conversion &amp; unified customer 360° timelines
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'pipeline'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Leads Pipeline</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 ml-1">
                {leads.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'customers'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Customer Directory</span>
              {customers.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 ml-1">
                  {customers.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'pipeline' && (
            <Button size="sm" variant="primary" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Lead
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LEADS PIPELINE */}
      {/* ========================================================================= */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search leads by name, phone, or product..."
                className="pl-9"
                value={leadSearchQuery}
                onChange={(e) => setLeadSearchQuery(e.target.value)}
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
          {loadingLeads ? (
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
                    setConvertCategory(lead.productInterest || 'DEMAT');
                    setConversionSuccess(null);
                  }}
                  className="p-4 space-y-3 bg-[#131C2E] hover:border-slate-700 cursor-pointer"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOMER DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search customers by code (TWM-CLI-...), name, phone, PAN..."
                className="pl-9"
                value={customerSearchQuery}
                onChange={(e) => {
                  setCustomerSearchQuery(e.target.value);
                  fetchCustomers(e.target.value);
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={customerKycFilter}
                onChange={(e) => {
                  setCustomerKycFilter(e.target.value);
                  fetchCustomers(customerSearchQuery);
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All KYC States</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <Button size="sm" variant="secondary" onClick={() => fetchCustomers(customerSearchQuery)}>
                Refresh
              </Button>
            </div>
          </div>

          {/* Customer Directory Table */}
          {loadingCustomers ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading customer directory...</div>
          ) : customers.length > 0 ? (
            <Card className="overflow-x-auto p-0 bg-[#131C2E] border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Customer Code</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">KYC Status</th>
                    <th className="px-4 py-3">Activity &amp; Apps</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{c.user.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Joined {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950 text-blue-300 border border-slate-800">
                          {c.customerCode}
                        </span>
                        {c.pan && (
                          <div className="text-[10px] font-mono text-slate-500 mt-1">PAN: {c.pan}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{c.user.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{c.user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.kycStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[11px] border border-slate-800">
                            {c.applications.length} Apps
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[11px] border border-slate-800">
                            {c.documents.length} Docs
                          </span>
                          {c.tasks.length > 0 && (
                            <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 text-[10px] border border-amber-800/60">
                              {c.tasks.length} Open Tasks
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openCustomerTimeline(c.id)}
                          className="text-xs"
                        >
                          <History className="w-3.5 h-3.5 mr-1" /> 360° Timeline
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <Card className="p-8 text-center text-xs text-slate-400">
              No customer records found matching search criteria.
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOMER 360 / INTERACTION HISTORY TIMELINE MODAL */}
      {/* ========================================================================= */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    {customerDetail ? customerDetail.user.name : 'Loading Profile...'}
                  </h2>
                  {customerDetail && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      {customerDetail.customerCode}
                    </span>
                  )}
                </div>
                {customerDetail && (
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                    <span>{customerDetail.user.phone || 'No phone'}</span>
                    <span>•</span>
                    <span>{customerDetail.user.email}</span>
                    {customerDetail.pan && (
                      <>
                        <span>•</span>
                        <span className="font-mono">PAN: {customerDetail.pan}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Assembling unified customer timeline...
              </div>
            ) : customerDetail ? (
              <div className="space-y-4">
                {/* Profile Overview Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      KYC Status
                    </span>
                    <div className="mt-1">
                      <StatusBadge status={customerDetail.kycStatus} />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Risk Profile
                    </span>
                    <strong className="text-white block mt-1">
                      {customerDetail.riskProfile || 'UNASSESSED'}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Applications
                    </span>
                    <strong className="text-white block mt-1">
                      {customerDetail.applications.length} submitted
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Assigned Advisor
                    </span>
                    <span className="text-slate-300 block mt-1 truncate">
                      {customerDetail.assignedEmployee
                        ? customerDetail.assignedEmployee.user.name
                        : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Unified Interaction Timeline */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-400" /> Interaction &amp; Operational History
                  </h3>

                  {timeline.length > 0 ? (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                      {timeline.map((item) => {
                        let dotColor = 'bg-blue-500';
                        let icon = <Layers className="w-3 h-3 text-white" />;

                        if (item.type === 'REGISTRATION') {
                          dotColor = 'bg-emerald-500';
                          icon = <UserCheck className="w-3 h-3 text-white" />;
                        } else if (item.type === 'APPLICATION') {
                          dotColor = 'bg-blue-500';
                          icon = <FileText className="w-3 h-3 text-white" />;
                        } else if (item.type === 'DOCUMENT') {
                          dotColor = 'bg-purple-500';
                          icon = <ShieldCheck className="w-3 h-3 text-white" />;
                        } else if (item.type === 'FOLLOWUP') {
                          dotColor = 'bg-amber-500';
                          icon = <Phone className="w-3 h-3 text-white" />;
                        } else if (item.type === 'TASK') {
                          dotColor = 'bg-cyan-500';
                          icon = <CheckCircle2 className="w-3 h-3 text-white" />;
                        }

                        return (
                          <div key={item.id} className="relative group">
                            {/* Dot */}
                            <div
                              className={`absolute -left-6 top-1 w-4 h-4 rounded-full flex items-center justify-center ${dotColor} ring-4 ring-[#131C2E]`}
                            >
                              {icon}
                            </div>

                            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs">{item.title}</span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(item.timestamp).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              {item.status && (
                                <div className="pt-0.5">
                                  <StatusBadge status={item.status} />
                                </div>
                              )}

                              {item.description && (
                                <p className="text-[11px] text-slate-300 leading-relaxed pt-1 whitespace-pre-wrap">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No interaction events recorded for this customer yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Failed to load customer profile.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEAD DETAILS / STAGE UPDATE & CONVERT MODAL */}
      {/* ========================================================================= */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
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

            {conversionSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{conversionSuccess}</span>
              </div>
            )}

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
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px]"
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

            {/* CONVERT LEAD TO FORMAL APPLICATION */}
            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Convert to Formal Application
                </h3>
                <span className="text-[10px] text-blue-400 font-mono">Workflow Step</span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Initializes formal onboarding: provisions a customer profile if new, creates an application, and transitions lead to APPLICATION stage.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Product Category
                  </label>
                  <select
                    value={convertCategory}
                    onChange={(e) => setConvertCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Product / Scheme Code
                  </label>
                  <input
                    type="text"
                    value={convertProductCode}
                    onChange={(e) => setConvertProductCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Application Notes / Initial Documents Checklist
                </label>
                <textarea
                  value={convertNotes}
                  onChange={(e) => setConvertNotes(e.target.value)}
                  placeholder="Notes for compliance team regarding PAN/Aadhaar/KRA status..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[45px]"
                />
              </div>

              <Button
                size="sm"
                variant="primary"
                className="w-full text-xs bg-blue-600 hover:bg-blue-500"
                isLoading={isConverting}
                onClick={handleConvertLead}
              >
                <ArrowRight className="w-3.5 h-3.5 mr-1" /> Convert Lead &amp; Create Application
              </Button>
            </div>

            {/* Notes history */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Interaction History
              </h3>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">
                {selectedLead.notes || 'No previous notes logged.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE NEW LEAD MODAL */}
      {/* ========================================================================= */}
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
