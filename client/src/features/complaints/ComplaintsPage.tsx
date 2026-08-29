import { useState } from 'react';
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
  User, Tag, Flag, ChevronRight, ArrowRight,
  Wrench, Zap, Droplets, Wifi, Trash2, HelpCircle,
  Paperclip, Film, ExternalLink,
} from 'lucide-react';

const isVideoUrl = (url: string) =>
  url.startsWith('data:video/') || /\.(mp4|webm|mov|m4v)$/i.test(url);

const categoryIcons: Record<string, any> = {
  ELECTRICAL: Zap, PLUMBING: Droplets, FURNITURE: Wrench,
  CLEANING: Trash2, NETWORK: Wifi, OTHER: HelpCircle,
};

const priorityColors: Record<string, { color: string; bg: string; bgDark: string }> = {
  LOW: { color: '#16a34a', bg: '#dcfce7', bgDark: 'rgba(22,163,74,0.15)' },
  MEDIUM: { color: '#f59e0b', bg: '#fef3c7', bgDark: 'rgba(245,158,11,0.15)' },
  HIGH: { color: '#ea580c', bg: '#ffedd5', bgDark: 'rgba(234,88,12,0.15)' },
  URGENT: { color: '#dc2626', bg: '#fee2e2', bgDark: 'rgba(220,38,38,0.15)' },
};

const statusFlow: Record<string, string> = { OPEN: 'IN_PROGRESS', IN_PROGRESS: 'RESOLVED' };

