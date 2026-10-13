'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  UserCheck,
  ArrowRight,
  UserX,
  Search,
  RefreshCw,
} from 'lucide-react';

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  assignedEmployeeId: string;
  assignedEmployee?: {
    id: string;
    employeeCode: string;
    user: { name: string; email?: string };
  } | null;
  customer?: { id: string; user: { name: string; phone?: string | null } } | null;
  lead?: { id: string; name: string; phone: string; productInterest: string } | null;
}

interface EmployeeOption {
  id: string;
  employeeCode: string;
  department: string;
  user: { name: string; email: string };
}

interface LeadOption {
  id: string;
  name: string;
  productInterest: string;
}

export default function AdminCentralTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');

  // Create Task Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reassign Modal
  const [reassignTask, setReassignTask] = useState<TaskItem | null>(null);
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [tasksRes, empRes, leadsRes] = await Promise.all([
        fetch('/api/crm/tasks'),
        fetch('/api/admin/employees'),
        fetch('/api/crm/leads'),
      ]);

      const [tasksData, empData, leadsData] = await Promise.all([
        tasksRes.json(),
        empRes.json(),
        leadsRes.json(),
      ]);

      if (tasksData.tasks) setTasks(tasksData.tasks);
      if (empData.employees) setEmployees(empData.employees);
      if (leadsData.leads) setLeads(leadsData.leads);
    } catch (err) {
      console.error('Failed to load tasks and staff:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !assignedEmployeeId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          assignedEmployeeId,
          leadId: leadId || undefined,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to allocate task');
        return;
      }

      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      setLeadId('');
      setAssignedEmployeeId('');
      await loadData();
    } catch (err) {
      console.error('Task creation error:', err);
      alert('Error creating task');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReassignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reassignTask || !newAssigneeId) return;

    setIsReassigning(true);
    try {
      const res = await fetch('/api/crm/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reassignTask.id,
          assignedEmployeeId: newAssigneeId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to reassign task');
        return;
      }

      setReassignTask(null);
      setNewAssigneeId('');
      await loadData();
    } catch (err) {
      console.error('Task reassign error:', err);
      alert('Error reassigning task');
    } finally {
      setIsReassigning(false);
    }
  }

  async function handleQuickStatusChange(task: TaskItem, newStatus: TaskItem['status']) {
    try {
      const res = await fetch('/api/crm/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.task) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
      } else {
        alert(data.error || 'Failed to update task status');
      }
    } catch (err) {
      console.error('Status change error:', err);
    }
  }

  async function handleEscalatePriority(task: TaskItem, nextPriority: TaskItem['priority']) {
    try {
      const res = await fetch('/api/crm/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          priority: nextPriority,
        }),
      });

      const data = await res.json();
      if (res.ok && data.task) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, priority: nextPriority } : t)));
      }
    } catch (err) {
      console.error('Priority escalate error:', err);
    }
  }

  // Filter tasks
  const now = new Date();
  const filteredTasks = tasks.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description ? t.description.toLowerCase().includes(q) : false;
      const matchStaff = t.assignedEmployee?.user.name.toLowerCase().includes(q);
      const matchCustomer = t.customer?.user.name.toLowerCase().includes(q);
      const matchLead = t.lead?.name.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchStaff && !matchCustomer && !matchLead) return false;
    }

    if (statusFilter === 'PENDING') {
      if (t.status !== 'PENDING' && t.status !== 'IN_PROGRESS') return false;
    } else if (statusFilter === 'OVERDUE') {
      const isPastDue = t.dueDate ? new Date(t.dueDate) < now : false;
      if (t.status === 'COMPLETED' || !isPastDue) return false;
    } else if (statusFilter !== 'ALL' && t.status !== statusFilter) {
      return false;
    }

    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (employeeFilter !== 'ALL' && t.assignedEmployeeId !== employeeFilter) return false;

    return true;
  });

  const pendingCount = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueCount = tasks.filter((t) => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < now).length;
  const urgentCount = tasks.filter((t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'COMPLETED').length;

  return (
    <div className="space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs text-red-400 font-semibold tracking-wide uppercase">
            Operations &amp; Workload Desk
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Central Task Allocation &amp; Tracking
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Admin oversight, employee assignments, KYC document verifications &amp; overdue monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={loadData} title="Refresh tasks">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Button size="sm" variant="primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Allocate New Task
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#131C2E] border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Open Tasks</div>
          <div className="text-2xl font-bold text-white mt-1">{pendingCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active across staff</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131C2E] border border-slate-800">
          <div className="text-[11px] font-semibold text-rose-400 uppercase">Overdue Items</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{overdueCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Exceeded deadline</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131C2E] border border-slate-800">
          <div className="text-[11px] font-semibold text-amber-400 uppercase">High / Urgent Priority</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{urgentCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Requires immediate attention</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131C2E] border border-slate-800">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase">Completed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Resolved tasks</div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <Card className="p-3 bg-[#131C2E] border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks by title, staff member, lead, or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending / In Progress</option>
              <option value="OVERDUE">Overdue Only</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Assigned Staff</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user.name} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* 4. Task Allocation List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading central tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <Card className="py-12 text-center text-xs text-slate-400">
          No tasks found matching current filters.
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            const isPastDue = task.dueDate ? new Date(task.dueDate) < now : false;
            const isOverdue = !isCompleted && isPastDue;

            return (
              <Card
                key={task.id}
                className={`p-4 transition-all ${
                  isCompleted
                    ? 'opacity-65 bg-slate-900/40 border-slate-800/80'
                    : isOverdue
                    ? 'bg-[#181a28] border-rose-900/60'
                    : 'bg-[#131C2E] border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm font-bold leading-tight ${
                          isCompleted ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </h3>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          task.priority === 'URGENT'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : task.priority === 'HIGH'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {task.priority}
                      </span>

                      {isOverdue && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-950 text-rose-400 border border-rose-800/80 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      )}

                      <StatusBadge status={task.status} />
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-300 leading-relaxed max-w-3xl whitespace-pre-wrap">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                      <div>
                        Responsible Staff:{' '}
                        <strong className="text-white">
                          {task.assignedEmployee?.user.name || 'Unassigned'}
                        </strong>
                        {task.assignedEmployee && (
                          <span className="text-slate-500 ml-1 font-mono">
                            ({task.assignedEmployee.employeeCode})
                          </span>
                        )}
                      </div>

                      {task.lead && (
                        <div>
                          Lead: <strong className="text-blue-400">{task.lead.name}</strong> ({task.lead.productInterest})
                        </div>
                      )}

                      {task.customer && (
                        <div>
                          Client: <strong className="text-emerald-400">{task.customer.user.name}</strong>
                        </div>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Deadline: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Reassign, Status change, Escalate */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-blue-400 border-blue-900/60 hover:bg-blue-950/40"
                      onClick={() => {
                        setReassignTask(task);
                        setNewAssigneeId(task.assignedEmployeeId || '');
                      }}
                    >
                      <UserCheck className="w-3 h-3 mr-1" /> Reassign
                    </Button>

                    <Button
                      size="sm"
                      variant={isCompleted ? 'secondary' : 'primary'}
                      className="text-xs"
                      onClick={() =>
                        handleQuickStatusChange(task, isCompleted ? 'PENDING' : 'COMPLETED')
                      }
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {isCompleted ? 'Reopen' : 'Complete'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE CENTRAL TASK MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Allocate Employee Task</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assign operational instructions, lead follow-up, or KYC review to staff
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <Input
                label="Task Title / Assignment *"
                required
                placeholder="e.g. Follow up on CKYC documentation for client"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Assign to Employee *
                </label>
                <select
                  required
                  value={assignedEmployeeId}
                  onChange={(e) => setAssignedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user.name} — {emp.employeeCode} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Related Lead (Optional)
                </label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None / Internal Task</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.productInterest})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Specific requirements, customer notes, or next steps..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Deadline / Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSubmitting}>
                  Allocate Task
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

      {/* REASSIGN TASK MODAL */}
      {reassignTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Reassign Task</h2>
              <button
                onClick={() => setReassignTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Transfer responsibility for &quot;<strong className="text-white">{reassignTask.title}</strong>&quot; to another staff member.
            </p>

            <form onSubmit={handleReassignSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  New Assignee
                </label>
                <select
                  required
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Staff Member...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user.name} ({emp.employeeCode} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isReassigning}>
                  Confirm Reassignment
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-1/3"
                  onClick={() => setReassignTask(null)}
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
