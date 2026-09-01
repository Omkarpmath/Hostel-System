import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { announcementApi } from '@/api/announcement.api';
import { hostelApi } from '@/api/hostel.api';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import {
  Megaphone, Plus, Search, Calendar, Users, Building2,
  AlertTriangle, Clock, Eye, Trash2, Edit3, CheckCircle2,
  X, AlertCircle, Send, User,
} from 'lucide-react';
import type { Announcement, AnnouncementPriority, AnnouncementTarget, AnnouncementStatus } from '@/types';

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export function AnnouncementsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [hostelFilter, setHostelFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingReadersAnnouncement, setViewingReadersAnnouncement] = useState<Announcement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formPriority, setFormPriority] = useState<AnnouncementPriority>('NORMAL');
  const [formTarget, setFormTarget] = useState<AnnouncementTarget>('ALL_HOSTELS');
  const [formTargetHostelId, setFormTargetHostelId] = useState<string>('');
  const [formTargetYear, setFormTargetYear] = useState<number | ''>('');
  const [formTargetDept, setFormTargetDept] = useState<string>('');
  const [formPublishAt, setFormPublishAt] = useState<string>('');
  const [formExpiresAt, setFormExpiresAt] = useState<string>('');
  const [formStatus, setFormStatus] = useState<AnnouncementStatus>('PUBLISHED');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Hostels for targeting dropdown
  const { data: hostelsData } = useQuery({
    queryKey: ['hostels-list'],
    queryFn: () => hostelApi.getAll(),
  });
  const hostels: any[] = (hostelsData?.data as any)?.data || [];

  // Fetch KPI Stats
  const { data: statsData } = useQuery({
    queryKey: ['announcements-stats'],
    queryFn: () => announcementApi.getStats(),
  });
  const stats = (statsData?.data as any)?.data;

  // Fetch Announcements List
  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['announcements', statusFilter, priorityFilter, hostelFilter, search],
    queryFn: () =>
      announcementApi.getAll({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        hostelId: hostelFilter !== 'ALL' ? hostelFilter : undefined,
        search: search.trim() || undefined,
      }),
  });
  const announcements: Announcement[] = (announcementsData?.data as any)?.data || [];

  // Fetch Single announcement readers when viewing readers modal
  const { data: singleAnnouncementData, isLoading: isLoadingReaders } = useQuery({
    queryKey: ['announcement-detail', viewingReadersAnnouncement?.id],
    queryFn: () => announcementApi.getById(viewingReadersAnnouncement!.id),
    enabled: !!viewingReadersAnnouncement?.id,
  });
  const detailedAnnouncement = (singleAnnouncementData?.data as any)?.data || viewingReadersAnnouncement;

  // Mutation: Create / Update
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<Announcement> = {
        title: formTitle.trim(),
        message: formMessage.trim(),
        priority: formPriority,
        targetAudience: formTarget,
        targetHostelId: formTarget === 'SPECIFIC_HOSTEL' || formTarget === 'CUSTOM_GROUP' ? (formTargetHostelId || null) : null,
        targetYear: formTarget === 'SPECIFIC_YEAR' || formTarget === 'CUSTOM_GROUP' ? (formTargetYear ? Number(formTargetYear) : null) : null,
        targetDepartment: formTarget === 'SPECIFIC_DEPARTMENT' || formTarget === 'CUSTOM_GROUP' ? (formTargetDept.trim() || null) : null,
        status: formStatus,
        publishAt: formPublishAt ? new Date(formPublishAt).toISOString() : new Date().toISOString(),
        expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
      };

      if (editingAnnouncement) {
        return announcementApi.update(editingAnnouncement.id, payload);
      } else {
        return announcementApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements-stats'] });
      closeFormModal();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || 'Failed to save announcement.');
    },
  });

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements-stats'] });
      setDeletingId(null);
    },
  });

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setFormTitle('');
    setFormMessage('');
    setFormPriority('NORMAL');
    setFormTarget('ALL_HOSTELS');
    setFormTargetHostelId('');
    setFormTargetYear('');
    setFormTargetDept('');
    setFormPublishAt('');
    setFormExpiresAt('');
    setFormStatus('PUBLISHED');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (a: Announcement) => {
    setEditingAnnouncement(a);
    setFormTitle(a.title);
    setFormMessage(a.message);
    setFormPriority(a.priority);
    setFormTarget(a.targetAudience);
    setFormTargetHostelId(a.targetHostelId || '');
    setFormTargetYear(a.targetYear || '');
    setFormTargetDept(a.targetDepartment || '');
    setFormPublishAt(a.publishAt ? new Date(a.publishAt).toISOString().slice(0, 16) : '');
    setFormExpiresAt(a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 16) : '');
    setFormStatus(a.status);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const closeFormModal = () => {
    setIsCreateModalOpen(false);
    setEditingAnnouncement(null);
    setFormError(null);
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setHostelFilter('ALL');
  };

  if (isLoading) return <PageSkeleton />;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
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

  const getStatusBadge = (status: AnnouncementStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return { label: 'Published', bg: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7', text: isDark ? '#4ade80' : '#16a34a' };
      case 'SCHEDULED':
        return { label: 'Scheduled', bg: isDark ? 'rgba(168,85,247,0.15)' : '#f3e8ff', text: isDark ? '#c084fc' : '#9333ea' };
      case 'DRAFT':
        return { label: 'Draft', bg: isDark ? 'rgba(148,163,184,0.15)' : '#f1f5f9', text: isDark ? '#94a3b8' : '#64748b' };
      case 'EXPIRED':
        return { label: 'Expired', bg: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', text: isDark ? '#fca5a5' : '#b91c1c' };
      default:
        return { label: status, bg: 'var(--bg-secondary)', text: 'var(--text-secondary)' };
    }
  };

  const getTargetBadgeLabel = (a: Announcement) => {
    switch (a.targetAudience) {
      case 'ALL_HOSTELS':
        return { label: 'All Campus Hostels', icon: Building2 };
      case 'SPECIFIC_HOSTEL':
        return { label: a.targetHostel?.name || 'Specific Hostel', icon: Building2 };
      case 'SPECIFIC_YEAR':
        return { label: `Year ${a.targetYear} Students`, icon: Users };
      case 'SPECIFIC_DEPARTMENT':
        return { label: `${a.targetDepartment} Dept`, icon: Users };
      case 'CUSTOM_GROUP':
        return { label: `${a.targetHostel?.name || 'Hostel'} + Group`, icon: Users };
      default:
        return { label: 'Target Audience', icon: Users };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Announcements Management"
        description="Broadcast official circulars, urgent alerts, and hostel notices with role-based targeting"
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Announcements' }]}
        actions={
          <button
            onClick={openCreateModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.625rem',
              border: 'none',
              backgroundColor: '#2563eb',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
            }}
          >
            <Plus style={{ width: '1rem', height: '1rem' }} />
            <span>Create Announcement</span>
          </button>
        }
      />

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Total Announcements"
          value={stats?.total ?? '—'}
          icon={Megaphone}
          color="blue"
          delay={0}
        />
        <StatCard
          title="Active Published"
          value={stats?.active ?? '—'}
          icon={CheckCircle2}
          color="green"
          delay={0.05}
        />
        <StatCard
          title="Urgent Alerts"
          value={stats?.urgent ?? '—'}
          icon={AlertTriangle}
          color="red"
          delay={0.1}
        />
        <StatCard
          title="Student Reads"
          value={stats?.totalReads ?? '—'}
          icon={Eye}
          color="purple"
          delay={0.15}
        />
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        ...cardStyle,
        padding: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.875rem',
          borderRadius: '0.625rem',
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
          border: '1px solid var(--border-primary)',
          flex: '1 1 240px',
          maxWidth: '400px',
        }}>
          <Search style={{ width: '1rem', height: '1rem', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
            {[
              { key: 'ALL', label: 'All' },
              { key: 'PUBLISHED', label: 'Active' },
              { key: 'SCHEDULED', label: 'Scheduled' },
              { key: 'DRAFT', label: 'Drafts' },
              { key: 'EXPIRED', label: 'Expired' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: statusFilter === tab.key ? 700 : 500,
                  cursor: 'pointer',
                  backgroundColor: statusFilter === tab.key ? (isDark ? 'rgba(59,130,246,0.25)' : 'white') : 'transparent',
                  color: statusFilter === tab.key ? (isDark ? '#60a5fa' : '#2563eb') : 'var(--text-secondary)',
                  boxShadow: statusFilter === tab.key ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Priority Select */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '0.625rem',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="NORMAL">Normal</option>
            <option value="IMPORTANT">Important</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Hostel Select */}
          {hostels.length > 0 && (
            <select
              value={hostelFilter}
              onChange={(e) => setHostelFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.875rem',
                borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            >
              <option value="ALL">All Hostels ({hostels.length})</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}

          {/* Reset Filters */}
          {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || hostelFilter !== 'ALL') && (
            <button
              onClick={resetFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <X style={{ width: '0.75rem', height: '0.75rem' }} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements found"
          description="Create your first announcement or adjust the filters above."
          action={{
            label: 'Create Announcement',
            onClick: openCreateModal,
          }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.map((a, i) => {
            const pStyle = getPriorityStyle(a.priority);
            const sBadge = getStatusBadge(a.status);
            const tBadge = getTargetBadgeLabel(a);
            const TargetIcon = tBadge.icon;
            const author = `${a.createdBy?.firstName || ''} ${a.createdBy?.lastName || ''}`.trim() || 'Staff';

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  ...cardStyle,
                  padding: '1.5rem',
                  position: 'relative',
                  borderLeft: `4px solid ${pStyle.text}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    {/* Badges Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      {/* Priority Pill */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.625rem',
                        borderRadius: '9999px',
                        backgroundColor: pStyle.bg,
                        color: pStyle.text,
                        border: `1px solid ${pStyle.border}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>
                        {a.priority === 'URGENT' && (
                          <span style={{
                            width: '0.4rem',
                            height: '0.4rem',
                            borderRadius: '9999px',
                            backgroundColor: pStyle.text,
                            animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }} />
                        )}
                        {pStyle.label}
                      </span>

                      {/* Status Badge */}
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.375rem',
                        backgroundColor: sBadge.bg,
                        color: sBadge.text,
                      }}>
                        {sBadge.label}
                      </span>

                      {/* Target Audience Badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.375rem',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                        color: 'var(--text-secondary)',
                      }}>
                        <TargetIcon style={{ width: '0.75rem', height: '0.75rem' }} />
                        {tBadge.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                    }}>
                      {a.title}
                    </h3>

                    {/* Message Body */}
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      marginBottom: '1rem',
                    }}>
                      {a.message}
                    </p>

                    {/* Footer Details: Author, Dates */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User style={{ width: '0.75rem', height: '0.75rem' }} />
                        Posted by <strong>{author}</strong> ({a.createdBy?.role})
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
                        Published: {fmtDate(a.publishAt)}
                      </span>
                      {a.expiresAt && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: isDark ? '#f87171' : '#dc2626' }}>
                          <Calendar style={{ width: '0.75rem', height: '0.75rem' }} />
                          Expires: {fmtDate(a.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Analytics Column */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.75rem',
                    minWidth: '180px',
                  }}>
                    {/* Read Analytics Card */}
                    <div
                      onClick={() => setViewingReadersAnnouncement(a)}
                      style={{
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.625rem',
                        backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                        border: '1px solid rgba(59,130,246,0.2)',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#93c5fd' : '#2563eb', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Eye style={{ width: '0.75rem', height: '0.75rem' }} /> Reads: {a.readCount ?? 0}/{a.targetCount ?? 0}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isDark ? '#60a5fa' : '#1d4ed8' }}>
                          {a.readPercentage ?? 0}%
                        </span>
                      </div>
                      {/* Mini Progress Bar */}
                      <div style={{ width: '100%', height: '4px', borderRadius: '9999px', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#dbeafe', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, a.readPercentage ?? 0)}%`,
                          height: '100%',
                          backgroundColor: isDark ? '#60a5fa' : '#2563eb',
                          borderRadius: '9999px',
                        }} />
                      </div>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
                        Click to view student list
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => openEditModal(a)}
                        title="Edit Announcement"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.625rem',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border-primary)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Edit3 style={{ width: '0.75rem', height: '0.75rem' }} /> Edit
                      </button>

                      <button
                        onClick={() => setDeletingId(a.id)}
                        title="Delete Announcement"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.625rem',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(239,68,68,0.3)',
                          backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2',
                          color: isDark ? '#f87171' : '#dc2626',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── CREATE / EDIT MODAL ─── */}
      <AnimatePresence>
        {isCreateModalOpen && (
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
                maxWidth: '620px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '1.25rem',
                border: '1px solid var(--border-primary)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                padding: '2rem',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#60a5fa' : '#2563eb',
                  }}>
                    <Megaphone style={{ width: '1.25rem', height: '1.25rem' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                    </h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Broadcast official messages with automatic student targeting
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeFormModal}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              {formError && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.625rem',
                  backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: isDark ? '#f87171' : '#dc2626',
                  fontSize: '0.8125rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!formTitle.trim() || !formMessage.trim()) {
                    setFormError('Please enter both title and message.');
                    return;
                  }
                  saveMutation.mutate();
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Hostel Cultural Fest 2026 Registration"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.625rem',
                      border: '1px solid var(--border-primary)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Priority Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                    Priority Level
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {(['NORMAL', 'IMPORTANT', 'URGENT'] as AnnouncementPriority[]).map((p) => {
                      const selected = formPriority === p;
                      const pStyle = getPriorityStyle(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormPriority(p)}
                          style={{
                            padding: '0.625rem 0.5rem',
                            borderRadius: '0.625rem',
                            border: selected ? `2px solid ${pStyle.text}` : '1px solid var(--border-primary)',
                            backgroundColor: selected ? pStyle.bg : 'var(--bg-secondary)',
                            color: selected ? pStyle.text : 'var(--text-secondary)',
                            fontWeight: selected ? 800 : 600,
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {pStyle.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                    Target Audience
                  </label>
                  <select
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value as AnnouncementTarget)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.625rem',
                      border: '1px solid var(--border-primary)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL_HOSTELS">All Campus Hostels (Every Student)</option>
                    <option value="SPECIFIC_HOSTEL">Specific Hostel</option>
                    <option value="SPECIFIC_YEAR">Specific Academic Year (1st, 2nd, 3rd, 4th)</option>
                    <option value="SPECIFIC_DEPARTMENT">Specific Branch / Department</option>
                    <option value="CUSTOM_GROUP">Custom Group (Hostel + Year/Dept)</option>
                  </select>
                </div>

                {/* Conditional Sub-selectors */}
                {(formTarget === 'SPECIFIC_HOSTEL' || formTarget === 'CUSTOM_GROUP') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                      Select Hostel *
                    </label>
                    <select
                      value={formTargetHostelId}
                      onChange={(e) => setFormTargetHostelId(e.target.value)}
                      required={formTarget === 'SPECIFIC_HOSTEL'}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.625rem',
                        border: '1px solid var(--border-primary)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        outline: 'none',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Select a hostel...</option>
                      {hostels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(formTarget === 'SPECIFIC_YEAR' || formTarget === 'CUSTOM_GROUP') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                      Target Academic Year
                    </label>
                    <select
                      value={formTargetYear}
                      onChange={(e) => setFormTargetYear(e.target.value ? Number(e.target.value) : '')}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.625rem',
                        border: '1px solid var(--border-primary)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        outline: 'none',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Any Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                )}

                {(formTarget === 'SPECIFIC_DEPARTMENT' || formTarget === 'CUSTOM_GROUP') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                      Department (e.g. CSE, ISE, ECE, MECH)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CSE"
                      value={formTargetDept}
                      onChange={(e) => setFormTargetDept(e.target.value.toUpperCase())}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.625rem',
                        border: '1px solid var(--border-primary)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                )}

                {/* Message Body */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                    Message Content *
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Write detailed circular or notice details..."
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.625rem',
                      border: '1px solid var(--border-primary)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* Lifecycle & Scheduling Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Publish Schedule (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formPublishAt}
                      onChange={(e) => setFormPublishAt(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-primary)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8125rem',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Auto-Expire (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formExpiresAt}
                      onChange={(e) => setFormExpiresAt(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-primary)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8125rem',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>

                {/* Status Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Status
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['PUBLISHED', 'DRAFT'] as AnnouncementStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFormStatus(st)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: formStatus === st ? '2px solid #2563eb' : '1px solid var(--border-primary)',
                          backgroundColor: formStatus === st ? (isDark ? 'rgba(59,130,246,0.2)' : '#eff6ff') : 'transparent',
                          color: formStatus === st ? (isDark ? '#60a5fa' : '#2563eb') : 'var(--text-secondary)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {st === 'PUBLISHED' ? 'Publish Immediately / Scheduled' : 'Save as Draft'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={closeFormModal}
                    style={{
                      padding: '0.625rem 1.25rem',
                      borderRadius: '0.625rem',
                      border: '1px solid var(--border-primary)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    style={{
                      padding: '0.625rem 1.5rem',
                      borderRadius: '0.625rem',
                      border: 'none',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: saveMutation.isPending ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                    }}
                  >
                    <Send style={{ width: '0.875rem', height: '0.875rem' }} />
                    {saveMutation.isPending ? 'Saving...' : editingAnnouncement ? 'Update Announcement' : 'Publish Announcement'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── READERS AUDIT MODAL ─── */}
      <AnimatePresence>
        {viewingReadersAnnouncement && (
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
                maxWidth: '560px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '1.25rem',
                border: '1px solid var(--border-primary)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                padding: '2rem',
                maxHeight: '85vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Eye style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Reader Engagement Audit
                  </h2>
                </div>
                <button
                  onClick={() => setViewingReadersAnnouncement(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                {viewingReadersAnnouncement.title}
              </h4>

              {/* Engagement Overview Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                padding: '1rem',
                borderRadius: '0.75rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                border: '1px solid var(--border-primary)',
                marginBottom: '1.5rem',
              }}>
                <div>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Students</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{detailedAnnouncement?.targetCount ?? 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 600 }}>Total Read</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>{detailedAnnouncement?.readCount ?? 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.6875rem', color: '#f59e0b', fontWeight: 600 }}>Unread</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{detailedAnnouncement?.unreadCount ?? 0}</p>
                </div>
              </div>

              {/* Readers List */}
              <h5 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Students who viewed ({detailedAnnouncement?.reads?.length || 0}):
              </h5>

              {isLoadingReaders ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading readers...</div>
              ) : !detailedAnnouncement?.reads || detailedAnnouncement.reads.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No students have opened this announcement yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                  {detailedAnnouncement.reads.map((r: any) => (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.5rem',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                        border: '1px solid var(--border-primary)',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {r.user?.firstName} {r.user?.lastName}
                        </p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {r.user?.studentProfile?.usn ? `USN: ${r.user.studentProfile.usn}` : r.user?.email} · {r.user?.studentProfile?.department || ''}
                        </p>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {fmtDate(r.readAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {deletingId && (
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
                maxWidth: '420px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '1.25rem',
                border: '1px solid var(--border-primary)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                padding: '1.75rem',
                textAlign: 'center',
              }}
            >
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '9999px',
                backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2',
                color: isDark ? '#f87171' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <Trash2 style={{ width: '1.5rem', height: '1.5rem' }} />
              </div>

              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Delete Announcement?
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                This action will permanently delete this announcement and all associated reader analytics.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setDeletingId(null)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.625rem',
                    border: '1px solid var(--border-primary)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deletingId)}
                  disabled={deleteMutation.isPending}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.625rem',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: deleteMutation.isPending ? 'wait' : 'pointer',
                  }}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
