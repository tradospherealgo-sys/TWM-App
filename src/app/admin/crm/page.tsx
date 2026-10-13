'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Layers,
  Users,
  Phone,
  Mail,
  ArrowRight,
  Plus,
  Upload,
  Search,
  Filter,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  FileSpreadsheet,
  Edit2,
  UserX,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  productInterest: string;
  status: string;
  notes: string | null;
  assignedEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedEmployee?: {
    id: string;
    employeeCode: string;
    user: { name: string; email?: string };
  } | null;
  tasks?: Array<{ id: string; title: string; priority: string; status: string }>;
  followUps?: Array<{ id: string; scheduledAt: string; status: string; outcome?: string | null }>;
}

interface EmployeeOption {
  id: string;
  employeeCode: string;
  department: string;
  user: { name: string; email: string };
}

const STAGES = [
  'NEW_LEAD',
  'CONTACTED',
  'INTERESTED',
  'FOLLOW_UP',
  'DOCUMENTS_REQUIRED',
  'APPLICATION',
  'COMPLETED',
  'LOST_CLOSED',
];

const SOURCES = ['DIRECT', 'WEBSITE', 'PORTAL_CLIENT', 'REFERRAL', 'CAMPAIGN', 'CSV_IMPORT'];
const PRODUCTS = ['DEMAT', 'MUTUAL_FUND', 'SIP', 'IPO', 'INSURANCE', 'LOAN', 'GENERAL'];

