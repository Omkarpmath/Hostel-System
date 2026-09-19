import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { hostelApi } from '@/api/hostel.api';
import { userApi } from '@/api/user.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useTheme } from '@/providers/ThemeProvider';
import { useToast } from '@/providers/ToastProvider';
import {
  Building2, Plus, X, Loader2, MapPin, Users, BedDouble,
  ChevronDown, ChevronRight, AlertCircle, FileSpreadsheet,
  Download, UploadCloud, ShieldAlert, CheckCircle2, Lock, Unlock,
  Search, Layers, Sparkles
} from 'lucide-react';
import type { Hostel, Room } from '@/types';

export function HostelListPage() {
  const { theme } = useTheme();
  const { toast } = useToast();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [expandedHostel, setExpandedHostel] = useState<string | null>(null);
  const [structureTarget, setStructureTarget] = useState<{ type: 'block' | 'floor' | 'room'; id: string; label: string } | null>(null);
  const [blockRoomTarget, setBlockRoomTarget] = useState<Room | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'BOYS' | 'GIRLS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => hostelApi.getAll(),
    retry: 1,
  });

  const hostels: Hostel[] = (data?.data as any)?.data || [];

  // KPI Calculations
  const stats = useMemo(() => {
    let totalBeds = 0;
    let occupiedBeds = 0;
    hostels.forEach((h) => {
      h.blocks?.forEach((b) => {
        b.floors?.forEach((f) => {
          f.rooms?.forEach((r) => {
            totalBeds += r.capacity;
            occupiedBeds += r.occupiedBeds;
          });
        });
      });
    });
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    return {
      totalHostels: hostels.length,
      boysCount: hostels.filter((h) => h.type === 'BOYS').length,
      girlsCount: hostels.filter((h) => h.type === 'GIRLS').length,
      totalBeds,
      occupiedBeds,
      occupancyRate,
    };
  }, [hostels]);

  // Filtered Hostels
  const filteredHostels = useMemo(() => {
    return hostels.filter((h) => {
      if (categoryFilter !== 'ALL' && h.type !== categoryFilter) return false;
      if (searchQuery.trim() && !h.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
        return false;
      }
      return true;
    });
  }, [hostels, categoryFilter, searchQuery]);

  // Unblock Room Mutation
  const unblockMutation = useMutation({
    mutationFn: (roomId: string) => hostelApi.unblockRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room unblocked and released for allocation.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to unblock room');
    },
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Hostels & Infrastructure Hub"
        description="Physical hostel structures, block/room hierarchy, and administrative room governance"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Hostels' }]}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowBulkImport(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.125rem',
                borderRadius: '0.75rem', border: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <FileSpreadsheet style={{ width: '1rem', height: '1rem', color: '#059669' }} />
              Import CSV
            </button>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
                borderRadius: '0.75rem', border: 'none',
                background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
                color: 'white', fontSize: '0.875rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Create Hostel
            </button>
          </div>
        }
      />

      {/* 3-KPI Executive Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{ ...cardStyle, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '3rem', height: '3rem', borderRadius: '0.75rem',
            backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isDark ? '#60a5fa' : '#2563eb',
          }}>
            <Building2 style={{ width: '1.5rem', height: '1.5rem' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Hostels</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{stats.totalHostels}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              {stats.boysCount} Boys · {stats.girlsCount} Girls
            </p>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '3rem', height: '3rem', borderRadius: '0.75rem',
            backgroundColor: isDark ? 'rgba(13,148,136,0.15)' : '#f0fdf4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isDark ? '#2dd4bf' : '#059669',
          }}>
            <BedDouble style={{ width: '1.5rem', height: '1.5rem' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bed Capacity</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{stats.totalBeds.toLocaleString()}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              Across all buildings & blocks
            </p>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '3rem', height: '3rem', borderRadius: '0.75rem',
            backgroundColor: isDark ? 'rgba(168,85,247,0.15)' : '#faf5ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isDark ? '#c084fc' : '#7e22ce',
          }}>
            <Users style={{ width: '1.5rem', height: '1.5rem' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Occupancy Rate</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{stats.occupancyRate}%</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              {stats.occupiedBeds} of {stats.totalBeds} beds occupied
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '1rem', flexWrap: 'wrap',
      }}>
        {/* Category Pills */}
        <div style={{
          display: 'flex', padding: '0.25rem', borderRadius: '0.75rem',
          backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
          gap: '0.25rem',
        }}>
          {(['ALL', 'BOYS', 'GIRLS'] as const).map((cat) => {
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none',
                  backgroundColor: isSelected ? 'var(--bg-card)' : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.8125rem', fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat === 'ALL' && 'All Hostels'}
                {cat === 'BOYS' && 'Boys Hostels 🏢'}
                {cat === 'GIRLS' && 'Girls Hostels 🏛️'}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{
          position: 'relative', minWidth: '260px', flex: '1', maxWidth: '380px',
        }}>
          <Search style={{
            position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
            width: '1rem', height: '1rem', color: 'var(--text-muted)',
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hostel name..."
            style={{
              width: '100%', padding: '0.625rem 0.875rem 0.625rem 2.375rem',
              borderRadius: '0.75rem', border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
              fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Hostels List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 style={{ width: '2rem', height: '2rem', animation: 'spin 1s linear infinite', color: '#2563eb' }} />
        </div>
      ) : filteredHostels.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hostels.length === 0 ? 'No hostels registered yet' : 'No matching hostels'}
          description={
            hostels.length === 0
              ? 'Get started by creating your first hostel or importing room infrastructure via CSV.'
              : 'Try changing your category tab or clearing the search filter.'
          }
          action={
            hostels.length === 0
              ? { label: 'Create Hostel', onClick: () => setShowCreate(true) }
              : undefined
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredHostels.map((hostel) => {
            const isExpanded = expandedHostel === hostel.id;
            let hostelRooms = 0;
            let hostelBeds = 0;
            let hostelOccupied = 0;

            hostel.blocks?.forEach((b) => {
              b.floors?.forEach((f) => {
                f.rooms?.forEach((r) => {
                  hostelRooms++;
                  hostelBeds += r.capacity;
                  hostelOccupied += r.occupiedBeds;
                });
              });
            });

            const occPct = hostelBeds > 0 ? Math.round((hostelOccupied / hostelBeds) * 100) : 0;
            const isBoys = hostel.type === 'BOYS';

            return (
              <motion.div key={hostel.id} layout style={cardStyle}>
                {/* Hostel Header Card */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '3.25rem', height: '3.25rem', borderRadius: '0.875rem',
                        backgroundColor: isBoys
                          ? (isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff')
                          : (isDark ? 'rgba(236,72,153,0.15)' : '#fdf2f8'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isBoys
                          ? (isDark ? '#60a5fa' : '#2563eb')
                          : (isDark ? '#f472b6' : '#db2777'),
                      }}>
                        <Building2 style={{ width: '1.75rem', height: '1.75rem' }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {hostel.name}
                          </h3>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 800,
                            letterSpacing: '0.05em',
                            backgroundColor: isBoys
                              ? (isDark ? 'rgba(37,99,235,0.2)' : '#dbeafe')
                              : (isDark ? 'rgba(219,39,119,0.2)' : '#fce7f3'),
                            color: isBoys
                              ? (isDark ? '#93c5fd' : '#1e40af')
                              : (isDark ? '#fbcfe8' : '#9d174d'),
                          }}>
                            {isBoys ? 'BOYS HOSTEL' : 'GIRLS HOSTEL'}
                          </span>
                          <StatusBadge status={hostel.isActive ? 'ACTIVE' : 'INACTIVE'} />
                        </div>
                        {hostel.address && (
                          <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            <MapPin style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                            {hostel.address}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <button
                        onClick={() => setStructureTarget({ type: 'block', id: hostel.id, label: hostel.name })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.5rem 0.875rem', borderRadius: '0.625rem',
                          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        <Plus style={{ width: '0.875rem', height: '0.875rem' }} /> Add Block
                      </button>
                      <button
                        onClick={() => setExpandedHostel(isExpanded ? null : hostel.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.5rem 1rem', borderRadius: '0.625rem',
                          border: 'none',
                          backgroundColor: isExpanded
                            ? (isDark ? '#1e293b' : '#f1f5f9')
                            : (isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff'),
                          color: isExpanded ? 'var(--text-primary)' : (isDark ? '#60a5fa' : '#2563eb'),
                          fontSize: '0.8125rem', fontWeight: 700,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {isExpanded ? 'Hide Structure' : 'View Structure & Rooms'}
                        {isExpanded ? (
                          <ChevronDown style={{ width: '1rem', height: '1rem' }} />
                        ) : (
                          <ChevronRight style={{ width: '1rem', height: '1rem' }} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Summary Bar & Progress */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-primary)',
                    alignItems: 'center',
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capacity Utilization</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                        <div style={{
                          flex: 1, height: '0.5rem', borderRadius: '9999px',
                          backgroundColor: isDark ? '#334155' : '#e2e8f0',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', width: `${occPct}%`,
                            borderRadius: '9999px',
                            background: occPct > 90 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #10b981)',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {hostelOccupied}/{hostelBeds} beds ({occPct}%)
                        </span>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Eligible Cohort</span>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                        {hostel.allowedYears?.length > 0 ? `Year ${hostel.allowedYears.join(', ')} students` : 'All Years'}
                      </p>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Warden</span>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                        {hostel.warden ? `${hostel.warden.firstName} ${hostel.warden.lastName}` : 'Unassigned'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Structure Expansion (Blocks -> Floors -> Rooms) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        borderTop: '1px solid var(--border-primary)',
                        backgroundColor: 'var(--bg-tertiary)',
                        padding: '1.5rem',
                      }}
                    >
                      {hostel.blocks && hostel.blocks.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {hostel.blocks.map((block) => (
                            <div
                              key={block.id}
                              style={{
                                borderRadius: '0.875rem', border: '1px solid var(--border-primary)',
                                backgroundColor: 'var(--bg-card)', padding: '1.25rem',
                              }}
                            >
                              {/* Block Header */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {block.name}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    ({block.floors?.length || 0} floors)
                                  </span>
                                </div>
                                <button
                                  onClick={() => setStructureTarget({ type: 'floor', id: block.id, label: `${hostel.name} · ${block.name}` })}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                                    fontSize: '0.75rem', fontWeight: 700, color: '#2563eb',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                  }}
                                >
                                  <Plus style={{ width: '0.875rem', height: '0.875rem' }} /> Add Floor
                                </button>
                              </div>

                              {/* Floors list */}
                              {block.floors && block.floors.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  {block.floors.map((floor) => (
                                    <div
                                      key={floor.id}
                                      style={{
                                        borderLeft: '2px solid var(--border-primary)',
                                        paddingLeft: '1rem',
                                      }}
                                    >
                                      {/* Floor Header */}
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                          {floor.name} (Floor {floor.floorNumber})
                                        </span>
                                        <button
                                          onClick={() => setStructureTarget({ type: 'room', id: floor.id, label: `${block.name} · ${floor.name}` })}
                                          style={{
                                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                                            fontSize: '0.75rem', fontWeight: 600, color: '#2563eb',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                          }}
                                        >
                                          <Plus style={{ width: '0.75rem', height: '0.75rem' }} /> Add Room
                                        </button>
                                      </div>

                                      {/* Rooms Grid */}
                                      {floor.rooms && floor.rooms.length > 0 ? (
                                        <div style={{
                                          display: 'grid',
                                          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                                          gap: '0.875rem',
                                          alignItems: 'stretch',
                                        }}>
                                          {floor.rooms.map((room) => {
                                            const isBlocked = room.status === 'BLOCKED';

                                            return (
                                              <div
                                                key={room.id}
                                                style={{
                                                  padding: '0.875rem', borderRadius: '0.75rem',
                                                  border: isBlocked
                                                    ? '1.5px solid #a855f7'
                                                    : '1px solid var(--border-primary)',
                                                  backgroundColor: isBlocked
                                                    ? (isDark ? 'rgba(168,85,247,0.1)' : '#faf5ff')
                                                    : 'var(--bg-tertiary)',
                                                  display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                                  height: '100%',
                                                  minHeight: '145px',
                                                  boxSizing: 'border-box',
                                                }}
                                              >
                                                {/* Header with Room Number & Badge */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', minHeight: '1.75rem' }}>
                                                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                                    Room {room.roomNumber}
                                                  </span>
                                                  <div style={{ flexShrink: 0 }}>
                                                    <StatusBadge status={room.status} />
                                                  </div>
                                                </div>

                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                  <span>{room.type}</span> · <span>{room.occupiedBeds}/{room.capacity} beds</span>
                                                </div>

                                                {/* Blocked reason banner */}
                                                {isBlocked && room.blockedReason && (
                                                  <p style={{
                                                    fontSize: '0.6875rem', color: isDark ? '#d8b4fe' : '#7e22ce',
                                                    backgroundColor: isDark ? 'rgba(168,85,247,0.15)' : '#f3e8ff',
                                                    padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                                                    fontStyle: 'italic',
                                                  }}>
                                                    "{room.blockedReason}"
                                                  </p>
                                                )}

                                                {/* Admin Block / Unblock Button Container - Pinned to bottom! */}
                                                <div style={{ marginTop: 'auto', paddingTop: '0.625rem', borderTop: '1px dashed var(--border-primary)' }}>
                                                  {isBlocked ? (
                                                    <button
                                                      onClick={() => unblockMutation.mutate(room.id)}
                                                      disabled={unblockMutation.isPending}
                                                      style={{
                                                        width: '100%', padding: '0.45rem', borderRadius: '0.5rem',
                                                        border: 'none', backgroundColor: '#9333ea', color: 'white',
                                                        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                                                      }}
                                                    >
                                                      <Unlock style={{ width: '0.75rem', height: '0.75rem' }} />
                                                      Unblock Room
                                                    </button>
                                                  ) : (
                                                    <button
                                                      onClick={() => {
                                                        if (room.occupiedBeds > 0) {
                                                          toast.warning('Cannot block room with active student allocations. Vacate beds first.');
                                                          return;
                                                        }
                                                        setBlockRoomTarget(room);
                                                      }}
                                                      style={{
                                                        width: '100%', padding: '0.45rem', borderRadius: '0.5rem',
                                                        border: '1px solid var(--border-primary)',
                                                        backgroundColor: 'var(--bg-card)',
                                                        color: room.occupiedBeds > 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                                                        fontSize: '0.75rem', fontWeight: 600,
                                                        cursor: room.occupiedBeds > 0 ? 'not-allowed' : 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                                                      }}
                                                    >
                                                      <Lock style={{ width: '0.75rem', height: '0.75rem' }} />
                                                      Block Room
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No rooms added to this floor yet.</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No floors added yet.</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                          <p style={{ fontSize: '0.875rem' }}>No blocks created yet for {hostel.name}.</p>
                          <button
                            onClick={() => setStructureTarget({ type: 'block', id: hostel.id, label: hostel.name })}
                            style={{
                              marginTop: '0.75rem', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                              border: 'none', backgroundColor: '#2563eb', color: 'white',
                              fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            + Add First Block
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreate && <CreateHostelModal onClose={() => setShowCreate(false)} />}
        {showBulkImport && <BulkImportRoomsModal onClose={() => setShowBulkImport(false)} />}
        {structureTarget && <StructureModal target={structureTarget} onClose={() => setStructureTarget(null)} />}
        {blockRoomTarget && (
          <BlockRoomModal
            room={blockRoomTarget}
            onClose={() => setBlockRoomTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================================== */
/*  Admin Block Room Modal                                                */
/* ====================================================================== */

function BlockRoomModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [reason, setReason] = useState('Annual Maintenance');
  const [customReason, setCustomReason] = useState('');

  const mutation = useMutation({
    mutationFn: (finalReason: string) => hostelApi.blockRoom(room.id, finalReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(`Room ${room.roomNumber} blocked successfully.`);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to block room');
    },
  });

  const commonReasons = [
    'Annual Maintenance',
    'VIP Guest Reservation',
    'Disciplinary Holding',
    'Structural Inspection',
    'Other (Custom)',
  ];

  const handleBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'Other (Custom)' ? customReason.trim() : reason;
    if (!finalReason) {
      toast.warning('Please enter a reason for blocking this room.');
      return;
    }
    mutation.mutate(finalReason);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '1rem',
        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '28rem', borderRadius: '1rem',
          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)',
          boxShadow: '0 20px 25px rgba(0,0,0,0.2)', padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem',
              backgroundColor: 'rgba(168,85,247,0.15)', color: '#9333ea',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Block Room {room.roomNumber}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Temporarily removes room from student allocation pool
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        <form onSubmit={handleBlock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.375rem' }}>
              Select Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
              }}
            >
              {commonReasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {reason === 'Other (Custom)' && (
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.375rem' }}>
                Specify Custom Reason
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="e.g. Electrical rewiring in progress"
                required
                style={{
                  width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.625rem',
                  border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          <div style={{
            padding: '0.75rem', borderRadius: '0.625rem', fontSize: '0.75rem',
            backgroundColor: 'rgba(59,130,246,0.08)', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
          }}>
            <ShieldAlert style={{ width: '1rem', height: '1rem', color: '#2563eb', flexShrink: 0, marginTop: '0.125rem' }} />
            <span>
              Students browsing rooms will see this room as unavailable. You can unblock this room at any time to return it to the active pool.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '0.625rem', borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)', backgroundColor: 'transparent',
                color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              style={{
                flex: 1, padding: '0.625rem', borderRadius: '0.625rem', border: 'none',
                backgroundColor: '#9333ea', color: 'white', fontSize: '0.875rem',
                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              {mutation.isPending ? <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} /> : 'Confirm Block'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ====================================================================== */
/*  Bulk Infrastructure CSV Import Modal (Stage 4.1)                       */
/* ====================================================================== */

function BulkImportRoomsModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: (f: File) => {
      const fd = new FormData();
      fd.append('file', f);
      return hostelApi.bulkImportRooms(fd);
    },
    onSuccess: (res: any) => {
      const data = res.data?.data || res.data;
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(`Successfully imported ${data.createdRooms} new rooms!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to import CSV');
    },
  });

  const downloadSampleTemplate = () => {
    const csvContent = `HostelName,HostelType,BlockName,FloorNumber,RoomNumber,Capacity,RoomType,FeePerSemester,Amenities
"BMS Boys Hostel 1",BOYS,"Block A",1,101,2,DOUBLE,45000,"Wi-Fi;Study Table;Attached Bath"
"BMS Boys Hostel 1",BOYS,"Block A",1,102,2,DOUBLE,45000,"Wi-Fi;Study Table;Attached Bath"
"BMS Boys Hostel 1",BOYS,"Block A",2,201,1,SINGLE,60000,"AC;Wi-Fi;Attached Bath"
"BMS Girls Hostel 1",GIRLS,"Block B",1,101,3,TRIPLE,40000,"Wi-Fi;Balcony"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hostel_infrastructure_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '1rem',
        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '34rem', borderRadius: '1rem',
          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)',
          boxShadow: '0 20px 25px rgba(0,0,0,0.2)', padding: '1.75rem',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
              backgroundColor: 'rgba(5,150,105,0.15)', color: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileSpreadsheet style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Bulk Infrastructure Importer
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Stage 4.1: Auto-creates Hostels, Blocks, Floors, and Rooms from CSV
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        {/* Template download row */}
        <div style={{
          padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-tertiary)', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <div>
            <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Standard CSV Template
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Contains sample columns: Hostel, Type, Block, Floor, Room, Capacity, Fee
            </p>
          </div>
          <button
            type="button"
            onClick={downloadSampleTemplate}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.875rem',
              borderRadius: '0.5rem', border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-card)', color: '#059669', fontSize: '0.75rem',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Download style={{ width: '0.875rem', height: '0.875rem' }} />
            Download
          </button>
        </div>

        {/* File dropzone */}
        {!result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '2rem 1rem', borderRadius: '0.875rem',
                border: '2px dashed var(--border-primary)', backgroundColor: 'var(--bg-input)',
                cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s',
              }}
            >
              <UploadCloud style={{ width: '2.5rem', height: '2.5rem', color: '#2563eb', marginBottom: '0.75rem' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {file ? file.name : 'Select or drop your CSV file here'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Maximum file size: 10MB (.csv)'}
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) setFile(e.target.files[0]);
                }}
                style={{ display: 'none' }}
              />
            </label>

            <button
              onClick={() => {
                if (!file) {
                  toast.warning('Please select a CSV file first');
                  return;
                }
                mutation.mutate(file);
              }}
              disabled={!file || mutation.isPending}
              style={{
                padding: '0.75rem', borderRadius: '0.75rem', border: 'none',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: 'white', fontSize: '0.875rem', fontWeight: 700,
                cursor: (!file || mutation.isPending) ? 'not-allowed' : 'pointer',
                opacity: (!file || mutation.isPending) ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              {mutation.isPending ? (
                <><Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} /> Processing CSV...</>
              ) : (
                'Import Infrastructure'
              )}
            </button>
          </div>
        )}

        {/* Results view */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              padding: '1rem', borderRadius: '0.75rem',
              backgroundColor: 'rgba(5,150,105,0.1)', color: '#059669',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <CheckCircle2 style={{ width: '1.5rem', height: '1.5rem', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Import Complete!</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.125rem' }}>
                  Processed: {result.processed} rows · Created: {result.createdRooms} rooms · Updated: {result.updatedRooms} rooms
                </p>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div style={{
                maxHeight: '150px', overflowY: 'auto', padding: '0.75rem',
                borderRadius: '0.5rem', backgroundColor: 'var(--bg-tertiary)',
                fontSize: '0.75rem', color: 'var(--text-secondary)',
              }}>
                <p style={{ fontWeight: 700, color: '#ef4444', marginBottom: '0.35rem' }}>Warnings/Errors ({result.errors.length}):</p>
                {result.errors.map((err: string, i: number) => (
                  <p key={i} style={{ fontFamily: 'monospace' }}>• {err}</p>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                padding: '0.75rem', borderRadius: '0.75rem', border: 'none',
                backgroundColor: '#2563eb', color: 'white', fontSize: '0.875rem',
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              Done & View Hostels
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ====================================================================== */
/*  Structure Modal (Add Block / Floor / Room)                            */
/* ====================================================================== */

function StructureModal({ target, onClose }: { target: { type: 'block' | 'floor' | 'room'; id: string; label: string }; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { toast } = useToast();
  const [error, setError] = useState('');

  // Form State
  const [blockName, setBlockName] = useState('');
  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [floorName, setFloorName] = useState<string>('1st Floor');

  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState<number>(2);
  const [roomType, setRoomType] = useState<'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORMITORY'>('DOUBLE');
  const [feePerSemester, setFeePerSemester] = useState<number>(45000);

  // Helper for Floor naming
  const getFloorName = (num: number): string => {
    if (num === 0) return 'Ground Floor';
    if (num === 1) return '1st Floor';
    if (num === 2) return '2nd Floor';
    if (num === 3) return '3rd Floor';
    if (num === -1) return 'Basement';
    const lastDigit = Math.abs(num) % 10;
    const lastTwo = Math.abs(num) % 100;
    if (lastTwo >= 11 && lastTwo <= 13) return `${num}th Floor`;
    if (lastDigit === 1) return `${num}st Floor`;
    if (lastDigit === 2) return `${num}nd Floor`;
    if (lastDigit === 3) return `${num}rd Floor`;
    return `${num}th Floor`;
  };

  const handleFloorNumberChange = (num: number) => {
    setFloorNumber(num);
    setFloorName(getFloorName(num));
  };

  const handleFloorNameChange = (val: string) => {
    setFloorName(val);
    const lower = val.toLowerCase().trim();
    if (lower.includes('ground') || lower === '0') {
      setFloorNumber(0);
    } else if (lower.includes('basement')) {
      setFloorNumber(-1);
    } else {
      const match = lower.match(/\d+/);
      if (match) {
        setFloorNumber(parseInt(match[0], 10));
      }
    }
  };

  // Helper for Room capacity & type auto-sync
  const handleCapacityChange = (cap: number) => {
    const val = Math.max(1, Math.min(cap || 1, 10));
    setCapacity(val);
    if (val === 1) {
      setRoomType('SINGLE');
      if (feePerSemester === 45000) setFeePerSemester(55000);
    } else if (val === 2) {
      setRoomType('DOUBLE');
      if (feePerSemester === 55000 || feePerSemester === 35000) setFeePerSemester(45000);
    } else if (val === 3) {
      setRoomType('TRIPLE');
      if (feePerSemester === 45000) setFeePerSemester(35000);
    } else {
      setRoomType('DORMITORY');
      if (feePerSemester === 35000 || feePerSemester === 45000) setFeePerSemester(28000);
    }
  };

  const handleRoomTypeChange = (type: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORMITORY') => {
    setRoomType(type);
    if (type === 'SINGLE') {
      setCapacity(1);
      if (feePerSemester === 45000) setFeePerSemester(55000);
    } else if (type === 'DOUBLE') {
      setCapacity(2);
      if (feePerSemester === 55000 || feePerSemester === 35000) setFeePerSemester(45000);
    } else if (type === 'TRIPLE') {
      setCapacity(3);
      if (feePerSemester === 45000) setFeePerSemester(35000);
    } else if (type === 'DORMITORY') {
      setCapacity((prev) => (prev >= 4 ? prev : 4));
      if (feePerSemester === 35000 || feePerSemester === 45000) setFeePerSemester(28000);
    }
  };

  const mutation = useMutation<any, any, void>({
    mutationFn: () => {
      if (target.type === 'block') {
        if (!blockName.trim()) throw new Error('Please specify a block name.');
        return hostelApi.createBlock(target.id, { name: blockName.trim() });
      }
      if (target.type === 'floor') {
        if (!floorName.trim()) throw new Error('Please specify a floor name.');
        return hostelApi.createFloor(target.id, {
          name: floorName.trim(),
          floorNumber,
        });
      }
      if (!roomNumber.trim()) throw new Error('Please specify a room number.');
      return hostelApi.createRoom(target.id, {
        roomNumber: roomNumber.trim(),
        capacity,
        type: roomType,
        feePerSemester,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(`${target.type.toUpperCase()} created successfully`);
      onClose();
    },
    onError: (err: any) => setError(err.response?.data?.message || err.message || 'Unable to save record.'),
  });

  const heading = target.type === 'block' ? 'Add Block' : target.type === 'floor' ? 'Add Floor' : 'Add Room';
  const IconComponent = target.type === 'block' ? Building2 : target.type === 'floor' ? Layers : BedDouble;
  const iconColor = target.type === 'block' ? '#6366f1' : target.type === 'floor' ? '#0ea5e9' : '#10b981';
  const iconBg = isDark
    ? (target.type === 'block' ? 'rgba(99,102,241,0.2)' : target.type === 'floor' ? 'rgba(14,165,233,0.2)' : 'rgba(16,185,129,0.2)')
    : (target.type === 'block' ? '#eef2ff' : target.type === 'floor' ? '#f0f9ff' : '#ecfdf5');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.875rem',
    borderRadius: '0.625rem',
    border: '1px solid var(--border-primary)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    display: 'block',
    marginBottom: '0.35rem',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '1rem',
        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <motion.form
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          setError('');
          mutation.mutate();
        }}
        style={{
          width: '100%', maxWidth: '28rem', borderRadius: '1.25rem',
          border: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-card)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-primary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
              backgroundColor: iconBg, color: iconColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <IconComponent style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>{heading}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                Adding to <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{target.label}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '0.375rem', borderRadius: '0.5rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 0.875rem', borderRadius: '0.625rem',
              backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2',
              border: '1px solid rgba(239,68,68,0.3)',
              color: isDark ? '#fca5a5' : '#dc2626', fontSize: '0.8125rem',
            }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* ================= BLOCK FORM ================= */}
          {target.type === 'block' && (
            <div>
              <label style={labelStyle}>Block Name</label>
              <input
                required
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                placeholder="e.g. Block A"
                style={inputStyle}
                autoFocus
              />

              {/* Quick Presets */}
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.375rem' }}>
                  Quick Presets:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {['Block A', 'Block B', 'Block C', 'Block D', 'Main Block'].map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setBlockName(name)}
                      style={{
                        padding: '0.25rem 0.625rem', borderRadius: '0.5rem',
                        border: `1px solid ${blockName === name ? '#6366f1' : 'var(--border-primary)'}`,
                        backgroundColor: blockName === name ? (isDark ? 'rgba(99,102,241,0.2)' : '#eef2ff') : 'transparent',
                        color: blockName === name ? '#6366f1' : 'var(--text-secondary)',
                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= FLOOR FORM ================= */}
          {target.type === 'floor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Floor Presets */}
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.375rem' }}>
                  Quick Floor Selection:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {[
                    { label: 'Ground Floor', num: 0 },
                    { label: '1st Floor', num: 1 },
                    { label: '2nd Floor', num: 2 },
                    { label: '3rd Floor', num: 3 },
                    { label: '4th Floor', num: 4 },
                  ].map((p) => {
                    const active = floorNumber === p.num;
                    return (
                      <button
                        key={p.num}
                        type="button"
                        onClick={() => handleFloorNumberChange(p.num)}
                        style={{
                          padding: '0.25rem 0.625rem', borderRadius: '0.5rem',
                          border: `1px solid ${active ? '#0ea5e9' : 'var(--border-primary)'}`,
                          backgroundColor: active ? (isDark ? 'rgba(14,165,233,0.2)' : '#f0f9ff') : 'transparent',
                          color: active ? '#0284c7' : 'var(--text-secondary)',
                          fontSize: '0.75rem', fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Floor Number</label>
                  <input
                    required
                    type="number"
                    min="0"
                    max="50"
                    value={floorNumber}
                    onChange={(e) => handleFloorNumberChange(parseInt(e.target.value, 10) || 0)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Floor Name</label>
                  <input
                    required
                    value={floorName}
                    onChange={(e) => handleFloorNameChange(e.target.value)}
                    placeholder="e.g. 1st Floor"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Auto-Sync Feedback Banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                backgroundColor: isDark ? 'rgba(14,165,233,0.1)' : '#f0f9ff',
                color: isDark ? '#38bdf8' : '#0284c7', fontSize: '0.75rem', fontWeight: 600,
              }}>
                <Sparkles style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0 }} />
                <span>Auto-synced: Number <strong>{floorNumber}</strong> ⇄ "<strong>{floorName}</strong>"</span>
              </div>
            </div>
          )}

          {/* ================= ROOM FORM ================= */}
          {target.type === 'room' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Room Number</label>
                <input
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 101, 102, 201"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              {/* Quick Preset Chips for Room Type */}
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.375rem' }}>
                  Room Sharing Presets:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {[
                    { label: 'Single (1 Bed)', type: 'SINGLE' as const, cap: 1, desc: 'Private room' },
                    { label: 'Double (2 Beds)', type: 'DOUBLE' as const, cap: 2, desc: 'Twin sharing' },
                    { label: 'Triple (3 Beds)', type: 'TRIPLE' as const, cap: 3, desc: '3 roommates' },
                    { label: 'Dormitory (4+ Beds)', type: 'DORMITORY' as const, cap: 4, desc: 'Shared hall' },
                  ].map((preset) => {
                    const active = roomType === preset.type;
                    return (
                      <button
                        key={preset.type}
                        type="button"
                        onClick={() => handleRoomTypeChange(preset.type)}
                        style={{
                          padding: '0.5rem 0.75rem', borderRadius: '0.625rem', textAlign: 'left',
                          border: `1.5px solid ${active ? '#10b981' : 'var(--border-primary)'}`,
                          backgroundColor: active ? (isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5') : 'var(--bg-tertiary)',
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <p style={{ fontSize: '0.8125rem', fontWeight: active ? 800 : 600, color: active ? '#10b981' : 'var(--text-primary)' }}>
                          {preset.label}
                        </p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                          {preset.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Capacity & Room Type Synced Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Capacity (Beds)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="10"
                    value={capacity}
                    onChange={(e) => handleCapacityChange(parseInt(e.target.value, 10) || 1)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Room Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => handleRoomTypeChange(e.target.value as any)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="SINGLE">SINGLE</option>
                    <option value="DOUBLE">DOUBLE</option>
                    <option value="TRIPLE">TRIPLE</option>
                    <option value="DORMITORY">DORMITORY</option>
                  </select>
                </div>
              </div>

              {/* Auto-Sync Feedback Banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5',
                color: isDark ? '#34d399' : '#059669', fontSize: '0.75rem', fontWeight: 600,
              }}>
                <Sparkles style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0 }} />
                <span>Auto-linked: Capacity <strong>{capacity}</strong> ⇄ <strong>{roomType}</strong></span>
              </div>

              <div>
                <label style={labelStyle}>Fee per semester (₹)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="100"
                  value={feePerSemester}
                  onChange={(e) => setFeePerSemester(parseFloat(e.target.value) || 0)}
                  style={inputStyle}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
          padding: '1rem 1.5rem', borderTop: '1px solid var(--border-primary)',
          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.625rem',
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
              padding: '0.5rem 1.25rem', borderRadius: '0.625rem', border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
              color: 'white', fontSize: '0.875rem', fontWeight: 700,
              cursor: mutation.isPending ? 'not-allowed' : 'pointer',
              opacity: mutation.isPending ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontFamily: 'inherit',
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

/* ====================================================================== */
/*  Create Hostel Modal                                                   */
/* ====================================================================== */

function CreateHostelModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    type: 'BOYS' as 'BOYS' | 'GIRLS',
    address: '',
    description: '',
    wardenId: '',
    allowedYears: [1, 2, 3, 4],
  });
  const [error, setError] = useState('');

  const { data: wardensData } = useQuery({
    queryKey: ['wardens'],
    queryFn: () => userApi.getWardens(),
    retry: 1,
  });
  const wardens: any[] = (wardensData?.data as any)?.data || [];

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        type: form.type,
        allowedYears: form.allowedYears,
      };
      if (form.address.trim()) payload.address = form.address.trim();
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.wardenId) payload.wardenId = form.wardenId;
      return hostelApi.create(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      toast.success('Hostel created successfully.');
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
    fontFamily: 'inherit',
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
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '32rem', borderRadius: '1rem',
          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)',
          boxShadow: '0 20px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>Create Hostel</h2>
            <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>Add a new hostel building to the campus</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <X style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)' }} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) mutation.mutate(); }} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

          <div>
            <label style={labelStyle}>Hostel Name *</label>
            <input
              type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Vishveshwaraya Boys Hostel"
              style={inputStyle} required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Hostel Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} style={inputStyle}>
                <option value="BOYS">Boys Hostel</option>
                <option value="GIRLS">Girls Hostel</option>
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

          <div>
            <label style={labelStyle}>Allowed Cohorts (Years) *</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              {[1, 2, 3, 4].map((year) => {
                const isSelected = form.allowedYears.includes(year);
                return (
                  <button key={year} type="button" onClick={() => toggleYear(year)} style={{
                    padding: '0.5rem 0.875rem', borderRadius: '0.5rem',
                    border: isSelected ? '2px solid #3b82f6' : '1px solid var(--border-primary)',
                    backgroundColor: isSelected ? (isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff') : 'transparent',
                    color: isSelected ? (isDark ? '#93c5fd' : '#1d4ed8') : 'var(--text-secondary)',
                    fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    Year {year}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Address / Campus Location</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. North Campus, Block B" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Description / Amenities</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief summary of hostel facilities..." rows={2} style={{ ...inputStyle, resize: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-primary)',
              backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '0.875rem',
              fontWeight: 600, cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={mutation.isPending || !canSubmit} style={{
              flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
              color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
              opacity: (mutation.isPending || !canSubmit) ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
              {mutation.isPending ? <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} /> : 'Create Hostel'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
