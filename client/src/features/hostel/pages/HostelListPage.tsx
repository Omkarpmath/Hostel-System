import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { hostelApi } from '@/api/hostel.api';
import { userApi } from '@/api/user.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useTheme } from '@/providers/ThemeProvider';
import {
  Building2, Plus, X, Loader2, MapPin, Users, BedDouble,
  ChevronDown, ChevronRight, AlertCircle,
} from 'lucide-react';
import type { Hostel } from '@/types';

export function HostelListPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showCreate, setShowCreate] = useState(false);
  const [expandedHostel, setExpandedHostel] = useState<string | null>(null);
  const [structureTarget, setStructureTarget] = useState<{ type: 'block' | 'floor' | 'room'; id: string; label: string } | null>(null);

  const { data } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => hostelApi.getAll(),
    retry: 1,
  });

  const hostels: Hostel[] = (data?.data as any)?.data || [];

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Hostel Management"
        description="Create and manage hostels, blocks, floors, and rooms"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Hostels' }]}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
              borderRadius: '0.75rem', border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
              color: 'white', fontSize: '0.875rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus style={{ width: '1rem', height: '1rem' }} />
            Create Hostel
          </button>
        }
      />

      {hostels.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No hostels created"
          description="Get started by creating your first hostel. You can add blocks, floors, and rooms to it."
          action={{ label: 'Create Hostel', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {hostels.map((hostel) => {
            const isExpanded = expandedHostel === hostel.id;
            const totalRooms = hostel.blocks?.reduce((acc, b) =>
              acc + (b.floors?.reduce((a, f) => a + (f.rooms?.length || 0), 0) || 0), 0) || 0;
            const totalBeds = hostel.blocks?.reduce((acc, b) =>
              acc + (b.floors?.reduce((a, f) =>
                a + (f.rooms?.reduce((r, rm) => r + rm.capacity, 0) || 0), 0) || 0), 0) || 0;

            return (
              <motion.div key={hostel.id} layout style={cardStyle}>
                <button
                  onClick={() => setExpandedHostel(isExpanded ? null : hostel.id)}
                  style={{
                    width: '100%', padding: '1.5rem', display: 'flex', alignItems: 'center',
                    gap: '1rem', textAlign: 'left', background: 'none', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <div style={{
                    padding: '0.75rem', borderRadius: '0.75rem',
                    backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                  }}>
                    <Building2 style={{ width: '1.5rem', height: '1.5rem', color: isDark ? '#60a5fa' : '#2563eb' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>{hostel.name}</h3>
                      <StatusBadge status={hostel.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      <span style={{
                        padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 700,
                        backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe',
                        color: isDark ? '#93c5fd' : '#1d4ed8',
                      }}>{hostel.type}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      {hostel.address && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin style={{ width: '0.875rem', height: '0.875rem' }} />{hostel.address}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <BedDouble style={{ width: '0.875rem', height: '0.875rem' }} />{totalRooms} rooms
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users style={{ width: '0.875rem', height: '0.875rem' }} />{totalBeds} beds
                      </span>
                      {hostel.allowedYears?.length > 0 && (
                        <span style={{
                          fontSize: '0.6875rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontWeight: 600,
                          backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : '#ccfbf1',
                          color: isDark ? '#2dd4bf' : '#0f766e',
                        }}>Year {hostel.allowedYears.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronDown style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)' }} />
                    : <ChevronRight style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)' }} />
                  }
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ borderTop: '1px solid var(--border-primary)', overflow: 'hidden' }}
                    >
                      <div style={{ padding: '1.5rem' }}>
                        <button onClick={() => setStructureTarget({ type: 'block', id: hostel.id, label: hostel.name })} className="mb-4 rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>+ Add block</button>
                        {hostel.blocks && hostel.blocks.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {hostel.blocks.map((block) => (
                              <div key={block.id} style={{ borderRadius: '0.75rem', border: '1px solid var(--border-primary)', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}><h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{block.name}</h4><button onClick={() => setStructureTarget({ type: 'floor', id: block.id, label: block.name })} className="text-sm font-semibold text-primary-600">+ Add floor</button></div>
                                {block.floors?.map((floor) => (
                                  <div key={floor.id} style={{ marginLeft: '1rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}><p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{floor.name} (Floor {floor.floorNumber})</p><button onClick={() => setStructureTarget({ type: 'room', id: floor.id, label: floor.name })} className="text-sm font-semibold text-primary-600">+ Add room</button></div>
                                    {floor.rooms && floor.rooms.length > 0 ? (
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginLeft: '1rem' }}>
                                        {floor.rooms.map((room) => (
                                          <div key={room.id} style={{
                                            padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)',
                                            backgroundColor: 'var(--bg-tertiary)', textAlign: 'center',
                                          }}>
                                            <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{room.roomNumber}</p>
                                            <p style={{ fontSize: '0.6875rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>{room.occupiedBeds}/{room.capacity} beds</p>
                                            <div style={{ marginTop: '0.375rem' }}><StatusBadge status={room.status} /></div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : <p style={{ fontSize: '0.75rem', marginLeft: '1rem', color: 'var(--text-muted)' }}>No rooms yet</p>}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No blocks created yet. Add blocks, then floors, then rooms.</p>}
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
        {showCreate && <CreateHostelModal onClose={() => setShowCreate(false)} />}
        {structureTarget && <StructureModal target={structureTarget} onClose={() => setStructureTarget(null)} />}
      </AnimatePresence>
    </div>
  );
}

function StructureModal({ target, onClose }: { target: { type: 'block' | 'floor' | 'room'; id: string; label: string }; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const mutation = useMutation<any, Error, FormData>({
    mutationFn: (form: FormData) => {
      if (target.type === 'block') return hostelApi.createBlock(target.id, { name: String(form.get('name')).trim() });
      if (target.type === 'floor') return hostelApi.createFloor(target.id, { name: String(form.get('name')).trim(), floorNumber: Number(form.get('floorNumber')) });
      return hostelApi.createRoom(target.id, { roomNumber: String(form.get('roomNumber')).trim(), capacity: Number(form.get('capacity')), type: String(form.get('type')) as any, feePerSemester: Number(form.get('feePerSemester')) });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hostels'] }); onClose(); },
    onError: (err: any) => setError(err.response?.data?.message || 'Unable to save this record.'),
  });
  const heading = target.type === 'block' ? 'Add block' : target.type === 'floor' ? 'Add floor' : 'Add room';
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" onClick={onClose}>
    <form onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); mutation.mutate(new FormData(event.currentTarget)); }} className="glass-card w-full max-w-md space-y-4 p-6">
      <div><h2 className="text-lg font-bold">{heading}</h2><p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Adding to {target.label}</p></div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {target.type === 'block' && <label className="block text-sm font-semibold">Block name<input required name="name" className="mt-1 w-full rounded-lg border p-3 font-normal" /></label>}
      {target.type === 'floor' && <><label className="block text-sm font-semibold">Floor name<input required name="name" className="mt-1 w-full rounded-lg border p-3 font-normal" /></label><label className="block text-sm font-semibold">Floor number<input required name="floorNumber" type="number" min="0" className="mt-1 w-full rounded-lg border p-3 font-normal" /></label></>}
      {target.type === 'room' && <><label className="block text-sm font-semibold">Room number<input required name="roomNumber" className="mt-1 w-full rounded-lg border p-3 font-normal" /></label><label className="block text-sm font-semibold">Capacity<input required name="capacity" type="number" min="1" className="mt-1 w-full rounded-lg border p-3 font-normal" /></label><label className="block text-sm font-semibold">Room type<select name="type" className="mt-1 w-full rounded-lg border p-3 font-normal"><option>DOUBLE</option><option>SINGLE</option><option>TRIPLE</option><option>DORMITORY</option></select></label><label className="block text-sm font-semibold">Fee per semester<input required name="feePerSemester" type="number" min="0" step="0.01" defaultValue="0" className="mt-1 w-full rounded-lg border p-3 font-normal" /></label></>}
      <div className="flex justify-end gap-3"><button type="button" onClick={onClose}>Cancel</button><button disabled={mutation.isPending} className="rounded-xl px-4 py-2 text-white gradient-bg">{mutation.isPending ? 'Saving…' : 'Save'}</button></div>
    </form>
  </motion.div>;
}

/* ====================================================================== */
/*  Create Hostel Modal                                                    */
/* ====================================================================== */

function CreateHostelModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    type: 'BOYS' as 'BOYS' | 'GIRLS',
    address: '',
    description: '',
    wardenId: '',
    allowedYears: [] as number[],
  });
  const [error, setError] = useState('');

  // Fetch wardens for the dropdown
  const { data: wardensData } = useQuery({
    queryKey: ['wardens'],
    queryFn: () => userApi.getWardens(),
    retry: 1,
  });
  const wardens: any[] = (wardensData?.data as any)?.data || [];

  const mutation = useMutation({
    mutationFn: () => {
      // Build a clean payload — only include wardenId if it's a real value (not empty string)
      const payload: Record<string, unknown> = {
        name: form.name,
        type: form.type,
        allowedYears: form.allowedYears,
      };
      if (form.address.trim()) payload.address = form.address.trim();
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.wardenId) payload.wardenId = form.wardenId; // only include if selected
      return hostelApi.create(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to create hostel');
    },
  });

  const toggleYear = (year: number) => setForm((prev) => ({
    ...prev,
    allowedYears: prev.allowedYears.includes(year)
      ? prev.allowedYears.filter((y) => y !== year)
      : [...prev.allowedYears, year],
  }));

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
    border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)',
    display: 'block', marginBottom: '0.375rem',
  };

  const canSubmit = form.name.trim() && form.allowedYears.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'var(--overlay)' }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '32rem', borderRadius: '1rem',
          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)',
          boxShadow: '0 20px 25px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Create Hostel</h2>
            <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>Add a new hostel to the system</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <X style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) mutation.mutate(); }} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem',
              borderRadius: '0.75rem', fontSize: '0.875rem',
              backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2',
              color: isDark ? '#fca5a5' : '#dc2626',
            }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Hostel Name */}
          <div>
            <label style={labelStyle}>Hostel Name *</label>
            <input
              type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Vishveshwaraya Boys Hostel"
              style={inputStyle} required
            />
          </div>

          {/* Type + Warden row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} style={inputStyle}>
                <option value="BOYS">Boys</option>
                <option value="GIRLS">Girls</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Warden</label>
              <select value={form.wardenId} onChange={(e) => setForm({ ...form, wardenId: e.target.value })} style={inputStyle}>
                <option value="">Select warden (optional)</option>
                {wardens.map((w) => (
                  <option key={w.id} value={w.id}>
                    {(w.firstName || w.lastName) ? `${w.firstName || ''} ${w.lastName || ''}`.trim() : w.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Allowed Years */}
          <div>
            <label style={labelStyle}>Allowed Years *</label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Select which year students can be allotted
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4].map((year) => {
                const isSelected = form.allowedYears.includes(year);
                return (
                  <button key={year} type="button" onClick={() => toggleYear(year)} style={{
                    padding: '0.5rem 1rem', borderRadius: '0.5rem',
                    border: isSelected ? '2px solid #3b82f6' : '2px solid var(--border-primary)',
                    backgroundColor: isSelected ? (isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff') : 'transparent',
                    color: isSelected ? (isDark ? '#93c5fd' : '#1d4ed8') : 'var(--text-secondary)',
                    fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year
                  </button>
                );
              })}
            </div>
          </div>

          {/* Address */}
          <div>
            <label style={labelStyle}>Address</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Hostel address" style={inputStyle} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" rows={3} style={{ ...inputStyle, resize: 'none' }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-primary)',
              backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '0.875rem',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Cancel</button>
            <button type="submit" disabled={mutation.isPending || !canSubmit} style={{
              flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
              color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
              opacity: (mutation.isPending || !canSubmit) ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              fontFamily: 'inherit',
            }}>
              {mutation.isPending ? (
                <><Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />Creating...</>
              ) : 'Create Hostel'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
