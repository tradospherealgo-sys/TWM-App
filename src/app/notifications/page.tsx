'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  FileText,
  CheckSquare,
  UserPlus,
  MessageSquare,
  Briefcase,
  Sparkles,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowLeft,
} from 'lucide-react';
import type { NotificationItem } from '@/components/notifications/NotificationCenter';

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'KYC', label: 'KYC & Docs' },
  { value: 'APPLICATION', label: 'Applications' },
  { value: 'TASK', label: 'Tasks' },
  { value: 'LEAD', label: 'Leads' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'SYSTEM', label: 'System' },
];

function getCategoryIcon(category: string) {
  switch (category.toUpperCase()) {
    case 'SECURITY':
      return <ShieldAlert className="w-4 h-4 text-red-400" />;
    case 'KYC':
      return <ShieldCheck className="w-4 h-4 text-purple-400" />;
    case 'APPLICATION':
      return <FileText className="w-4 h-4 text-blue-400" />;
    case 'TASK':
      return <CheckSquare className="w-4 h-4 text-cyan-400" />;
    case 'LEAD':
      return <UserPlus className="w-4 h-4 text-emerald-400" />;
    case 'SUPPORT':
      return <MessageSquare className="w-4 h-4 text-amber-400" />;
    case 'STAFF':
      return <Briefcase className="w-4 h-4 text-indigo-400" />;
    case 'MARKET':
      return <Sparkles className="w-4 h-4 text-emerald-400" />;
    default:
      return <Bell className="w-4 h-4 text-slate-400" />;
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedCategory, unreadOnly]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (unreadOnly) params.set('unread', 'true');
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);

      const res = await fetch(`/api/notifications?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotal(data.pagination.total || 0);
        }
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error('Mark read error:', e);
    }
  }

  async function handleMarkAllRead() {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error('Mark all read error:', e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      {/* Back button */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" /> Notification Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational activity, KYC updates, account alerts &amp; system communications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button size="sm" variant="secondary" onClick={handleMarkAllRead}>
              <CheckCheck className="w-3.5 h-3.5 mr-1 text-blue-400" /> Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#131C2E] p-3 rounded-2xl border border-slate-800">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setSelectedCategory(cat.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Read / Unread Filter */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => {
                setUnreadOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <span>Unread Only</span>
            {unreadCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                {unreadCount}
              </span>
            )}
          </label>
        </div>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 bg-[#131C2E] border-slate-800 transition-all ${
                notif.isRead ? 'opacity-90' : 'border-blue-900/40 bg-[#162035]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase bg-slate-900 text-slate-300 border border-slate-800">
                        {notif.category}
                      </span>
                      <h3
                        className={`text-sm font-bold truncate ${
                          notif.isRead ? 'text-slate-200' : 'text-white'
                        }`}
                      >
                        {notif.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(notif.id)}
                          className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {notif.message}
                  </p>

                  {notif.linkUrl && (
                    <div className="pt-2">
                      <Link
                        href={notif.linkUrl}
                        onClick={() => {
                          if (!notif.isRead) handleMarkRead(notif.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-950 px-3 py-1.5 rounded-lg border border-blue-900/60 transition-colors"
                      >
                        <span>Open Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs text-slate-400 border-t border-slate-800">
              <div>
                Showing page <strong className="text-white">{page}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong> ({total} total notifications)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="p-12 text-center space-y-2 bg-[#131C2E]">
          <Bell className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Notifications Found</h3>
          <p className="text-xs text-slate-400">
            {unreadOnly
              ? 'You have read all notifications in this category.'
              : 'No notification records logged for your account yet.'}
          </p>
        </Card>
      )}
    </div>
  );
}
