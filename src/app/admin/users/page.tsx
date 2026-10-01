'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Users,
  Shield,
  Search,
  CheckCircle2,
  X,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'CLIENT' | 'EMPLOYEE' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  customerProfile?: { id: string; customerCode: string; kycStatus: string } | null;
  employeeProfile?: { id: string; employeeCode: string; department: string; designation: string } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Edit Modal State
  const [newRole, setNewRole] = useState<'CLIENT' | 'EMPLOYEE' | 'ADMIN'>('CLIENT');
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveUser() {
    if (!selectedUser) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: newRole,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (data.user) {
        setUsers(
          users.map((u) =>
            u.id === selectedUser.id ? { ...u, role: newRole, status: newStatus } : u
          )
        );
        setSelectedUser(null);
      } else {
        setUpdateError(data.error || 'Failed to update user');
      }
    } catch (e) {
      console.error(e);
      setUpdateError('Network or server error while updating user access');
    } finally {
      setIsUpdating(false);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">User &amp; Role Management</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Role-based access control, privilege assignments &amp; account status
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading users...</div>
      ) : (
        <Card className="overflow-x-auto p-0 bg-[#131C2E] border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Identifier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : u.role === 'EMPLOYEE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    {u.employeeProfile?.employeeCode || u.customerProfile?.customerCode || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(u);
                        setNewRole(u.role);
                        setNewStatus(u.status);
                        setUpdateError(null);
                      }}
                      className="text-xs"
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* EDIT MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Manage User Access</h2>
                <div className="text-xs text-slate-400">{selectedUser.name} ({selectedUser.email})</div>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUpdateError(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {updateError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{updateError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Assign System Role
                </label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CLIENT">CLIENT (Customer Portal Access)</option>
                  <option value="EMPLOYEE">EMPLOYEE (Employee Daily OS Access)</option>
                  <option value="ADMIN">ADMIN (Full Business Control Center)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Server-side RBAC immediately reflects this role upon next session verification.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Account Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e: any) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED (Blocks login immediately)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full text-xs"
                  isLoading={isUpdating}
                  onClick={handleSaveUser}
                >
                  Save Access Changes
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  className="w-1/3 text-xs"
                  onClick={() => {
                    setSelectedUser(null);
                    setUpdateError(null);
                  }}
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
