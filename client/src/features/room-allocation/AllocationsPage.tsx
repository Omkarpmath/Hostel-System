import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { operationsApi } from '@/api/operations.api';
import { userApi } from '@/api/user.api';
import { hostelApi } from '@/api/hostel.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  UserCheck, Plus, X, Loader2, AlertCircle, Building2, BedDouble,
  User, ChevronRight, ArrowRight, Hash,
} from 'lucide-react';

const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function AllocationsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data } = useQuery<any>({
    queryKey: ['allocations'],
    queryFn: operationsApi.allocations,
    retry: 1,
  });
  const allocations: any[] = (data?.data as any)?.data || [];

  const canAdd = user?.role === 'ADMIN' || user?.role === 'WARDEN';
  const active = allocations.filter((a) => a.status === 'ACTIVE').length;
  const total = allocations.length;

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Room Allocations"
        description={`${total} allocation${total !== 1 ? 's' : ''} · ${active} active`}
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Allocations' }]}
        actions={canAdd ? (
          <button onClick={() => setShowForm(true)} style={btnPrimary}>
            <Plus style={{ width: '1rem', height: '1rem' }} /> Allocate Room
          </button>
        ) : undefined}
      />

      {/* Summary */}
      {total > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Total Allocations', count: total, color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', icon: UserCheck },
            { label: 'Active', count: active, color: '#16a34a', bg: isDark ? 'rgba(22,163,74,0.1)' : '#f0fdf4', icon: BedDouble },
            { label: 'Ended / Cancelled', count: total - active, color: '#6b7280', bg: isDark ? 'rgba(107,114,128,0.1)' : '#f9fafb', icon: User },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
              padding: '1.25rem', borderRadius: '0.875rem', backgroundColor: s.bg,
              border: `1px solid ${isDark ? `${s.color}33` : `${s.color}22`}`,
              display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <s.icon style={{ width: '1.5rem', height: '1.5rem', color: s.color, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '1.375rem', fontWeight: 800, color: s.color }}>{s.count}</p>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: s.color, opacity: 0.8 }}>{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Allocation Cards */}
      {allocations.length === 0 ? (
        <EmptyState icon={UserCheck} title="No allocations yet" description="Allocate students to rooms to see them here."
          action={canAdd ? { label: 'Allocate Room', onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {allocations.map((alloc, i) => {
            const isExpanded = expandedId === alloc.id;
            const fName = alloc.student?.user?.firstName || '';
            const lName = alloc.student?.user?.lastName || '';
            const initials = `${fName[0] || '?'}${lName[0] || ''}`;
            const roomNum = alloc.room?.roomNumber || '—';
            const hostel = alloc.room?.floor?.block?.hostel?.name || 'Unknown';
            const block = alloc.room?.floor?.block?.name || '';
            const floor = alloc.room?.floor?.name || '';
            const isActive = alloc.status === 'ACTIVE';

            return (
              <motion.div key={alloc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={cardStyle}>
                <button onClick={() => setExpandedId(isExpanded ? null : alloc.id)}
                  style={{ width: '100%', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '3rem', height: '3rem', borderRadius: '50%', flexShrink: 0,
                    background: isActive ? 'linear-gradient(135deg, #1e40af, #0d9488)' : (isDark ? 'rgba(107,114,128,0.2)' : '#f3f4f6'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isActive ? 'white' : 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 800,
                  }}>
                    {initials}
                  </div>

                  {/* Main Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {fName} {lName}
                      </span>
                      <ArrowRight style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                      <span style={{
                        fontSize: '0.9375rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)',
                        padding: '0.125rem 0.5rem', borderRadius: '0.375rem',
                        backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                      }}>
                        {roomNum}
                      </span>
                      <StatusBadge status={alloc.status} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Building2 style={{ width: '0.75rem', height: '0.75rem' }} />{hostel}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Hash style={{ width: '0.75rem', height: '0.75rem' }} />Bed {alloc.bedNumber || '—'}
                      </span>
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
                        {/* Student → Room visual */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem',
                          borderRadius: '0.75rem', marginBottom: '1.25rem',
                          backgroundColor: isDark ? 'rgba(59,130,246,0.05)' : '#f8fafc',
                          border: '1px solid var(--border-primary)',
                        }}>
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{
                              width: '3rem', height: '3rem', borderRadius: '50%', margin: '0 auto 0.5rem',
                              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: '0.75rem', fontWeight: 800,
                            }}><User style={{ width: '1.25rem', height: '1.25rem' }} /></div>
                            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{fName} {lName}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{alloc.student?.usn || alloc.student?.user?.email || '—'}</p>
                          </div>
                          <ArrowRight style={{ width: '1.5rem', height: '1.5rem', color: 'var(--text-muted)', flexShrink: 0 }} />
                          <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{
                              width: '3rem', height: '3rem', borderRadius: '50%', margin: '0 auto 0.5rem',
                              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: '0.75rem', fontWeight: 800,
                            }}><BedDouble style={{ width: '1.25rem', height: '1.25rem' }} /></div>
                            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Room {roomNum}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{block} · {floor}</p>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                          <InfoBlock label="Hostel" value={hostel} icon={Building2} />
                          <InfoBlock label="Room" value={roomNum} icon={BedDouble} />
                          <InfoBlock label="Bed Number" value={String(alloc.bedNumber || '—')} icon={Hash} />
                          <InfoBlock label="Status" value={alloc.status} icon={UserCheck} />
                          <InfoBlock label="Allocated On" value={formatDate(alloc.createdAt)} icon={UserCheck} />
                        </div>
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
        {showForm && <AllocateModal onClose={() => setShowForm(false)} />}
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

function AllocateModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [studentId, setStudentId] = useState('');
  const [roomId, setRoomId] = useState('');

  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => userApi.getStudents({ limit: '1000' }),
  });
  const students: any[] = (() => {
    const d = (studentsData?.data as any)?.data;
    if (Array.isArray(d)) return d;
    if (d?.students && Array.isArray(d.students)) return d.students;
    return [];
  })();

  const { data: roomsData } = useQuery({
    queryKey: ['available-rooms'],
    queryFn: () => hostelApi.getAvailableRooms(),
  });
  const rooms: any[] = (roomsData?.data as any)?.data || [];

  const mutation = useMutation({
    mutationFn: () => operationsApi.allocate({ studentId, roomId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['allocations'] }); qc.invalidateQueries({ queryKey: ['available-rooms'] }); onClose(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to allocate room.'),
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
    border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.375rem' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'var(--overlay)' }}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '28rem', borderRadius: '1rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)', boxShadow: '0 20px 25px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Allocate Room</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Assign a student to an available room</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <X style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)' }} />
          </button>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2', color: isDark ? '#fca5a5' : '#dc2626', fontSize: '0.875rem' }}><AlertCircle style={{ width: '1rem', height: '1rem' }} />{error}</div>}

          <div>
            <label style={labelStyle}>Select Student</label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={inputStyle}>
              <option value="">Choose a student...</option>
              {students.filter((s) => s.usn && !(s.roomAllocations?.some((a: any) => a.status === 'ACTIVE'))).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.usn} — {s.user?.firstName} {s.user?.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Select Room</label>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} style={inputStyle}>
              <option value="">Choose an available room...</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.floor?.block?.hostel?.name} — Room {r.roomNumber} ({r.capacity - r.occupiedBeds} available)
                </option>
              ))}
            </select>
          </div>

          {/* Visual preview */}
          {studentId && roomId && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
              padding: '1rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(22,163,74,0.05)' : '#f0fdf4',
              border: `1px solid ${isDark ? 'rgba(22,163,74,0.2)' : '#bbf7d0'}`,
            }}>
              <div style={{ textAlign: 'center' }}>
                <User style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6', margin: '0 auto' }} />
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {students.find((s) => s.id === studentId)?.user?.firstName || '—'}
                </p>
              </div>
              <ArrowRight style={{ width: '1rem', height: '1rem', color: 'var(--text-muted)' }} />
              <div style={{ textAlign: 'center' }}>
                <BedDouble style={{ width: '1.25rem', height: '1.25rem', color: '#0d9488', margin: '0 auto' }} />
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  Room {rooms.find((r) => r.id === roomId)?.roomNumber || '—'}
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-primary)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !studentId || !roomId} style={{
              flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
              color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
              opacity: (mutation.isPending || !studentId || !roomId) ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: 'inherit',
            }}>
              {mutation.isPending ? <><Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />Allocating...</> : 'Allocate'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
