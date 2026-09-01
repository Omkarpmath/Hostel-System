import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  ClipboardList,
  Users,
  MessageSquareWarning,
  AlertCircle,
  Megaphone,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Inbox,
  Filter,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import { notificationApi } from '@/api/notification.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import type { Notification, NotificationType } from '@/types';

interface TypeConfig {
  icon: LucideIcon;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const typeConfigs: Record<NotificationType, TypeConfig> = {
  LEAVE_APPROVED: {
    icon: CheckCircle2,
    label: 'Leave Approved',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    textColor: '#10b981',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  LEAVE_REJECTED: {
    icon: XCircle,
    label: 'Leave Rejected',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    textColor: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  NEW_LEAVE_REQUEST: {
    icon: ClipboardList,
    label: 'New Leave Request',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    textColor: '#3b82f6',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  VISITOR_REGISTERED: {
    icon: Users,
    label: 'Visitor Registered',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    textColor: '#a855f7',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  COMPLAINT_RESOLVED: {
    icon: CheckCircle2,
    label: 'Complaint Resolved',
    bgColor: 'rgba(20, 184, 166, 0.15)',
    textColor: '#14b8a6',
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  COMPLAINT_STATUS_UPDATED: {
    icon: MessageSquareWarning,
    label: 'Complaint Update',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    textColor: '#f59e0b',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  NEW_COMPLAINT: {
    icon: MessageSquareWarning,
    label: 'New Complaint',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    textColor: '#f43f5e',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  ATTENDANCE_NOT_RECORDED: {
    icon: AlertCircle,
    label: 'Attendance Alert',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    textColor: '#f97316',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  NEW_ANNOUNCEMENT: {
    icon: Megaphone,
    label: 'Announcement',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    textColor: '#06b6d4',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  IMPORTANT_ANNOUNCEMENT: {
    icon: Megaphone,
    label: 'Important Announcement',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    textColor: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
};

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const limit = 12;

  // 1. Fetch paginated notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications-all', page, activeTab, selectedType],
    queryFn: () =>
      notificationApi.getAll({
        page,
        limit,
        unreadOnly: activeTab === 'unread',
        type: selectedType !== 'ALL' ? (selectedType as NotificationType) : undefined,
      }),
    staleTime: 10000,
  });

  const notifications: Notification[] = notificationsData?.data?.data?.notifications || [];
  const meta = notificationsData?.data?.data?.meta || {
    total: 0,
    unreadCount: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasMore: false,
  };

  // 2. Mark all as read mutation
  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-all'] });
    },
  });

  // 3. Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-all'] });
    },
  });

  // 4. Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-all'] });
    },
  });

  const handleActionClick = (n: Notification) => {
    if (!n.isRead) {
      markReadMutation.mutate(n.id);
    }
    const role = user?.role?.toLowerCase() || 'student';

    switch (n.relatedType) {
      case 'LEAVE':
        navigate(`/${role}/leaves`);
        break;
      case 'COMPLAINT':
        navigate(`/${role}/complaints`);
        break;
      case 'VISITOR':
        navigate(`/${role}/visitors`);
        break;
      case 'ANNOUNCEMENT':
        navigate(`/${role}/announcements`);
        break;
      case 'ATTENDANCE':
        navigate(`/${role}/attendance`);
        break;
      default:
        navigate(`/${role}/dashboard`);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Notifications"
        description="Stay updated with all campus alerts, leave approvals, complaints, and visitor logs."
        breadcrumbs={[
          { label: 'Dashboard', href: `/${user?.role?.toLowerCase() || 'student'}/dashboard` },
          { label: 'Notifications' },
        ]}
        actions={
          meta.unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/20 hover:opacity-95 active:scale-95 transition-all"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All as Read ({meta.unreadCount})</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter and Tab Controls */}
      <div
        className="p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-primary)',
        }}
      >
        {/* Tabs: All / Unread */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-500/10 border border-slate-500/10">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All Notifications
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('unread');
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Unread</span>
            {meta.unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-extrabold">
                {meta.unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Category / Type Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-400">Category:</span>
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Leaves', value: 'LEAVE_APPROVED' },
            { label: 'Complaints', value: 'COMPLAINT_RESOLVED' },
            { label: 'Visitors', value: 'VISITOR_REGISTERED' },
            { label: 'Announcements', value: 'NEW_ANNOUNCEMENT' },
            { label: 'Attendance', value: 'ATTENDANCE_NOT_RECORDED' },
          ].map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                setSelectedType(cat.value);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                selectedType === cat.value
                  ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30'
                  : 'border-transparent text-slate-500 hover:bg-slate-500/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <PageSkeleton />
      ) : notifications.length === 0 ? (
        <div
          className="p-16 rounded-3xl border text-center flex flex-col items-center justify-center gap-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-teal-500/10 flex items-center justify-center border border-blue-500/20">
            <Inbox className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {activeTab === 'unread' ? "You're all caught up!" : 'No notifications yet'}
          </h3>
          <p className="text-sm max-w-sm text-center" style={{ color: 'var(--text-secondary)' }}>
            {activeTab === 'unread'
              ? 'There are no unread notifications for your account.'
              : 'You will receive notifications when leave requests are decided, visitors arrive, complaints update, or announcements are published.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.map((item) => {
              const cfg = typeConfigs[item.type] || typeConfigs.NEW_ANNOUNCEMENT;
              const Icon = cfg.icon;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    !item.isRead
                      ? isDark
                        ? 'bg-blue-950/20 border-blue-500/30 shadow-lg shadow-blue-950/20'
                        : 'bg-blue-50/60 border-blue-200 shadow-sm'
                      : 'hover:border-slate-400/30'
                  }`}
                  style={{
                    backgroundColor: item.isRead ? 'var(--bg-card)' : undefined,
                    borderColor: item.isRead ? 'var(--border-primary)' : undefined,
                  }}
                >
                  {/* Left: Icon & Notification Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border mt-0.5"
                      style={{
                        backgroundColor: cfg.bgColor,
                        color: cfg.textColor,
                        borderColor: cfg.borderColor,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                          style={{
                            backgroundColor: cfg.bgColor,
                            color: cfg.textColor,
                            borderColor: cfg.borderColor,
                          }}
                        >
                          {cfg.label}
                        </span>

                        {!item.isRead && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                            New
                          </span>
                        )}

                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h4
                        className={`text-sm font-bold ${
                          !item.isRead ? 'text-blue-600 dark:text-blue-300 font-extrabold' : ''
                        }`}
                        style={{ color: item.isRead ? 'var(--text-primary)' : undefined }}
                      >
                        {item.title}
                      </h4>

                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {item.message}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {item.relatedType && (
                      <button
                        type="button"
                        onClick={() => handleActionClick(item)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
                      >
                        <span>View Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => markReadMutation.mutate(item.id)}
                        className="p-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-500/10 transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="p-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Dismiss notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Controls */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <p className="text-xs text-slate-400">
            Showing {(page - 1) * limit + 1} – {Math.min(page * limit, meta.total)} of {meta.total} notifications
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-xl border text-xs font-bold disabled:opacity-30 hover:bg-slate-500/10 transition-colors flex items-center gap-1"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-blue-500/10 text-blue-500">
              Page {page} of {meta.totalPages}
            </span>

            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-xl border text-xs font-bold disabled:opacity-30 hover:bg-slate-500/10 transition-colors flex items-center gap-1"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
