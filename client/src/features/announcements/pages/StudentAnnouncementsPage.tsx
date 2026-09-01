import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { announcementApi } from '@/api/announcement.api';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import {
  Megaphone, Clock,
  Building2, CheckCheck, X, User, ArrowRight,
} from 'lucide-react';
import type { Announcement, AnnouncementPriority } from '@/types';

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export function StudentAnnouncementsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD' | 'URGENT'>('ALL');
  const [readingAnnouncement, setReadingAnnouncement] = useState<Announcement | null>(null);

  // Fetch student announcements
  const { data, isLoading } = useQuery({
    queryKey: ['my-announcements'],
    queryFn: () => announcementApi.getMy(),
  });
  const allAnnouncements: Announcement[] = (data?.data as any)?.data || [];

  // Filtered list
  const announcements = allAnnouncements.filter((a) => {
    if (filterMode === 'UNREAD') return !a.isRead;
    if (filterMode === 'URGENT') return a.priority === 'URGENT';
    return true;
  });

  const unreadCount = allAnnouncements.filter((a) => !a.isRead).length;

  // Mutation: Mark single as read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => announcementApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-announcements'] });
    },
  });

  // Mutation: Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: () => announcementApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-announcements'] });
    },
  });

  const handleOpenAnnouncement = (a: Announcement) => {
    setReadingAnnouncement(a);
    if (!a.isRead) {
      markReadMutation.mutate(a.id);
    }
  };

  const getPriorityStyle = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'URGENT':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
          text: isDark ? '#f87171' : '#dc2626',
          border: 'rgba(239, 68, 68, 0.3)',
          label: 'Urgent',
        };
      case 'IMPORTANT':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
          text: isDark ? '#fbbf24' : '#d97706',
          border: 'rgba(245, 158, 11, 0.3)',
          label: 'Important',
        };
      default:
        return {
          bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe',
          text: isDark ? '#93c5fd' : '#2563eb',
          border: 'rgba(59, 130, 246, 0.3)',
          label: 'Normal',
        };
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Hostel Announcements"
        description="Official notices, alerts, and circulars targeted to your hostel & batch"
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Announcements' }]}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={() => markAllReadMutation.mutate()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <CheckCheck style={{ width: '1rem', height: '1rem', color: '#2563eb' }} />
              <span>Mark all read ({unreadCount})</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
          {[
            { key: 'ALL' as const, label: `All Notices (${allAnnouncements.length})` },
            { key: 'UNREAD' as const, label: `Unread (${unreadCount})` },
            { key: 'URGENT' as const, label: `Urgent (${allAnnouncements.filter((a) => a.priority === 'URGENT').length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterMode(tab.key)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.625rem',
                border: 'none',
                fontSize: '0.8125rem',
                fontWeight: filterMode === tab.key ? 700 : 500,
                cursor: 'pointer',
                backgroundColor: filterMode === tab.key ? (isDark ? 'rgba(59,130,246,0.25)' : 'white') : 'transparent',
                color: filterMode === tab.key ? (isDark ? '#60a5fa' : '#2563eb') : 'var(--text-secondary)',
                boxShadow: filterMode === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements Feed */}
      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={filterMode === 'UNREAD' ? 'You are all caught up!' : 'No announcements right now'}
          description={filterMode === 'UNREAD' ? 'No unread announcements. Check back later for updates.' : 'There are no notices matching your filter.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.map((a, i) => {
            const pStyle = getPriorityStyle(a.priority);
            const isUnread = !a.isRead;
            const author = `${a.createdBy?.firstName || ''} ${a.createdBy?.lastName || ''}`.trim() || 'Hostel Administration';

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleOpenAnnouncement(a)}
                style={{
                  ...cardStyle,
                  padding: '1.5rem',
                  cursor: 'pointer',
                  borderLeft: isUnread ? `4px solid ${isDark ? '#60a5fa' : '#2563eb'}` : '1px solid var(--border-primary)',
                  backgroundColor: isUnread
                    ? (isDark ? 'rgba(30, 58, 138, 0.15)' : '#f0f7ff')
                    : 'var(--bg-card)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      {/* Unread Pill */}
                      {isUnread && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: isDark ? 'rgba(59,130,246,0.25)' : '#dbeafe',
                          color: isDark ? '#93c5fd' : '#1d4ed8',
                        }}>
                          <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '9999px', backgroundColor: '#2563eb' }} />
                          NEW
                        </span>
                      )}

                      {/* Priority Pill */}
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: pStyle.bg,
                        color: pStyle.text,
                        border: `1px solid ${pStyle.border}`,
                        textTransform: 'uppercase',
                      }}>
                        {pStyle.label}
                      </span>

                      {/* Target Pill */}
                      {a.targetHostel && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.375rem',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                          color: 'var(--text-secondary)',
                        }}>
                          <Building2 style={{ width: '0.75rem', height: '0.75rem' }} />
                          {a.targetHostel.name}
                        </span>
                      )}
                    </div>

                    <h3 style={{
                      fontSize: '1.0625rem',
                      fontWeight: isUnread ? 800 : 600,
                      color: 'var(--text-primary)',
                      marginBottom: '0.375rem',
                    }}>
                      {a.title}
                    </h3>

                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '0.75rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {a.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User style={{ width: '0.75rem', height: '0.75rem' }} /> {author}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock style={{ width: '0.75rem', height: '0.75rem' }} /> {fmtDate(a.publishAt)}
                      </span>
                    </div>
                  </div>

                  <ArrowRight style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)', flexShrink: 0, marginTop: '0.5rem' }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── READING FULL NOTICE MODAL ─── */}
      <AnimatePresence>
        {readingAnnouncement && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            padding: '1rem',
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: '600px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '1.25rem',
                border: '1px solid var(--border-primary)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                padding: '2rem',
                maxHeight: '85vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.625rem',
                    borderRadius: '9999px',
                    backgroundColor: getPriorityStyle(readingAnnouncement.priority).bg,
                    color: getPriorityStyle(readingAnnouncement.priority).text,
                    textTransform: 'uppercase',
                  }}>
                    {getPriorityStyle(readingAnnouncement.priority).label}
                  </span>
                  {readingAnnouncement.targetHostel && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Building2 style={{ width: '0.75rem', height: '0.75rem' }} />
                      {readingAnnouncement.targetHostel.name}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setReadingAnnouncement(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                {readingAnnouncement.title}
              </h2>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.625rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                border: '1px solid var(--border-primary)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
              }}>
                <span>Posted by: <strong>{readingAnnouncement.createdBy?.firstName} {readingAnnouncement.createdBy?.lastName}</strong> ({readingAnnouncement.createdBy?.role})</span>
                <span>•</span>
                <span>{fmtDate(readingAnnouncement.publishAt)}</span>
              </div>

              <div style={{
                fontSize: '0.9375rem',
                color: 'var(--text-primary)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                marginBottom: '2rem',
              }}>
                {readingAnnouncement.message}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setReadingAnnouncement(null)}
                  style={{
                    padding: '0.625rem 1.5rem',
                    borderRadius: '0.625rem',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
