import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Users,
  MessageSquareWarning,
  AlertCircle,
  Megaphone,
  CheckCheck,
  ChevronRight,
  Loader2,
  Inbox,
  type LucideIcon,
} from 'lucide-react';
import { notificationApi } from '@/api/notification.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import type { Notification, NotificationType } from '@/types';

// Format timestamp relatively
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

// Icon & Accent styling by NotificationType
interface TypeConfig {
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const typeConfigs: Record<NotificationType, TypeConfig> = {
  LEAVE_APPROVED: {
    icon: CheckCircle2,
    bgColor: 'rgba(16, 185, 129, 0.15)',
    textColor: '#10b981',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  LEAVE_REJECTED: {
    icon: XCircle,
    bgColor: 'rgba(239, 68, 68, 0.15)',
    textColor: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  NEW_LEAVE_REQUEST: {
    icon: ClipboardList,
    bgColor: 'rgba(59, 130, 246, 0.15)',
    textColor: '#3b82f6',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  VISITOR_REGISTERED: {
    icon: Users,
    bgColor: 'rgba(168, 85, 247, 0.15)',
    textColor: '#a855f7',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  COMPLAINT_RESOLVED: {
    icon: CheckCircle2,
    bgColor: 'rgba(20, 184, 166, 0.15)',
    textColor: '#14b8a6',
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  COMPLAINT_STATUS_UPDATED: {
    icon: MessageSquareWarning,
    bgColor: 'rgba(245, 158, 11, 0.15)',
    textColor: '#f59e0b',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  NEW_COMPLAINT: {
    icon: MessageSquareWarning,
    bgColor: 'rgba(239, 68, 68, 0.15)',
    textColor: '#f43f5e',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  ATTENDANCE_NOT_RECORDED: {
    icon: AlertCircle,
    bgColor: 'rgba(249, 115, 22, 0.15)',
    textColor: '#f97316',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  NEW_ANNOUNCEMENT: {
    icon: Megaphone,
    bgColor: 'rgba(6, 182, 212, 0.15)',
    textColor: '#06b6d4',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  IMPORTANT_ANNOUNCEMENT: {
    icon: Megaphone,
    bgColor: 'rgba(239, 68, 68, 0.15)',
    textColor: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // 1. Fetch unread count
  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    staleTime: 30000,
  });
  const unreadCount = countData?.data?.data?.count || 0;

  // 2. Fetch recent notifications when dropdown is open
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications-recent', activeTab],
    queryFn: () =>
      notificationApi.getAll({
        limit: 8,
        unreadOnly: activeTab === 'unread',
      }),
    enabled: isOpen,
    staleTime: 10000,
  });
  const notifications: Notification[] = notificationsData?.data?.data?.notifications || [];

  // 3. Mark all as read mutation
  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-all'] });
    },
  });

  // 4. Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-all'] });
    },
  });

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Route resolution helper based on notification details and user role
  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      markReadMutation.mutate(n.id);
    }
    setIsOpen(false);

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

  const handleViewAll = () => {
    setIsOpen(false);
    const role = user?.role?.toLowerCase() || 'student';
    navigate(`/${role}/notifications`);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl transition-all duration-200 border flex items-center justify-center hover:scale-105 active:scale-95"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          color: 'var(--text-primary)',
          backdropFilter: 'blur(8px)',
        }}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5 transition-transform" />

        {/* Unread Badge Counter */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white text-[11px] font-extrabold flex items-center justify-center shadow-lg shadow-red-500/40 border-2 border-white dark:border-slate-900 leading-none"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden"
            style={{
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(20px)',
              boxShadow: isDark
                ? '0 20px 40px -15px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)'
                : '0 20px 40px -15px rgba(0,30,80,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            {/* Dropdown Header */}
            <div
              className="p-3.5 border-b flex items-center justify-between"
              style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  className="flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:opacity-80 transition-opacity"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div
              className="flex px-3 pt-2 pb-1 gap-2 border-b"
              style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'unread'
                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </button>
            </div>

            {/* Notification Items List */}
            <div className="max-h-[340px] overflow-y-auto divide-y divide-white/5 custom-scrollbar">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <p className="text-xs">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
                  >
                    <Inbox className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {activeTab === 'unread' ? "You're all caught up!" : 'No notifications yet'}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {activeTab === 'unread'
                      ? 'No unread notifications at the moment.'
                      : 'Important updates will appear here.'}
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const cfg = typeConfigs[item.type] || typeConfigs.NEW_ANNOUNCEMENT;
                  const Icon = cfg.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNotificationClick(item)}
                      className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors duration-150 ${
                        item.isRead
                          ? 'hover:bg-slate-500/5'
                          : isDark
                          ? 'bg-blue-500/[0.07] hover:bg-blue-500/[0.12]'
                          : 'bg-blue-50/70 hover:bg-blue-50'
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border"
                        style={{
                          backgroundColor: cfg.bgColor,
                          color: cfg.textColor,
                          borderColor: cfg.borderColor,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4
                            className={`text-xs font-bold truncate ${
                              item.isRead ? 'opacity-85' : 'text-blue-600 dark:text-blue-300 font-extrabold'
                            }`}
                            style={{ color: item.isRead ? 'var(--text-primary)' : undefined }}
                          >
                            {item.title}
                          </h4>
                          <span className="text-[10px] whitespace-nowrap text-slate-400 flex-shrink-0">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p
                          className="text-[11px] line-clamp-2 leading-relaxed"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {item.message}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-1.5 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Dropdown Footer: Full Page Link */}
            <div
              className="p-2.5 border-t bg-slate-500/[0.03]"
              style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }}
            >
              <button
                type="button"
                onClick={handleViewAll}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 text-blue-600 dark:text-teal-400 hover:bg-blue-500/10 transition-colors"
              >
                <span>View all notifications</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
