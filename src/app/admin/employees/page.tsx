'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Briefcase,
  Users,
  CheckSquare,
  FileSpreadsheet,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Shield,
  Power,
} from 'lucide-react';

interface EmployeeItem {
  id: string;
  employeeCode: string;
  department: string;
  designation: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    status: string;
  };
  assignedLeads: { id: string }[];
  assignedTasks: { id: string }[];
  assignedApplications: { id: string }[];
  dailyReports: {
    submittedAt: string;
    callsCount: number;
    conversionsCount: number;
  }[];
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Provision Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Operations');
  const [designation, setDesignation] = useState('Wealth Executive');
  const [role, setRole] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/employees');
      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleProvisionEmployee(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
          department: department.trim(),
          designation: designation.trim(),
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision employee');
      }

      setSuccessMsg(`Employee account created successfully: ${data.employee.employeeCode}`);
      setIsCreateOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.message || 'Error provisioning employee');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(emp: EmployeeItem) {
    const nextStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: emp.id,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update employee status');
        return;
      }

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === emp.id
            ? { ...e, status: nextStatus, user: { ...e.user, status: nextStatus } }
            : e
        )
      );
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Staff &amp; Relationship Desk</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Admin oversight, employee provisioning &amp; workload distribution
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Provision Employee
        </Button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading staff directory...</div>
      ) : employees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <Card key={emp.id} className="p-4 space-y-3 bg-[#131C2E] border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-sm text-white">{emp.user.name}</div>
                  <div className="text-xs text-slate-400">{emp.user.email}</div>
                  <div className="text-[11px] font-mono text-emerald-400 font-semibold mt-0.5">
                    {emp.employeeCode}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <StatusBadge status={emp.status} />
                  <div className="text-[10px] text-slate-400 block font-mono">{emp.user.role}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <div>
                  <div>Dept: <strong className="text-white">{emp.department}</strong></div>
                  <div>Role: {emp.designation}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={`text-[11px] px-2 py-1 h-7 ${
                    emp.status === 'ACTIVE'
                      ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40'
                      : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
                  }`}
                  onClick={() => handleToggleStatus(emp)}
                >
                  <Power className="w-3 h-3 mr-1" />
                  {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>

              {/* Operational stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] py-2 bg-slate-900/60 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Leads</span>
                  <strong className="text-white">{emp.assignedLeads.length}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Open Tasks</span>
                  <strong className="text-white">{emp.assignedTasks.length}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Apps</span>
                  <strong className="text-white">{emp.assignedApplications.length}</strong>
                </div>
              </div>

              {/* Latest Report */}
              {emp.dailyReports && emp.dailyReports.length > 0 ? (
                <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                  <span className="font-semibold text-slate-300">Latest Report: </span>
                  {new Date(emp.dailyReports[0].submittedAt).toLocaleDateString()} (Calls: {emp.dailyReports[0].callsCount}, Conversions: {emp.dailyReports[0].conversionsCount})
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic">No daily report filed today.</div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-xs text-slate-400">
          No employees provisioned yet. Click &quot;Provision Employee&quot; to create staff accounts.
        </Card>
      )}

      {/* PROVISION EMPLOYEE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Provision Staff Account</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Create an operational Employee or Administrator login
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleProvisionEmployee} className="space-y-3">
              <Input
                label="Full Legal Name"
                required
                placeholder="e.g. Vikram Singhania"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Corporate Email Address"
                type="email"
                required
                placeholder="e.g. vikram.s@tradosphere.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Contact Mobile"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Input
                label="Initial Password"
                type="password"
                required
                placeholder="Minimum 8 characters (Upper, lower, digit)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Wealth Advisory">Wealth Advisory</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Support">Support Desk</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Role Access
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'EMPLOYEE' | 'ADMIN')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EMPLOYEE">Employee (OS)</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <Input
                label="Designation / Title"
                required
                placeholder="e.g. Senior Wealth Advisor"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />

              <div className="flex gap-2 pt-2">
                <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSubmitting}>
                  Provision Account
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