export default function AdminCrmPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNASSIGNED' | 'PIPELINE' | 'OUTCOMES'>('ALL');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');

  // Manual Lead Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createProduct, setCreateProduct] = useState('DEMAT');
  const [createSource, setCreateSource] = useState('DIRECT');
  const [createAssignedId, setCreateAssignedId] = useState('');
  const [createNotes, setCreateNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit Lead Modal State
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editProduct, setEditProduct] = useState('DEMAT');
  const [editSource, setEditSource] = useState('DIRECT');
  const [editStage, setEditStage] = useState('NEW_LEAD');
  const [editAssignedId, setEditAssignedId] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Outcome (Won / Lost) Modal State
  const [outcomeLead, setOutcomeLead] = useState<LeadItem | null>(null);
  const [outcomeType, setOutcomeType] = useState<'COMPLETED' | 'LOST_CLOSED'>('COMPLETED');
  const [lostReason, setLostReason] = useState('Not interested');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [isSavingOutcome, setIsSavingOutcome] = useState(false);

  // CSV Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importReport, setImportReport] = useState<{
    totalRows: number;
    importedCount: number;
    errorCount: number;
    errors: Array<{ row: number; name?: string; phone?: string; message: string }>;
  } | null>(null);

  useEffect(() => {
    loadCrmData();
  }, []);

  async function loadCrmData() {
    setLoading(true);
    try {
      const [leadsRes, empRes] = await Promise.all([
        fetch('/api/crm/leads?all=true'),
        fetch('/api/admin/employees'),
      ]);

      const [leadsData, empData] = await Promise.all([leadsRes.json(), empRes.json()]);

      if (leadsData.leads) setLeads(leadsData.leads);
      if (empData.employees) setEmployees(empData.employees);
    } catch (err) {
      console.error('Failed to load CRM data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim() || !createPhone.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          phone: createPhone.trim(),
          email: createEmail.trim() || undefined,
          productInterest: createProduct,
          source: createSource,
          assignedEmployeeId: createAssignedId || undefined,
          notes: createNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create lead');
        return;
      }

      setIsCreateOpen(false);
      setCreateName('');
      setCreatePhone('');
      setCreateEmail('');
      setCreateNotes('');
      setCreateAssignedId('');
      await loadCrmData();
    } catch (err) {
      console.error('Lead create error:', err);
      alert('Error creating lead');
    } finally {
      setIsCreating(false);
    }
  }

  function openEditModal(lead: LeadItem) {
    setEditingLead(lead);
    setEditName(lead.name);
    setEditPhone(lead.phone);
    setEditEmail(lead.email || '');
    setEditProduct(lead.productInterest || 'DEMAT');
    setEditSource(lead.source || 'DIRECT');
    setEditStage(lead.status || 'NEW_LEAD');
    setEditAssignedId(lead.assignedEmployeeId || '');
    setEditNotes('');
  }

  async function handleUpdateLead(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLead) return;

    setIsUpdating(true);
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingLead.id,
          name: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim() || undefined,
          productInterest: editProduct,
          source: editSource,
          status: editStage,
          assignedEmployeeId: editAssignedId || null,
          notes: editNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update lead');
        return;
      }

      setEditingLead(null);
      await loadCrmData();
    } catch (err) {
      console.error('Lead update error:', err);
      alert('Error updating lead');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSaveOutcome(e: React.FormEvent) {
    e.preventDefault();
    if (!outcomeLead) return;

    setIsSavingOutcome(true);
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: outcomeLead.id,
          status: outcomeType,
          lostReason: outcomeType === 'LOST_CLOSED' ? lostReason : undefined,
          notes: outcomeNotes.trim() || (outcomeType === 'COMPLETED' ? 'Marked successfully converted' : undefined),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to save outcome');
        return;
      }

      setOutcomeLead(null);
      setOutcomeNotes('');
      await loadCrmData();
    } catch (err) {
      console.error('Outcome save error:', err);
      alert('Error saving outcome');
    } finally {
      setIsSavingOutcome(false);
    }
  }

  async function handleCsvImport(e: React.FormEvent) {
    e.preventDefault();
    if (!csvText.trim()) return;

    setIsImporting(true);
    setImportReport(null);

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        alert('CSV must contain a header row and at least one data row');
        setIsImporting(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const parsedRows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        parsedRows.push(rowObj);
      }

      const res = await fetch('/api/crm/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: parsedRows }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to import CSV');
        return;
      }

      setImportReport({
        totalRows: data.totalRows,
        importedCount: data.importedCount,
        errorCount: data.errorCount,
        errors: data.errors || [],
      });

      await loadCrmData();
    } catch (err: any) {
      alert(`Import error: ${err.message || 'Check CSV format'}`);
    } finally {
      setIsImporting(false);
    }
  }

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    // Tab filter
    if (activeTab === 'UNASSIGNED' && l.assignedEmployeeId !== null) return false;
    if (activeTab === 'PIPELINE' && (l.status === 'COMPLETED' || l.status === 'LOST_CLOSED')) return false;
    if (activeTab === 'OUTCOMES' && l.status !== 'COMPLETED' && l.status !== 'LOST_CLOSED') return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = l.name.toLowerCase().includes(q);
      const matchPhone = l.phone.toLowerCase().includes(q);
      const matchEmail = l.email ? l.email.toLowerCase().includes(q) : false;
      const matchNotes = l.notes ? l.notes.toLowerCase().includes(q) : false;
      const matchStaff = l.assignedEmployee?.user.name.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail && !matchNotes && !matchStaff) return false;
    }

    // Dropdown filters
    if (stageFilter !== 'ALL' && l.status !== stageFilter) return false;
    if (sourceFilter !== 'ALL' && l.source !== sourceFilter) return false;
    if (employeeFilter !== 'ALL') {
      if (employeeFilter === 'UNASSIGNED') {
        if (l.assignedEmployeeId !== null) return false;
      } else if (l.assignedEmployeeId !== employeeFilter) {
        return false;
      }
    }

    return true;
  });

  const unassignedCount = leads.filter((l) => l.assignedEmployeeId === null).length;
  const pipelineCount = leads.filter((l) => l.status !== 'COMPLETED' && l.status !== 'LOST_CLOSED').length;
  const wonCount = leads.filter((l) => l.status === 'COMPLETED').length;
  const lostCount = leads.filter((l) => l.status === 'LOST_CLOSED').length;

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs text-red-400 font-semibold tracking-wide uppercase">
            Client Acquisition &amp; CRM Desk
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Enterprise CRM &amp; Pipeline Control
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full lifecycle lead tracking, staff assignments, CSV imports &amp; conversion analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={loadCrmData} title="Refresh CRM records">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-3.5 h-3.5 mr-1" /> Import CSV
          </Button>
          <Button size="sm" variant="primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add New Lead
          </Button>
        </div>
      </div>

      {/* 2. Pipeline Funnel Stage Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {STAGES.map((st) => {
          const count = leads.filter((l) => l.status === st).length;
          const isSelected = stageFilter === st;

          return (
            <button
              key={st}
              onClick={() => setStageFilter(isSelected ? 'ALL' : st)}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                  : 'bg-[#131C2E] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[9px] uppercase font-bold text-slate-400 truncate">
                {st.replace(/_/g, ' ')}
              </div>
              <div className="text-lg font-bold text-white mt-0.5">{count}</div>
            </button>
          );
        })}
      </div>

      {/* 3. Navigation Tabs & Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Leads ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('UNASSIGNED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'UNASSIGNED' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <span>Unassigned Queue</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-200 text-[10px] border border-amber-800">
                {unassignedCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('PIPELINE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'PIPELINE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Pipeline ({pipelineCount})
            </button>
            <button
              onClick={() => setActiveTab('OUTCOMES')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'OUTCOMES' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Won ({wonCount}) / Lost ({lostCount})
            </button>
          </div>
        </div>

        {/* Search & Filter Dropdowns */}
        <Card className="p-3 bg-[#131C2E] border-slate-800">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search by lead name, phone, email, notes, or assigned staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Stages</option>
                {STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Sources</option>
                {SOURCES.map((sc) => (
                  <option key={sc} value={sc}>
                    {sc}
                  </option>
                ))}
              </select>

              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Assignees</option>
                <option value="UNASSIGNED">Unassigned Only</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.user.name} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Leads Table */}
      <Card className="overflow-x-auto p-0 bg-[#131C2E] border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Lead Details</th>
              <th className="px-4 py-3">Service Interest</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Assigned Staff</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">History / Notes</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-xs">
                  Loading CRM leads...
                </td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-xs">
                  No leads found matching current filters.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{lead.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{lead.phone}</span>
                    </div>
                    {lead.email && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5 text-slate-600" />
                        <span>{lead.email}</span>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-800 font-medium text-[11px]">
                      {lead.productInterest}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-400 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-800 text-slate-400">
                      {lead.source}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-300">
                    {lead.assignedEmployee ? (
                      <div>
                        <div className="font-medium text-white">{lead.assignedEmployee.user.name}</div>
                        <div className="text-[10px] font-mono text-emerald-400">
                          {lead.assignedEmployee.employeeCode}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openEditModal(lead)}
                        className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 text-[10px] font-semibold hover:bg-amber-900 transition-colors"
                      >
                        + Assign Staff
                      </button>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>

                  <td className="px-4 py-3 max-w-xs">
                    {lead.notes ? (
                      <p className="text-[11px] text-slate-300 truncate" title={lead.notes}>
                        {lead.notes.split('\n').pop() || lead.notes}
                      </p>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No notes</span>
                    )}
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Updated: {new Date(lead.updatedAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1 h-7 text-blue-400 hover:text-white"
                        title="Edit lead details and assignment"
                        onClick={() => openEditModal(lead)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                      </Button>

                      {lead.status !== 'COMPLETED' && lead.status !== 'LOST_CLOSED' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs px-2 py-1 h-7"
                          onClick={() => {
                            setOutcomeLead(lead);
                            setOutcomeType('COMPLETED');
                            setOutcomeNotes('');
                          }}
                        >
                          Outcome
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* CREATE LEAD MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Manual Lead Entry</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record new prospective investor or consultation enquiry
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3">
              <Input
                label="Full Legal Name *"
                required
                placeholder="e.g. Ramesh Chandra"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />

              <Input
                label="Contact Mobile (10-15 digits) *"
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={createPhone}
                onChange={(e) => setCreatePhone(e.target.value)}
              />

              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="client@example.com"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Service Interest
                  </label>
                  <select
                    value={createProduct}
                    onChange={(e) => setCreateProduct(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRODUCTS.map((p) => (
                      <option key={p} value={p}>
                        {p.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Lead Source
                  </label>
                  <select
                    value={createSource}
                    onChange={(e) => setCreateSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Assign Staff Member (Optional)
                </label>
                <select
                  value={createAssignedId}
                  onChange={(e) => setCreateAssignedId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Leave Unassigned (Queue)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user.name} ({emp.employeeCode} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Initial Notes / Background
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Client background, portfolio interest, or referral notes..."
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isCreating}>
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

      {/* EDIT LEAD MODAL */}
      {editingLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Edit Lead &amp; Reassignment</h2>
                <p className="text-xs text-slate-400 mt-0.5">Ref ID: #{editingLead.id.slice(-6)}</p>
              </div>
              <button
                onClick={() => setEditingLead(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLead} className="space-y-3">
              <Input
                label="Full Legal Name"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />

              <Input
                label="Contact Mobile"
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />

              <Input
                label="Email Address"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Service Interest
                  </label>
                  <select
                    value={editProduct}
                    onChange={(e) => setEditProduct(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRODUCTS.map((p) => (
                      <option key={p} value={p}>
                        {p.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Assign Staff Member
                </label>
                <select
                  value={editAssignedId}
                  onChange={(e) => setEditAssignedId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned (Queue)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user.name} ({emp.employeeCode} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Append Follow-up Note
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Record interaction outcome or required documents..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isUpdating}>
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-1/3"
                  onClick={() => setEditingLead(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONVERSION & LOSS OUTCOME MODAL */}
      {outcomeLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Record Lead Outcome</h2>
                <p className="text-xs text-slate-400 mt-0.5">Lead: {outcomeLead.name}</p>
              </div>
              <button
                onClick={() => setOutcomeLead(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOutcome} className="space-y-3">
              <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setOutcomeType('COMPLETED')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    outcomeType === 'COMPLETED'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Won / Converted
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeType('LOST_CLOSED')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    outcomeType === 'LOST_CLOSED'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Lost / Closed
                </button>
              </div>

              {outcomeType === 'LOST_CLOSED' && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Loss Reason *
                  </label>
                  <select
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Not interested in financial products">Not interested</option>
                    <option value="Competitor brokerage / better terms elsewhere">Competitor brokerage</option>
                    <option value="Unable to contact / invalid phone number">Unable to contact</option>
                    <option value="KYC document compliance rejection">KYC rejected</option>
                    <option value="Lack of required investment capital">Budget / Capital constraints</option>
                    <option value="Customer requested closure">Customer requested closure</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Outcome Details / Summary
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional details regarding the conversion or reason for closure..."
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSavingOutcome}>
                  Confirm Outcome
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-1/3"
                  onClick={() => setOutcomeLead(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Import Leads via CSV</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Batch upload prospective leads with validation &amp; duplicate protection
                </p>
              </div>
              <button
                onClick={() => {
                  setIsImportOpen(false);
                  setImportReport(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Report */}
            {importReport && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white">Import Summary:</span>
                  <span className="text-emerald-400">{importReport.importedCount} Imported</span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Total Rows Evaluated: {importReport.totalRows}</span>
                  <span className="text-amber-400">{importReport.errorCount} Skipped / Duplicates</span>
                </div>

                {importReport.errors.length > 0 && (
                  <div className="mt-2 max-h-36 overflow-y-auto space-y-1 pt-2 border-t border-slate-800 text-[10px]">
                    {importReport.errors.map((err, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-slate-950/60 text-slate-300 flex justify-between gap-2">
                        <span className="font-mono text-amber-400">Row {err.row}:</span>
                        <span className="truncate flex-1">{err.name ? `${err.name} (${err.phone}) - ` : ''}{err.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleCsvImport} className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  CSV Data Content
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Header format: <code className="text-slate-300">name,phone,email,productInterest,source,notes</code>
                </p>
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`name,phone,email,productInterest,source,notes\nAnanya Sen,9876543210,ananya@example.com,DEMAT,CAMPAIGN,Interested in equity trading\nRohit Verma,9812345678,rohit@example.com,MUTUAL_FUND,REFERRAL,Wants SIP advisory`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isImporting}>
                  Process &amp; Import Leads
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-1/3"
                  onClick={() => {
                    setIsImportOpen(false);
                    setImportReport(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