export function ComplaintsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; isVideo: boolean } | null>(null);

  const { data, isError, error } = useQuery<any>({
    queryKey: ['complaints'],
    queryFn: operationsApi.complaints,
    retry: 1,
  });
  const complaints: any[] = (data?.data as any)?.data || [];

  const canAdd = user?.role === 'STUDENT';
  const canUpdate = user?.role === 'WARDEN' || user?.role === 'ADMIN';

  const update = useMutation<any, Error, { id: string; data: any }>({
    mutationFn: ({ id, data }) => operationsApi.updateComplaint(id, data) as any,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  };

  const btnPrimary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
    borderRadius: '0.75rem', border: 'none',
    background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
    color: 'white', fontSize: '0.875rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  };

  if (isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader title="Complaints" description="" breadcrumbs={[{ label: 'Dashboard' }, { label: 'Complaints' }]} />
        <EmptyState icon={MessageSquareWarning} title="Profile required" description={(error as any)?.response?.data?.message || 'Complete your student profile before filing complaints.'} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Complaints"
        description={`${complaints.length} complaint${complaints.length !== 1 ? 's' : ''} filed`}
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Complaints' }]}
        actions={canAdd ? (
          <button onClick={() => setShowForm(true)} style={btnPrimary}>
            <Plus style={{ width: '1rem', height: '1rem' }} /> New Complaint
          </button>
        ) : undefined}
      />

      {/* Summary Stats */}
      {complaints.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Open', count: complaints.filter((c) => c.status === 'OPEN').length, color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff' },
            { label: 'In Progress', count: complaints.filter((c) => c.status === 'IN_PROGRESS').length, color: '#f59e0b', bg: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb' },
            { label: 'Resolved', count: complaints.filter((c) => c.status === 'RESOLVED').length, color: '#16a34a', bg: isDark ? 'rgba(22,163,74,0.1)' : '#f0fdf4' },
          ].map((s) => (
            <div key={s.label} style={{
              padding: '1rem 1.25rem', borderRadius: '0.875rem', backgroundColor: s.bg,
              border: `1px solid ${isDark ? `${s.color}33` : `${s.color}22`}`,
            }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.count}</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, opacity: 0.8, marginTop: '0.125rem' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Complaint Cards */}
      {complaints.length === 0 ? (
        <EmptyState
          icon={MessageSquareWarning}
          title="No complaints filed"
          description={canAdd ? 'Report an issue by clicking the button above.' : 'No complaints have been filed yet.'}
          action={canAdd ? { label: 'New Complaint', onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {complaints.map((complaint, i) => {
            const isExpanded = expandedId === complaint.id;
            const studentName = `${complaint.student?.user?.firstName || ''} ${complaint.student?.user?.lastName || ''}`.trim() || 'Unknown';
            const CatIcon = categoryIcons[complaint.category] || HelpCircle;
            const prio = priorityColors[complaint.priority] || priorityColors.MEDIUM;
            const nextStatus = statusFlow[complaint.status];

            return (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={cardStyle}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : complaint.id)}
                  style={{ width: '100%', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {/* Category Icon */}
                  <div style={{
                    width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', flexShrink: 0,
                    backgroundColor: isDark ? prio.bgDark : prio.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CatIcon style={{ width: '1.25rem', height: '1.25rem', color: prio.color }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {complaint.title || 'Untitled'}
                      </span>
                      <StatusBadge status={complaint.status} />
                      <span style={{
                        padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.625rem', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        backgroundColor: isDark ? prio.bgDark : prio.bg, color: prio.color,
                      }}>{complaint.priority}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      {canUpdate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <User style={{ width: '0.75rem', height: '0.75rem' }} />{studentName}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Tag style={{ width: '0.75rem', height: '0.75rem' }} />{complaint.category?.replace('_', ' ')}
                      </span>
                      {complaint.images && complaint.images.length > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#3b82f6', fontWeight: 600 }}>
                          <Paperclip style={{ width: '0.75rem', height: '0.75rem' }} />
                          {complaint.images.length} attachment{complaint.images.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight style={{
                    width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)',
                    transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s',
                  }} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--border-primary)', paddingTop: '1.25rem' }}>
                        {/* Description */}
                        {complaint.description && (
                          <div style={{
                            padding: '1rem', borderRadius: '0.75rem', marginBottom: '1rem',
                            backgroundColor: isDark ? 'rgba(59,130,246,0.05)' : '#f8fafc',
                            border: '1px solid var(--border-primary)',
                          }}>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{complaint.description}</p>
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                          <InfoBlock label="Category" value={complaint.category?.replace('_', ' ') || '—'} icon={Tag} />
                          <InfoBlock label="Priority" value={complaint.priority || '—'} icon={Flag} />
                          <InfoBlock label="Status" value={complaint.status?.replace('_', ' ') || '—'} icon={MessageSquareWarning} />
                          {complaint.resolution && <InfoBlock label="Resolution" value={complaint.resolution} icon={Wrench} />}
                        </div>

                        {/* Attachments Section */}
                        {complaint.images && complaint.images.length > 0 && (
                          <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.625rem' }}>
                              <Paperclip style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Attachments / Proofs ({complaint.images.length})
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                              {complaint.images.map((img: any, imgIdx: number) => {
                                const url = getMediaUrl(img.imageUrl);
                                const isVideo = isVideoUrl(img.imageUrl);
                                return (
                                  <div
                                    key={img.id || imgIdx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMedia({ url, isVideo });
                                    }}
                                    style={{
                                      position: 'relative',
                                      width: '5.5rem',
                                      height: '5.5rem',
                                      borderRadius: '0.75rem',
                                      overflow: 'hidden',
                                      border: '1px solid var(--border-primary)',
                                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    title="Click to view"
                                  >
                                    {isVideo ? (
                                      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                        <Film style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
                                        <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Video</span>
                                      </div>
                                    ) : (
                                      <img src={url} alt="Attachment proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Warden/Admin action */}
                        {canUpdate && nextStatus && (
                          <button
                            onClick={() => update.mutate({ id: complaint.id, data: { status: nextStatus } })}
                            disabled={update.isPending}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
                              borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                              backgroundColor: nextStatus === 'RESOLVED'
                                ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
                                : (isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe'),
                              color: nextStatus === 'RESOLVED'
                                ? (isDark ? '#4ade80' : '#15803d')
                                : (isDark ? '#60a5fa' : '#1d4ed8'),
                              fontSize: '0.8125rem', fontWeight: 700,
                            }}
                          >
                            <ArrowRight style={{ width: '0.875rem', height: '0.875rem' }} />
                            Move to {nextStatus.replace('_', ' ')}
                          </button>
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

      <AnimatePresence>
        {showForm && <ComplaintFormModal onClose={() => setShowForm(false)} />}
      </AnimatePresence>

      {/* Media Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMedia(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 90,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              backgroundColor: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <button
                onClick={() => setSelectedMedia(null)}
                style={{
                  position: 'absolute',
                  top: '-2.5rem',
                  right: 0,
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                <X style={{ width: '1.5rem', height: '1.5rem' }} />
              </button>

              {selectedMedia.isVideo ? (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  style={{ maxWidth: '85vw', maxHeight: '80vh', borderRadius: '0.75rem' }}
                />
              ) : (
                <img
                  src={selectedMedia.url}
                  alt="Attachment preview"
                  style={{ maxWidth: '85vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '0.75rem' }}
                />
              )}

              <a
                href={selectedMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  color: 'white',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  opacity: 0.85,
                }}
              >
                <ExternalLink style={{ width: '0.875rem', height: '0.875rem' }} /> Open original in new tab
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoBlock({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
        <Icon style={{ width: '0.75rem', height: '0.75rem', color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

function ComplaintFormModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => operationsApi.createComplaint(formData),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['complaints'] }); onClose(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to file complaint.'),
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (files.length + selected.length > 5) {
      setError('Maximum 5 attachments allowed.');
      return;
    }
    setFiles((prev) => [...prev, ...selected]);
    // Generate previews
    selected.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setPreviews((prev) => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      } else {
        setPreviews((prev) => [...prev, '']); // placeholder for non-image
      }
    });
    e.target.value = ''; // reset so same file can be selected again
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = new FormData(e.currentTarget);
    const formData = new FormData();
    formData.append('title', raw.get('title') as string);
    formData.append('category', raw.get('category') as string);
    formData.append('priority', raw.get('priority') as string);
    formData.append('description', raw.get('description') as string);
    files.forEach((file) => formData.append('attachments', file));
    mutation.mutate(formData);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
    border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.375rem',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'var(--overlay)' }}
    >
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '28rem', borderRadius: '1rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)', boxShadow: '0 20px 25px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>File a Complaint</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Report an issue in your hostel</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <X style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit}
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2', color: isDark ? '#fca5a5' : '#dc2626', fontSize: '0.875rem' }}>
              <AlertCircle style={{ width: '1rem', height: '1rem' }} />{error}
            </div>
          )}
          <div><label style={labelStyle}>Title</label><input type="text" name="title" placeholder="Brief summary of the issue" style={inputStyle} required /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select name="category" style={inputStyle} required>
                <option value="ELECTRICAL">Electrical</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="FURNITURE">Furniture</option>
                <option value="CLEANING">Cleaning</option>
                <option value="NETWORK">Network</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select name="priority" style={inputStyle} required>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div><label style={labelStyle}>Description</label><textarea name="description" rows={4} placeholder="Describe the issue in detail..." style={{ ...inputStyle, resize: 'none' }} required /></div>

          {/* File Upload */}
          <div>
            <label style={labelStyle}>Attachments <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(photos/videos, max 5)</span></label>
            <label
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '1rem', borderRadius: '0.75rem',
                border: `2px dashed ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                cursor: 'pointer', transition: 'border-color 0.15s',
                fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'inherit',
              }}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              <span>Click to add photos or videos</span>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFiles}
                style={{ display: 'none' }}
              />
            </label>

            {/* File Previews */}
            {files.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {files.map((file, i) => (
                  <div key={i} style={{
                    position: 'relative', width: '4.5rem', height: '4.5rem',
                    borderRadius: '0.5rem', overflow: 'hidden',
                    border: '1px solid var(--border-primary)',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  }}>
                    {previews[i] ? (
                      <img src={previews[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-muted)',
                        textAlign: 'center', padding: '0.25rem',
                      }}>
                        {file.type.startsWith('video/') ? '🎬 Video' : '📎 File'}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      style={{
                        position: 'absolute', top: '0.125rem', right: '0.125rem',
                        width: '1.25rem', height: '1.25rem', borderRadius: '50%',
                        backgroundColor: 'rgba(220,38,38,0.9)', border: 'none',
                        color: 'white', fontSize: '0.625rem', fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-primary)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" disabled={mutation.isPending} style={{
              flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
              color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
              opacity: mutation.isPending ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: 'inherit',
            }}>
              {mutation.isPending ? <><Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />Filing...</> : 'File Complaint'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
