import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { operationsApi } from '@/api/operations.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { getMediaUrl } from '@/api/axios';
import {
  MessageSquareWarning, Plus, X, Loader2, AlertCircle,
  User, ChevronRight, CheckCircle2,
  Wrench, Zap, Droplets, Wifi, Trash2, HelpCircle,
  Paperclip, Film, Search, Clock,
  Calendar, BedDouble, Play, Image as ImageIcon, Building2,
} from 'lucide-react';
import { hostelApi } from '@/api/hostel.api';

const isVideoUrl = (url?: string | null) =>
  typeof url === 'string' && (url.startsWith('data:video/') || /\.(mp4|webm|mov|m4v)$/i.test(url));

const formatDate = (d?: string | Date) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatTime = (d?: string | Date) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

const CATEGORIES = [
  { id: 'ELECTRICAL', label: 'Electrical', icon: Zap, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', desc: 'Lights, fans, sockets, wiring' },
  { id: 'PLUMBING', label: 'Plumbing', icon: Droplets, color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', desc: 'Taps, leakage, washroom, drain' },
  { id: 'FURNITURE', label: 'Furniture & Carpentry', icon: Wrench, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', desc: 'Beds, tables, cupboards, doors' },
  { id: 'CLEANING', label: 'Housekeeping & Hygiene', icon: Trash2, color: '#10b981', bg: 'rgba(16,185,129,0.12)', desc: 'Room cleaning, garbage, corridor' },
  { id: 'NETWORK', label: 'WiFi & Internet', icon: Wifi, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', desc: 'LAN ports, WiFi router, speed' },
  { id: 'OTHER', label: 'Other Issues', icon: HelpCircle, color: '#64748b', bg: 'rgba(100,116,139,0.12)', desc: 'General hostel maintenance' },
];

const PRIORITIES = [
  { id: 'LOW', label: 'Low', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  { id: 'MEDIUM', label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { id: 'HIGH', label: 'High', color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
  { id: 'URGENT', label: 'Urgent', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
];

export function ComplaintsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedHostel, setSelectedHostel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvingComplaint, setResolvingComplaint] = useState<any | null>(null);

  const canFilterHostel = user?.role === 'ADMIN' || user?.role === 'WARDEN';

  // Fetch available hostels for filter
  const { data: hostelsData } = useQuery({
    queryKey: ['hostels-list'],
    queryFn: () => hostelApi.getAll(),
    enabled: canFilterHostel,
  });
  const availableHostels: any[] = (hostelsData?.data as any)?.data || [];

  const { data, isLoading, isError, error } = useQuery<any>({
    queryKey: ['complaints', selectedHostel],
    queryFn: () => operationsApi.complaints({ hostelId: selectedHostel !== 'ALL' ? selectedHostel : undefined }),
    retry: 1,
  });
  const complaints: any[] = (data?.data as any)?.data || [];

  const canAdd = user?.role === 'STUDENT';
  const canUpdate = user?.role === 'WARDEN' || user?.role === 'ADMIN';

  const update = useMutation<any, Error, { id: string; data: any }>({
    mutationFn: ({ id, data }) => operationsApi.updateComplaint(id, data) as any,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaints'] });
      setResolvingComplaint(null);
    },
  });

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const title = (item.title || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        const studentName = `${item.student?.user?.firstName || ''} ${item.student?.user?.lastName || ''}`.toLowerCase();
        const usn = (item.student?.usn || '').toLowerCase();
        return (
          title.includes(query) ||
          desc.includes(query) ||
          category.includes(query) ||
          studentName.includes(query) ||
          usn.includes(query)
        );
      }
      return true;
    });
  }, [complaints, statusFilter, categoryFilter, priorityFilter, searchQuery]);

  // Counts
  const openCount = complaints.filter((c) => c.status === 'OPEN').length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  };

  const btnPrimary: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    borderRadius: '0.75rem',
    border: 'none',
    background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
  };

  if (isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader title="Complaints" description="" breadcrumbs={[{ label: 'Dashboard' }, { label: 'Complaints' }]} />
        <EmptyState
          icon={MessageSquareWarning}
          title="Profile Required"
          description={(error as any)?.response?.data?.message || 'Complete your student profile before filing complaints.'}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Complaints & Maintenance"
        description={`${complaints.length} complaint${complaints.length !== 1 ? 's' : ''} total · ${openCount} open · ${inProgressCount} in progress`}
        breadcrumbs={[{ label: 'Dashboard', href: user?.role === 'STUDENT' ? '/student/dashboard' : '/warden/dashboard' }, { label: 'Complaints' }]}
        actions={canAdd ? (
          <button onClick={() => setShowForm(true)} style={btnPrimary}>
            <Plus style={{ width: '1.125rem', height: '1.125rem' }} /> New Complaint
          </button>
        ) : undefined}
      />

      {/* ─── Interactive Stat Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { key: 'ALL' as const, label: 'All Issues', count: complaints.length, icon: MessageSquareWarning, color: '#6366f1', bg: isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff' },
          { key: 'OPEN' as const, label: 'Open Issues', count: openCount, icon: AlertCircle, color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff' },
          { key: 'IN_PROGRESS' as const, label: 'In Progress', count: inProgressCount, icon: Clock, color: '#f59e0b', bg: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb' },
          { key: 'RESOLVED' as const, label: 'Resolved', count: resolvedCount, icon: CheckCircle2, color: '#16a34a', bg: isDark ? 'rgba(22,163,74,0.1)' : '#f0fdf4' },
        ].map((s) => {
          const isActive = statusFilter === s.key;
          const Icon = s.icon;
          return (
            <motion.div
              key={s.key}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              onClick={() => setStatusFilter(s.key)}
              style={{
                padding: '1.125rem 1.25rem',
                borderRadius: '1rem',
                backgroundColor: 'var(--bg-card)',
                border: `1.5px solid ${isActive ? s.color : 'var(--border-primary)'}`,
                boxShadow: isActive ? `0 4px 14px ${s.color}22` : '0 1px 3px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
              }}
            >
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{s.label}</p>
                <p style={{ fontSize: '1.625rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</p>
              </div>
              <div style={{
                width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
                backgroundColor: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.color,
              }}>
                <Icon style={{ width: '1.375rem', height: '1.375rem' }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderRadius: '0.875rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flex: '1 1 240px',
          padding: '0.5rem 0.875rem',
          borderRadius: '0.625rem',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-primary)',
        }}>
          <Search style={{ width: '1rem', height: '1rem', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={canUpdate ? "Search by title, student, category..." : "Search complaint title or category..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
            >
              <X style={{ width: '0.875rem', height: '0.875rem' }} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '0.625rem',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '0.625rem',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          >
            <option value="ALL">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>{p.label} Priority</option>
            ))}
          </select>

          {/* Hostel Filter (Admin/Warden) */}
          {canFilterHostel && availableHostels.length > 0 && (
            <select
              value={selectedHostel}
              onChange={(e) => setSelectedHostel(e.target.value)}
              style={{
                padding: '0.5rem 0.875rem',
                borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            >
              <option value="ALL">All Hostels ({availableHostels.length})</option>
              {availableHostels.map((h: any) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}

          {(statusFilter !== 'ALL' || categoryFilter !== 'ALL' || priorityFilter !== 'ALL' || selectedHostel !== 'ALL' || searchQuery) && (
            <button
              onClick={() => { setStatusFilter('ALL'); setCategoryFilter('ALL'); setPriorityFilter('ALL'); setSelectedHostel('ALL'); setSearchQuery(''); }}
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

      {/* ─── Complaints List ─── */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ ...cardStyle, height: '5.5rem', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          icon={MessageSquareWarning}
          title={complaints.length === 0 ? "No Complaints Filed" : "No Matching Complaints"}
          description={
            complaints.length === 0
              ? canAdd
                ? "Facing any issues in your room or hostel? Report it using the button above."
                : "No student complaints have been logged in the system."
              : "Try adjusting your search query or filters to find what you're looking for."
          }
          action={
            complaints.length === 0 && canAdd
              ? { label: 'New Complaint', onClick: () => setShowForm(true) }
              : undefined
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filteredComplaints.map((complaint, i) => {
            const isExpanded = expandedId === complaint.id;
            const studentName = `${complaint.student?.user?.firstName || ''} ${complaint.student?.user?.lastName || ''}`.trim() || 'Unknown';
            const studentEmail = complaint.student?.user?.email;
            const usn = complaint.student?.usn;
            const activeRoom = complaint.student?.roomAllocations?.find((r: any) => r.status === 'ACTIVE')?.room;
            const roomNumber = activeRoom?.roomNumber;
            const hostelName = activeRoom?.floor?.block?.hostel?.name;

            const categoryMeta = CATEGORIES.find((c) => c.id === complaint.category) || CATEGORIES[5];
            const CatIcon = categoryMeta.icon;
            const priorityMeta = PRIORITIES.find((p) => p.id === complaint.priority) || PRIORITIES[1];
            const images: any[] = complaint.images || [];

            return (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  ...cardStyle,
                  borderColor: isExpanded ? 'rgba(59,130,246,0.4)' : 'var(--border-primary)',
                  boxShadow: isExpanded ? '0 8px 24px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {/* Header Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : complaint.id)}
                  style={{
                    width: '100%',
                    padding: '1.125rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {/* Category Squircle Icon */}
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '0.875rem',
                    flexShrink: 0,
                    backgroundColor: categoryMeta.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: categoryMeta.color,
                  }}>
                    <CatIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>

                  {/* Main Information */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {complaint.title}
                      </span>

                      {/* Category Chip */}
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: categoryMeta.bg,
                        color: categoryMeta.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}>
                        {categoryMeta.label}
                      </span>

                      {/* Priority Badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: priorityMeta.bg,
                        color: priorityMeta.color,
                      }}>
                        <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: priorityMeta.color }} />
                        {priorityMeta.label}
                      </span>

                      <StatusBadge status={complaint.status} />
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginTop: '0.375rem',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      flexWrap: 'wrap',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Calendar style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                        {formatDate(complaint.createdAt)}
                      </span>

                      {images.length > 0 && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: isDark ? '#93c5fd' : '#2563eb',
                          fontWeight: 600,
                        }}>
                          <Paperclip style={{ width: '0.75rem', height: '0.75rem' }} />
                          {images.length} attachment{images.length !== 1 ? 's' : ''}
                        </span>
                      )}

                      {canUpdate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          <User style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                          {studentName} {usn ? `(${usn})` : ''}
                        </span>
                      )}

                      {roomNumber && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                          <BedDouble style={{ width: '0.75rem', height: '0.75rem' }} />
                          Room {roomNumber}
                        </span>
                      )}

                      {/* Hostel info badge */}
                      {hostelName && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.375rem',
                          backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
                          color: isDark ? '#93c5fd' : '#1d4ed8',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}>
                          <Building2 style={{ width: '0.75rem', height: '0.75rem' }} />
                          {hostelName}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    color: 'var(--text-muted)',
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s',
                  }} />
                </button>

                {/* ─── Expanded Details Section ─── */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        padding: '0 1.25rem 1.25rem',
                        borderTop: '1px solid var(--border-primary)',
                        paddingTop: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                      }}>
                        {/* Student Profile Card (Warden/Admin View) */}
                        {canUpdate && complaint.student && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.875rem 1rem',
                            borderRadius: '0.75rem',
                            backgroundColor: isDark ? 'rgba(59,130,246,0.06)' : '#f8fafc',
                            border: '1px solid var(--border-primary)',
                            flexWrap: 'wrap',
                          }}>
                            <div style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #1e40af, #0d9488)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                            }}>
                              {(complaint.student?.user?.firstName?.[0] || '?')}{(complaint.student?.user?.lastName?.[0] || '')}
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{studentName}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{studentEmail || '—'}</p>
                            </div>
                            {usn && (
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
                                color: isDark ? '#93c5fd' : '#2563eb',
                              }}>
                                USN: {usn}
                              </span>
                            )}
                            {hostelName && roomNumber && (
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                color: 'var(--text-secondary)',
                              }}>
                                {hostelName} · Room {roomNumber}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Description Box */}
                        <div style={{
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          border: '1px solid var(--border-primary)',
                        }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.375rem' }}>
                            Issue Description
                          </span>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {complaint.description || 'No description provided.'}
                          </p>
                        </div>

                        {/* Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.875rem' }}>
                          <InfoBlock label="Category" value={categoryMeta.label} icon={CatIcon} />
                          <InfoBlock label="Priority" value={`${priorityMeta.label} Priority`} icon={AlertCircle} />
                          <InfoBlock label="Filed Date" value={`${formatDate(complaint.createdAt)} ${formatTime(complaint.createdAt)}`} icon={Calendar} />
                          {complaint.resolvedAt && (
                            <InfoBlock label="Resolved On" value={`${formatDate(complaint.resolvedAt)} ${formatTime(complaint.resolvedAt)}`} icon={CheckCircle2} />
                          )}
                        </div>

                        {/* ─── Media & Attachments Gallery ─── */}
                        {images.length > 0 && (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.625rem' }}>
                              <Paperclip style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Attachments & Proofs ({images.length})
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
                              {images.map((img: any, idx: number) => {
                                const rawUrl = typeof img === 'string' ? img : (img?.imageUrl || img?.url || img?.path || '');
                                if (!rawUrl) return null;
                                const isVid = isVideoUrl(rawUrl);
                                const fullUrl = getMediaUrl(rawUrl);
                                return (
                                  <motion.div
                                    key={img.id || idx}
                                    whileHover={{ scale: 1.03 }}
                                    onClick={() => setSelectedMedia({ url: fullUrl, isVideo: isVid })}
                                    style={{
                                      position: 'relative',
                                      height: '5.5rem',
                                      borderRadius: '0.625rem',
                                      overflow: 'hidden',
                                      backgroundColor: 'var(--bg-secondary)',
                                      border: '1px solid var(--border-primary)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    {isVid ? (
                                      <>
                                        <video src={fullUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{
                                          position: 'absolute', inset: 0,
                                          backgroundColor: 'rgba(0,0,0,0.35)',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          color: 'white',
                                        }}>
                                          <Play style={{ width: '1.25rem', height: '1.25rem', fill: 'white' }} />
                                        </div>
                                      </>
                                    ) : (
                                      <img
                                        src={fullUrl}
                                        alt={img.caption || 'Attachment'}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    )}
                                    <div style={{
                                      position: 'absolute', bottom: '0.25rem', right: '0.25rem',
                                      padding: '0.125rem 0.375rem', borderRadius: '0.25rem',
                                      backgroundColor: 'rgba(0,0,0,0.6)', color: 'white',
                                      fontSize: '0.625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem',
                                    }}>
                                      {isVid ? <Film style={{ width: '0.625rem', height: '0.625rem' }} /> : <ImageIcon style={{ width: '0.625rem', height: '0.625rem' }} />}
                                      <span>{isVid ? 'Video' : 'Photo'}</span>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* ─── Resolution Notes Banner ─── */}
                        {complaint.status === 'RESOLVED' && (
                          <div style={{
                            padding: '0.875rem 1rem',
                            borderRadius: '0.75rem',
                            background: isDark
                              ? 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(13,148,136,0.08))'
                              : 'linear-gradient(135deg, #f0fdf4, #f0fdfa)',
                            border: `1px solid ${isDark ? 'rgba(22,163,74,0.3)' : '#bbf7d0'}`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                          }}>
                            <CheckCircle2 style={{ width: '1.25rem', height: '1.25rem', color: '#16a34a', flexShrink: 0, marginTop: '0.125rem' }} />
                            <div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                                {complaint.resolution || complaint.resolutionNotes || 'Issue was verified and resolved by the hostel maintenance staff.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {complaint.status === 'IN_PROGRESS' && (
                          <div style={{
                            padding: '0.875rem 1rem',
                            borderRadius: '0.75rem',
                            backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb',
                            border: `1px solid ${isDark ? 'rgba(245,158,11,0.25)' : '#fde68a'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                          }}>
                            <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b', flexShrink: 0 }} />
                            <div>
                              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f59e0b' }}>Maintenance In Progress</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                                Assigned technician is attending to this complaint.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* ─── Warden / Admin Action Controls ─── */}
                        {canUpdate && complaint.status !== 'RESOLVED' && (
                          <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            justifyContent: 'flex-end',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid var(--border-primary)',
                          }}>
                            {complaint.status === 'OPEN' && (
                              <button
                                onClick={() => update.mutate({ id: complaint.id, data: { status: 'IN_PROGRESS' } })}
                                disabled={update.isPending}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  padding: '0.5rem 1.125rem',
                                  borderRadius: '0.625rem',
                                  border: '1px solid rgba(245,158,11,0.3)',
                                  backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7',
                                  color: isDark ? '#fbbf24' : '#b45309',
                                  fontSize: '0.8125rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                }}
                              >
                                <Clock style={{ width: '0.875rem', height: '0.875rem' }} /> Mark In Progress
                              </button>
                            )}

                            <button
                              onClick={() => setResolvingComplaint(complaint)}
                              disabled={update.isPending}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.5rem 1.25rem',
                                borderRadius: '0.625rem',
                                border: 'none',
                                background: 'linear-gradient(135deg, #16a34a, #0d9488)',
                                color: 'white',
                                fontSize: '0.8125rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
                              }}
                            >
                              <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem' }} /> Mark as Resolved
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Media Preview Lightbox Modal ─── */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedMedia(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 70,
              backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}
          >
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setSelectedMedia(null)}
                style={{
                  position: 'absolute', top: '-2.5rem', right: '0',
                  background: 'none', border: 'none', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 600,
                }}
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} /> Close
              </button>
              {selectedMedia.isVideo ? (
                <video src={selectedMedia.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '0.75rem' }} />
              ) : (
                <img src={selectedMedia.url} alt="Proof" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '0.75rem', objectFit: 'contain' }} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Resolve Modal (for Warden) ─── */}
      <AnimatePresence>
        {resolvingComplaint && (
          <ResolveModal
            complaint={resolvingComplaint}
            isPending={update.isPending}
            onClose={() => setResolvingComplaint(null)}
            onConfirm={(notes) => {
              update.mutate({
                id: resolvingComplaint.id,
                data: { status: 'RESOLVED', resolutionNotes: notes },
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── Create Complaint Modal (for Student) ─── */}
      <AnimatePresence>
        {showForm && <ComplaintFormModal onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </div>
  );
}

function InfoBlock({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div style={{
      padding: '0.625rem 0.75rem',
      borderRadius: '0.625rem',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
        <Icon style={{ width: '0.75rem', height: '0.75rem', color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</p>
    </div>
  );
}

function ResolveModal({
  complaint,
  isPending,
  onClose,
  onConfirm,
}: {
  complaint: any;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [notes, setNotes] = useState('');

  const PRESETS = [
    'Repaired and verified by electrician',
    'Plumbing issue fixed and tested',
    'Carpentry / furniture repaired',
    'Cleaning completed satisfactorily',
    'Network connectivity restored',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '28rem', borderRadius: '1rem',
          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)',
          boxShadow: '0 20px 25px rgba(0,0,0,0.25)', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)' }}>Resolve Complaint</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              Closing "{complaint?.title || 'Issue'}" · add completion remarks
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X style={{ width: '1.125rem', height: '1.125rem' }} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
              Quick Presets
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNotes(p)}
                  style={{
                    padding: '0.3125rem 0.625rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    border: '1px solid var(--border-primary)',
                    backgroundColor: notes === p ? (isDark ? 'rgba(22,163,74,0.2)' : '#dcfce7') : 'var(--bg-secondary)',
                    color: notes === p ? '#16a34a' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem', display: 'block' }}>
              Resolution Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what action was taken to resolve this problem..."
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', resize: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '0.625rem', borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)', backgroundColor: 'transparent',
                color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(notes || 'Issue resolved by hostel maintenance staff')}
              disabled={isPending}
              style={{
                flex: 1, padding: '0.625rem', borderRadius: '0.625rem',
                border: 'none', background: 'linear-gradient(135deg, #16a34a, #0d9488)',
                color: 'white', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ComplaintFormModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ELECTRICAL');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Array<{ url: string; isVideo: boolean; name: string }>>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length + files.length > 5) {
      setError('You can upload a maximum of 5 attachments.');
      return;
    }
    const newFiles = [...files, ...selected];
    setFiles(newFiles);

    const newPreviews = selected.map((f) => ({
      url: URL.createObjectURL(f),
      isVideo: f.type.startsWith('video/'),
      name: f.name,
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]?.url);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: (formData: FormData) => operationsApi.createComplaint(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['complaints'] });
      onClose();
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to submit complaint.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide both a title and issue description.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('category', category);
    formData.append('priority', priority);
    formData.append('description', description.trim());
    files.forEach((file) => formData.append('attachments', file));

    mutation.mutate(formData);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-primary)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(5px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '34rem',
          borderRadius: '1.25rem',
          border: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-card)',
          boxShadow: '0 25px 35px rgba(0,0,0,0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-primary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #1e40af, #0d9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            }}>
              <MessageSquareWarning style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>Report an Issue</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>File a maintenance request for your room or block</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2',
              color: isDark ? '#fca5a5' : '#dc2626',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.375rem' }}>
              Issue Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Washroom tap leaking, Fan regulator not working..."
              style={inputStyle}
              required
            />
          </div>

          {/* Category Selector Grid */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
              Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {CATEGORIES.map((c) => {
                const isSelected = category === c.id;
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    style={{
                      padding: '0.625rem 0.5rem',
                      borderRadius: '0.625rem',
                      border: `1.5px solid ${isSelected ? c.color : 'var(--border-primary)'}`,
                      backgroundColor: isSelected ? (isDark ? `${c.color}22` : c.bg) : 'var(--bg-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.375rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon style={{ width: '1.125rem', height: '1.125rem', color: isSelected ? c.color : 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? c.color : 'var(--text-primary)' }}>
                      {c.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Selector */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
              Priority Level
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: `1.5px solid ${isSelected ? p.color : 'var(--border-primary)'}`,
                      backgroundColor: isSelected ? (isDark ? `${p.color}22` : p.bg) : 'var(--bg-secondary)',
                      color: isSelected ? p.color : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: p.color }} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.375rem' }}>
              Detailed Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe where the issue is and what problem you are facing..."
              style={{ ...inputStyle, resize: 'none' }}
              required
            />
          </div>

          {/* Attachments Dropzone & Previews */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.375rem' }}>
              Upload Photos / Videos (Optional, Max 5)
            </label>

            {/* Dropzone */}
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: '1.5px dashed var(--border-primary)',
              backgroundColor: 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}>
              <Paperclip style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Click to browse images or videos
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                PNG, JPG, MP4 up to 5MB each
              </span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>

            {/* Previews Grid */}
            {previews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
                {previews.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      height: '4.5rem',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      border: '1px solid var(--border-primary)',
                      backgroundColor: 'black',
                    }}
                  >
                    {p.isVideo ? (
                      <video src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={p.url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      style={{
                        position: 'absolute', top: '0.125rem', right: '0.125rem',
                        width: '1.25rem', height: '1.25rem', borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.75)', color: 'white',
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <X style={{ width: '0.75rem', height: '0.75rem' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.75rem',
                border: '1px solid var(--border-primary)', backgroundColor: 'transparent',
                color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              style={{
                flex: 1.5, padding: '0.75rem', borderRadius: '0.75rem', border: 'none',
                background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
                color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                opacity: mutation.isPending ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
              }}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                  Filing Complaint...
                </>
              ) : (
                'Submit Complaint'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
