import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { hostelApi } from '@/api/hostel.api';
import { operationsApi } from '@/api/operations.api';
import { userApi } from '@/api/user.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useTheme } from '@/providers/ThemeProvider';
import { useToast } from '@/providers/ToastProvider';
import {
  BedDouble, Building2, Users, Search, X, Loader2, Download,
  AlertTriangle, CheckCircle2, Lock, Phone, Mail,
  ChevronDown, FileSpreadsheet,
  UserCheck, RefreshCw, UserPlus,
  ArrowLeft, MapPin, ChevronRight
} from 'lucide-react';
import type { Room, RoomAllocation } from '@/types';

export function AdminRoomsAllocationsHub() {
  const { theme } = useTheme();
  const { toast } = useToast();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  // Filters State
  const [selectedHostelId, setSelectedHostelId] = useState<string | null>(null);
  const [hostelCohort, setHostelCohort] = useState<'ALL' | 'BOYS' | 'GIRLS'>('ALL');
  const [hostelSearch, setHostelSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers State
  const [selectedResident, setSelectedResident] = useState<{
    allocation: RoomAllocation;
    room: Room;
  } | null>(null);

  const [vacateTarget, setVacateTarget] = useState<{
    allocationId: string;
    studentName: string;
    roomNumber: string;
    bedNumber: number;
  } | null>(null);

  const [allocateModal, setAllocateModal] = useState<{
    roomId: string;
    roomNumber: string;
    bedNumber: number;
    hostelName?: string;
  } | null>(null);

  const [showRolloverModal, setShowRolloverModal] = useState(false);
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);

  // 1. Fetch Hostels list for cards & selector
  const { data: hostelsData, isLoading: hostelsLoading } = useQuery({
    queryKey: ['hostels-dropdown'],
    queryFn: () => hostelApi.getAll(),
  });
  const hostels: any[] = (hostelsData?.data as any)?.data || [];

  // 2. Fetch Rooms with Allocations & Resident info (only when a hostel is selected!)
  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: [
      'rooms-allocations',
      selectedHostelId,
      yearFilter,
      statusFilter,
      searchQuery,
    ],
    queryFn: () =>
      hostelApi.getRooms({
        hostelId: selectedHostelId!,
        year: yearFilter !== 'ALL' ? yearFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
        limit: '200',
      }),
    enabled: !!selectedHostelId,
  });
  const rooms: Room[] = (roomsData?.data as any)?.data || [];

  // 3. Vacate Bed Mutation
  const vacateMutation = useMutation({
    mutationFn: (allocationId: string) => operationsApi.vacate(allocationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      queryClient.invalidateQueries({ queryKey: ['all-rooms'] });
      toast.success('Bed vacated and room capacity released successfully.');
      setVacateTarget(null);
      setSelectedResident(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to vacate bed');
    },
  });

  // 4. Academic Year Rollover Mutation (Stage 4.3)
  const rolloverMutation = useMutation({
    mutationFn: () => operationsApi.academicRollover(),
    onSuccess: (res: any) => {
      const data = res.data?.data || res.data;
      queryClient.invalidateQueries({ queryKey: ['rooms-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(
        `Rollover Successful: ${data.graduatedCount} students graduated, ${data.promotedCount} students promoted!`
      );
      setShowRolloverModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Rollover execution failed');
    },
  });

  // 5. Download Report Helper (Stage 5.2)
  const handleDownloadReport = async (type: 'fees' | 'attendance' | 'mess') => {
    try {
      setShowReportsDropdown(false);
      toast.info('Preparing CSV report export...');
      let res: any;
      let filename = '';
      if (type === 'fees') {
        res = await operationsApi.downloadFeeDefaultersReport();
        filename = `fee_defaulters_${new Date().toISOString().split('T')[0]}.csv`;
      } else if (type === 'attendance') {
        res = await operationsApi.downloadAttendanceShortageReport();
        filename = `attendance_shortage_${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        res = await operationsApi.downloadMessHeadcountReport();
        filename = `mess_headcount_${new Date().toISOString().split('T')[0]}.csv`;
      }
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report downloaded successfully!');
    } catch (err: any) {
      toast.error('Failed to download CSV report');
    }
  };

  // Helper: compute stats from hostel structure
  const getHostelStats = (hostel: any) => {
    let roomCount = 0;
    let totalBeds = 0;
    let occupiedBeds = 0;

    if (hostel?.blocks) {
      for (const block of hostel.blocks) {
        if (block?.floors) {
          for (const floor of block.floors) {
            if (floor?.rooms) {
              roomCount += floor.rooms.length;
              for (const room of floor.rooms) {
                const cap = Number(room.capacity) || 0;
                totalBeds += cap;
                const occ =
                  room.status === 'BLOCKED'
                    ? cap
                    : Number(room.occupiedBeds) || room.allocations?.length || 0;
                occupiedBeds += occ;
              }
            }
          }
        }
      }
    }

    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return { roomCount, totalBeds, occupiedBeds, availableBeds, occupancyPct };
  };

  // Campus-wide totals across all hostels
  const campusTotals = useMemo(() => {
    let totalRooms = 0;
    let totalBeds = 0;
    let occupiedBeds = 0;

    for (const h of hostels) {
      const stats = getHostelStats(h);
      totalRooms += stats.roomCount;
      totalBeds += stats.totalBeds;
      occupiedBeds += stats.occupiedBeds;
    }

    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      totalHostels: hostels.length,
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyPct,
    };
  }, [hostels]);

  // Hostels filtered by Cohort (All / Boys / Girls) and Search
  const filteredHostels = useMemo(() => {
    return hostels.filter((h: any) => {
      const matchesCohort =
        hostelCohort === 'ALL' ||
        (hostelCohort === 'BOYS' && h.type === 'BOYS') ||
        (hostelCohort === 'GIRLS' && h.type === 'GIRLS');

      const matchesSearch =
        !hostelSearch.trim() ||
        h.name?.toLowerCase().includes(hostelSearch.toLowerCase()) ||
        h.address?.toLowerCase().includes(hostelSearch.toLowerCase()) ||
        h.code?.toLowerCase().includes(hostelSearch.toLowerCase());

      return matchesCohort && matchesSearch;
    });
  }, [hostels, hostelCohort, hostelSearch]);

  // Selected Hostel object
  const selectedHostel = useMemo(
    () => hostels.find((h: any) => h.id === selectedHostelId) || null,
    [hostels, selectedHostelId]
  );

  // Selected Hostel live loaded room stats
  const selectedHostelStats = useMemo(() => {
    const totalBeds = rooms.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0);
    const occupiedBeds = rooms.reduce(
      (acc, r) =>
        acc +
        (r.status === 'BLOCKED'
          ? Number(r.capacity) || 0
          : r.allocations?.length || Number(r.occupiedBeds) || 0),
      0
    );
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      roomCount: rooms.length,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyPct,
    };
  }, [rooms]);

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  };

  // Header Actions (Aligned horizontally with identical height)
  const renderHeaderActions = (includeBackButton = false) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'nowrap',
        flexShrink: 0,
      }}
    >
      {includeBackButton && (
        <button
          onClick={() => setSelectedHostelId(null)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0 1rem',
            height: '2.625rem',
            boxSizing: 'border-box',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'background-color 0.15s',
          }}
        >
          <ArrowLeft style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
          <span>All Hostels</span>
        </button>
      )}

      {/* Reports Dropdown Button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowReportsDropdown(!showReportsDropdown)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0 1rem',
            height: '2.625rem',
            boxSizing: 'border-box',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-primary)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'background-color 0.15s',
          }}
        >
          <FileSpreadsheet style={{ width: '1.05rem', height: '1.05rem', color: '#059669', flexShrink: 0 }} />
          <span>Download Reports</span>
          <ChevronDown style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)', flexShrink: 0 }} />
        </button>

        <AnimatePresence>
          {showReportsDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 0.5rem)',
                zIndex: 50,
                minWidth: '220px',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-card)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <button
                onClick={() => handleDownloadReport('fees')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <Download style={{ width: '0.875rem', height: '0.875rem', color: '#2563eb' }} />
                Fee Defaulters (CSV)
              </button>
              <button
                onClick={() => handleDownloadReport('attendance')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <Download style={{ width: '0.875rem', height: '0.875rem', color: '#f59e0b' }} />
                Attendance Shortage (CSV)
              </button>
              <button
                onClick={() => handleDownloadReport('mess')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <Download style={{ width: '0.875rem', height: '0.875rem', color: '#10b981' }} />
                Mess Meal Headcount (CSV)
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Academic Year Rollover Button */}
      <button
        onClick={() => setShowRolloverModal(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0 1.125rem',
          height: '2.625rem',
          boxSizing: 'border-box',
          borderRadius: '0.75rem',
          border: '1px solid rgba(234,88,12,0.35)',
          backgroundColor: isDark ? 'rgba(234,88,12,0.14)' : '#fff7ed',
          color: isDark ? '#fdba74' : '#c2410c',
          fontSize: '0.875rem',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 3px rgba(234,88,12,0.1)',
        }}
      >
        <RefreshCw style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
        <span>Academic Rollover</span>
      </button>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: No hostel selected → Show Boys/Girls selection cards
  // ═══════════════════════════════════════════════════════════════
  if (!selectedHostelId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader
          title="Rooms & Allocations Hub"
          description="Select a hostel to view real-time room occupancy, allocate student beds, and manage residents"
          breadcrumbs={[
            { label: 'Dashboard', href: '/admin/dashboard' },
            { label: 'Rooms & Allocations' },
          ]}
          actions={renderHeaderActions(false)}
        />

        {/* Campus Quick Overview KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ ...cardStyle, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
              color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Building2 style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hostels Active</p>
              <h4 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)' }}>{campusTotals.totalHostels}</h4>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(147,51,234,0.15)' : '#faf5ff',
              color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <BedDouble style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Campus Rooms</p>
              <h4 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)' }}>{campusTotals.totalRooms}</h4>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5',
              color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Users style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bed Occupancy</p>
              <h4 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {campusTotals.occupiedBeds} / {campusTotals.totalBeds} ({campusTotals.occupancyPct}%)
              </h4>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(234,88,12,0.15)' : '#fff7ed',
              color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <UserCheck style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Vacancies</p>
              <h4 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {campusTotals.availableBeds} beds
              </h4>
            </div>
          </div>
        </div>

        {/* Hostel Selection Filter Bar: Boys / Girls + Search */}
        <div style={{ ...cardStyle, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Hostel Cohort Pills */}
            <div style={{
              display: 'flex', padding: '0.25rem', borderRadius: '0.625rem',
              backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
              gap: '0.25rem',
            }}>
              {(['ALL', 'BOYS', 'GIRLS'] as const).map((cohort) => {
                const count = cohort === 'ALL'
                  ? hostels.length
                  : hostels.filter((h) => h.type === cohort).length;

                return (
                  <button
                    key={cohort}
                    onClick={() => setHostelCohort(cohort)}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none',
                      backgroundColor: hostelCohort === cohort ? 'var(--bg-card)' : 'transparent',
                      color: hostelCohort === cohort ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.8125rem', fontWeight: hostelCohort === cohort ? 700 : 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: hostelCohort === cohort ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    <span>
                      {cohort === 'ALL' && 'All Hostels'}
                      {cohort === 'BOYS' && 'Boys Hostels 🏢'}
                      {cohort === 'GIRLS' && 'Girls Hostels 🏛️'}
                    </span>
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.375rem',
                      borderRadius: '9999px',
                      backgroundColor: hostelCohort === cohort
                        ? (isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe')
                        : 'var(--bg-card)',
                      color: hostelCohort === cohort ? '#2563eb' : 'var(--text-muted)',
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing {filteredHostels.length} of {hostels.length} Hostels
            </span>
          </div>

          {/* Search Hostels Input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search style={{
              position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
              width: '1.125rem', height: '1.125rem', color: 'var(--text-muted)',
            }} />
            <input
              type="text"
              value={hostelSearch}
              onChange={(e) => setHostelSearch(e.target.value)}
              placeholder="Search hostels by name, campus, or address..."
              style={{
                width: '100%', padding: '0.625rem 1rem 0.625rem 2.625rem',
                borderRadius: '0.75rem', border: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)',
                fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* Hostel Cards Grid (Step 1) */}
        {hostelsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 style={{ width: '2.5rem', height: '2.5rem', animation: 'spin 1s linear infinite', color: '#2563eb' }} />
          </div>
        ) : filteredHostels.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No hostels found"
            description={
              hostelCohort !== 'ALL'
                ? `No ${hostelCohort === 'BOYS' ? 'Boys' : 'Girls'} Hostels found matching your search.`
                : 'No hostels found matching your search query.'
            }
            action={{
              label: 'Show All Hostels',
              onClick: () => {
                setHostelCohort('ALL');
                setHostelSearch('');
              },
            }}
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.25rem',
          }}>
            {filteredHostels.map((hostel: any, i: number) => {
              const stats = getHostelStats(hostel);
              const isBoys = hostel.type === 'BOYS';

              return (
                <motion.div
                  key={hostel.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedHostelId(hostel.id)}
                  style={{
                    ...cardStyle,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.5rem',
                    transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = isBoys
                      ? (isDark ? 'rgba(59,130,246,0.6)' : '#93c5fd')
                      : (isDark ? 'rgba(236,72,153,0.6)' : '#f9a8d4');
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-primary)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  }}
                >
                  {/* Header: Icon + Cohort Badge + Status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{
                      width: '3.25rem', height: '3.25rem', borderRadius: '0.875rem',
                      background: isBoys
                        ? 'linear-gradient(135deg, #1e40af, #2563eb, #0284c7)'
                        : 'linear-gradient(135deg, #9d174d, #db2777, #be185d)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isBoys
                        ? '0 4px 12px rgba(37,99,235,0.3)'
                        : '0 4px 12px rgba(219,39,119,0.3)',
                      color: 'white', flexShrink: 0,
                    }}>
                      <Building2 style={{ width: '1.625rem', height: '1.625rem' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 800, padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        backgroundColor: isBoys
                          ? (isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe')
                          : (isDark ? 'rgba(236,72,153,0.2)' : '#fce7f3'),
                        color: isBoys
                          ? (isDark ? '#93c5fd' : '#1e40af')
                          : (isDark ? '#f472b6' : '#be185d'),
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {isBoys ? 'Boys Hostel 🏢' : 'Girls Hostel 🏛️'}
                      </span>
                      <span style={{
                        width: '0.5rem', height: '0.5rem', borderRadius: '9999px',
                        backgroundColor: hostel.isActive !== false ? '#10b981' : '#ef4444',
                      }} />
                    </div>
                  </div>

                  {/* Name & Address */}
                  <h3 style={{ fontSize: '1.1875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {hostel.name}
                  </h3>
                  <p style={{
                    fontSize: '0.8125rem', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem',
                  }}>
                    <MapPin style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {hostel.address || 'BMSET Campus'}
                    </span>
                  </p>

                  {/* Occupancy Progress Bar */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Bed Occupancy
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {stats.occupiedBeds} / {stats.totalBeds} ({stats.occupancyPct}%)
                      </span>
                    </div>
                    <div style={{
                      width: '100%', height: '0.5rem', borderRadius: '9999px',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${Math.min(100, stats.occupancyPct)}%`,
                        height: '100%', borderRadius: '9999px',
                        background: stats.occupancyPct >= 90
                          ? 'linear-gradient(90deg, #ea580c, #ef4444)'
                          : isBoys
                            ? 'linear-gradient(90deg, #2563eb, #38bdf8)'
                            : 'linear-gradient(90deg, #db2777, #f472b6)',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>

                  {/* Stats Mini Grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem',
                    padding: '0.875rem', borderRadius: '0.75rem',
                    backgroundColor: isDark ? 'rgba(255,255,200,0.02)' : 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)', marginBottom: '1.25rem',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {stats.roomCount}
                      </p>
                      <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Rooms
                      </p>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-primary)', borderRight: '1px solid var(--border-primary)' }}>
                      <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {stats.totalBeds}
                      </p>
                      <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Total Beds
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{
                        fontSize: '1.125rem', fontWeight: 800,
                        color: stats.availableBeds > 0 ? '#10b981' : '#ef4444',
                      }}>
                        {stats.availableBeds}
                      </p>
                      <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Vacancies
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Allowed Years + Browse CTA */}
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600,
                    }}>
                      {hostel.allowedYears?.length
                        ? `Years: ${hostel.allowedYears.join(', ')}`
                        : 'All Academic Years'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHostelId(hostel.id);
                      }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.5rem 0.875rem', borderRadius: '0.625rem', border: 'none',
                        backgroundColor: isBoys ? '#2563eb' : '#db2777',
                        color: 'white', fontSize: '0.75rem', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: isBoys
                          ? '0 2px 8px rgba(37,99,235,0.3)'
                          : '0 2px 8px rgba(219,39,119,0.3)',
                      }}
                    >
                      <span>Browse Rooms</span>
                      <ChevronRight style={{ width: '0.875rem', height: '0.875rem' }} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Rollover Modal */}
        <AnimatePresence>
          {showRolloverModal && (
            <AcademicRolloverModal
              onClose={() => setShowRolloverModal(false)}
              onConfirm={() => rolloverMutation.mutate()}
              isLoading={rolloverMutation.isPending}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Hostel selected → Show its rooms & allocations
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title={`${selectedHostel?.name || 'Hostel'} Rooms`}
        description={`Live resident occupancy, bed allocation, and infrastructure management for ${selectedHostel?.name || 'this hostel'}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Rooms & Allocations' },
          { label: selectedHostel?.name || 'Hostel Rooms' },
        ]}
        actions={renderHeaderActions(true)}
      />

      {/* Selected Hostel Spotlight Banner */}
      {selectedHostel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...cardStyle,
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            background: isDark
              ? 'linear-gradient(135deg, rgba(30,64,175,0.12), rgba(13,148,136,0.06))'
              : 'linear-gradient(135deg, #eff6ff, #f0fdfa)',
            border: `1px solid ${isDark ? 'rgba(59,130,246,0.25)' : '#bfdbfe'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '3rem', height: '3rem', borderRadius: '0.75rem',
              background: selectedHostel.type === 'BOYS'
                ? 'linear-gradient(135deg, #1e40af, #2563eb)'
                : 'linear-gradient(135deg, #9d174d, #db2777)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0,
            }}>
              <Building2 style={{ width: '1.5rem', height: '1.5rem' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedHostel.name}
                </h2>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 800, padding: '0.2rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: selectedHostel.type === 'BOYS'
                    ? (isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe')
                    : (isDark ? 'rgba(236,72,153,0.2)' : '#fce7f3'),
                  color: selectedHostel.type === 'BOYS'
                    ? (isDark ? '#93c5fd' : '#1e40af')
                    : (isDark ? '#f472b6' : '#be185d'),
                  textTransform: 'uppercase',
                }}>
                  {selectedHostel.type}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                {selectedHostel.address || 'BMSET Campus'}
                {selectedHostel.allowedYears?.length > 0 &&
                  ` · Academic Years: ${selectedHostel.allowedYears.join(', ')}`}
                {selectedHostel.warden &&
                  ` · Warden: ${selectedHostel.warden.firstName} ${selectedHostel.warden.lastName}`}
              </p>
            </div>
          </div>

          {/* Quick Switch Hostel Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Switch Hostel:
            </span>
            <select
              value={selectedHostelId}
              onChange={(e) => setSelectedHostelId(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem', borderRadius: '0.5rem',
                border: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
                fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'inherit',
              }}
            >
              {hostels.map((h: any) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.type})
                </option>
              ))}
            </select>
          </div>
        </motion.div>
      )}

      {/* KPI Stats Bar for Selected Hostel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ ...cardStyle, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
            backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
            color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <BedDouble style={{ width: '1.5rem', height: '1.5rem' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rooms in Hostel</p>
            <h4 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)' }}>{rooms.length}</h4>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
            backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5',
            color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Users style={{ width: '1.5rem', height: '1.5rem' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bed Occupancy</p>
            <h4 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {selectedHostelStats.occupiedBeds} / {selectedHostelStats.totalBeds} ({selectedHostelStats.occupancyPct}%)
            </h4>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
            backgroundColor: isDark ? 'rgba(234,88,12,0.15)' : '#fff7ed',
            color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <UserCheck style={{ width: '1.5rem', height: '1.5rem' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Vacancies</p>
            <h4 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {selectedHostelStats.availableBeds} beds
            </h4>
          </div>
        </div>
      </div>

      {/* Omni-Filter Bar for Selected Hostel */}
      <div style={{ ...cardStyle, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Year Filter Pills */}
          <div style={{
            display: 'flex', padding: '0.25rem', borderRadius: '0.625rem',
            backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
            gap: '0.25rem',
          }}>
            {(['ALL', '1', '2', '3', '4'] as const).map((y) => (
              <button
                key={y}
                onClick={() => setYearFilter(y)}
                style={{
                  padding: '0.375rem 0.75rem', borderRadius: '0.5rem', border: 'none',
                  backgroundColor: yearFilter === y ? 'var(--bg-card)' : 'transparent',
                  color: yearFilter === y ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.75rem', fontWeight: yearFilter === y ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: yearFilter === y ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {y === 'ALL' ? 'All Years' : `Yr ${y}`}
              </button>
            ))}
          </div>

          {/* Room Status Filter */}
          <div style={{
            display: 'flex', padding: '0.25rem', borderRadius: '0.625rem',
            backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
            gap: '0.25rem',
          }}>
            {[
              { key: 'ALL', label: 'All Status' },
              { key: 'AVAILABLE', label: 'Available 🟢' },
              { key: 'FULL', label: 'Occupied 🔴' },
              { key: 'BLOCKED', label: 'Blocked 🟣' },
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => setStatusFilter(st.key)}
                style={{
                  padding: '0.375rem 0.75rem', borderRadius: '0.5rem', border: 'none',
                  backgroundColor: statusFilter === st.key ? 'var(--bg-card)' : 'transparent',
                  color: statusFilter === st.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.75rem', fontWeight: statusFilter === st.key ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: statusFilter === st.key ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Omni Search Box */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search style={{
            position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
            width: '1.125rem', height: '1.125rem', color: 'var(--text-muted)',
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Omni-Search: Search by Room Number (e.g. 101), Student Name, or USN (e.g. 1BM23CS...)"
            style={{
              width: '100%', padding: '0.625rem 1rem 0.625rem 2.625rem',
              borderRadius: '0.75rem', border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)',
              fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Room Grid */}
      {roomsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 style={{ width: '2.5rem', height: '2.5rem', animation: 'spin 1s linear infinite', color: '#2563eb' }} />
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No rooms found in this hostel"
          description="Try relaxing your filters or check room configurations."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setYearFilter('ALL');
              setStatusFilter('ALL');
              setSearchQuery('');
            },
          }}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}>
          {rooms.map((room) => {
            const hostelName = room.floor?.block?.hostel?.name || 'BMSET Hostel';
            const blockName = room.floor?.block?.name || 'Block';
            const floorNum = room.floor?.floorNumber !== undefined ? `Floor ${room.floor?.floorNumber}` : '';
            const isBlocked = room.status === 'BLOCKED';
            const isOccupied = room.occupiedBeds >= room.capacity;

            return (
              <motion.div
                key={room.id}
                layout
                style={{
                  ...cardStyle,
                  display: 'flex', flexDirection: 'column',
                  border: isBlocked ? '1.5px solid #a855f7' : '1px solid var(--border-primary)',
                }}
              >
                {/* Room Header */}
                <div style={{
                  padding: '1.25rem', borderBottom: '1px solid var(--border-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.625rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem',
                      backgroundColor: isBlocked
                        ? (isDark ? 'rgba(168,85,247,0.15)' : '#faf5ff')
                        : isOccupied
                        ? (isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2')
                        : (isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff'),
                      color: isBlocked ? '#9333ea' : isOccupied ? '#dc2626' : '#2563eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <BedDouble style={{ width: '1.25rem', height: '1.25rem' }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'nowrap' }}>
                        <h3 style={{
                          fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)',
                          whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          Room {room.roomNumber}
                        </h3>
                        <span style={{
                          fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.4rem',
                          borderRadius: '9999px', backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          {room.type}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {hostelName} · {blockName} · {floorNum}
                      </p>
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <StatusBadge status={room.status} />
                  </div>
                </div>

                {/* Blocked Alert Banner if Room is Blocked */}
                {isBlocked && (
                  <div style={{
                    padding: '0.625rem 1rem', fontSize: '0.75rem',
                    backgroundColor: isDark ? 'rgba(168,85,247,0.15)' : '#f3e8ff',
                    color: isDark ? '#d8b4fe' : '#7e22ce',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Lock style={{ width: '0.75rem', height: '0.75rem' }} />
                      {room.blockedReason || 'Blocked by Admin'}
                    </span>
                    <button
                      onClick={() => hostelApi.unblockRoom(room.id).then(() => {
                        queryClient.invalidateQueries({ queryKey: ['rooms-allocations'] });
                        toast.success('Room unblocked!');
                      })}
                      style={{
                        padding: '0.2rem 0.5rem', borderRadius: '0.25rem', border: 'none',
                        backgroundColor: '#9333ea', color: 'white', fontSize: '0.6875rem',
                        fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Unblock
                    </button>
                  </div>
                )}

                {/* Bed Slots & Resident Allocation Roster */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                      Resident Allocations ({room.allocations?.length || 0} / {room.capacity} Beds)
                    </span>
                    {room.feePerSemester && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{Number(room.feePerSemester).toLocaleString('en-IN')}/sem
                      </span>
                    )}
                  </div>

                  {Array.from({ length: room.capacity }).map((_, idx) => {
                    const bedNum = idx + 1;
                    const allocation = room.allocations?.find((a: any) => a.bedNumber === bedNum);

                    if (allocation) {
                      const student = allocation.student;
                      const studentUser = student?.user;
                      const fullName = studentUser
                        ? `${studentUser.firstName || ''} ${studentUser.lastName || ''}`.trim()
                        : 'Resident Student';
                      const initials = fullName
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || 'ST';

                      return (
                        <div
                          key={bedNum}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.625rem', borderRadius: '0.75rem',
                            backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                            border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe'}`,
                            gap: '0.5rem',
                          }}
                        >
                          <button
                            onClick={() => setSelectedResident({ allocation, room })}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.625rem',
                              background: 'none', border: 'none', cursor: 'pointer',
                              textAlign: 'left', padding: 0, flex: 1, minWidth: 0,
                            }}
                          >
                            <div style={{
                              width: '2rem', height: '2rem', borderRadius: '9999px',
                              backgroundColor: '#2563eb', color: 'white', fontSize: '0.6875rem',
                              fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {initials}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{
                                fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>
                                Bed #{bedNum}: {fullName}
                              </p>
                              <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                                {student?.usn || 'No USN'} {student?.year ? `· Year ${student.year}` : ''}
                              </p>
                            </div>
                          </button>

                          {/* 1-Click Vacate Button */}
                          <button
                            onClick={() => setVacateTarget({
                              allocationId: allocation.id,
                              studentName: fullName,
                              roomNumber: room.roomNumber,
                              bedNumber: bedNum,
                            })}
                            style={{
                              padding: '0.25rem 0.5rem', borderRadius: '0.375rem', border: 'none',
                              backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2',
                              color: isDark ? '#fca5a5' : '#dc2626',
                              fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                            }}
                          >
                            Vacate
                          </button>
                        </div>
                      );
                    }

                    // Available Open Bed Slot
                    return (
                      <div
                        key={bedNum}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.625rem', borderRadius: '0.75rem',
                          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                          border: '1px dashed var(--border-primary)',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Bed #{bedNum} · Open
                        </span>
                        <button
                          onClick={() => setAllocateModal({
                            roomId: room.id,
                            roomNumber: room.roomNumber,
                            bedNumber: bedNum,
                            hostelName,
                          })}
                          disabled={isBlocked}
                          style={{
                            padding: '0.25rem 0.625rem', borderRadius: '0.375rem', border: 'none',
                            background: isBlocked
                              ? 'var(--bg-tertiary)'
                              : 'linear-gradient(135deg, #1e40af, #2563eb)',
                            color: isBlocked ? 'var(--text-muted)' : 'white',
                            fontSize: '0.6875rem', fontWeight: 700,
                            cursor: isBlocked ? 'not-allowed' : 'pointer',
                          }}
                        >
                          + Allocate Student
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Resident Details Drawer / Modal */}
      <AnimatePresence>
        {selectedResident && (
          <ResidentDetailsModal
            resident={selectedResident}
            onClose={() => setSelectedResident(null)}
            onVacate={() => {
              setVacateTarget({
                allocationId: selectedResident.allocation.id,
                studentName: selectedResident.allocation.student?.user?.firstName || 'Student',
                roomNumber: selectedResident.room.roomNumber,
                bedNumber: selectedResident.allocation.bedNumber,
              });
            }}
          />
        )}

        {/* Allocate Student Modal */}
        {allocateModal && (
          <AllocateStudentModal
            target={allocateModal}
            onClose={() => setAllocateModal(null)}
          />
        )}

        {/* Vacate Confirmation Modal */}
        {vacateTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setVacateTarget(null)}
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
                width: '100%', maxWidth: '26rem', borderRadius: '1rem',
                border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)',
                boxShadow: '0 20px 25px rgba(0,0,0,0.2)', padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem',
                  backgroundColor: 'rgba(239,68,68,0.15)', color: '#dc2626',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertTriangle style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Vacate Bed #{vacateTarget.bedNumber}?
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Room {vacateTarget.roomNumber} · {vacateTarget.studentName}
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Are you sure you want to deallocate <strong>{vacateTarget.studentName}</strong> from this bed? The bed slot will immediately return to the available inventory pool.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setVacateTarget(null)}
                  style={{
                    flex: 1, padding: '0.625rem', borderRadius: '0.625rem',
                    border: '1px solid var(--border-primary)', backgroundColor: 'transparent',
                    color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={vacateMutation.isPending}
                  onClick={() => vacateMutation.mutate(vacateTarget.allocationId)}
                  style={{
                    flex: 1, padding: '0.625rem', borderRadius: '0.625rem', border: 'none',
                    backgroundColor: '#dc2626', color: 'white', fontSize: '0.875rem',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  }}
                >
                  {vacateMutation.isPending ? <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} /> : 'Confirm Vacate'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Academic Year Rollover Modal */}
        {showRolloverModal && (
          <AcademicRolloverModal
            onClose={() => setShowRolloverModal(false)}
            onConfirm={() => rolloverMutation.mutate()}
            isLoading={rolloverMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================================== */
/*  Resident Details Modal / Drawer                                       */
/* ====================================================================== */

function ResidentDetailsModal({
  resident,
  onClose,
  onVacate,
}: {
  resident: { allocation: RoomAllocation; room: Room };
  onClose: () => void;
  onVacate: () => void;
}) {
  const student = resident.allocation.student;
  const user = student?.user;
  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Resident';

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
          width: '100%', maxWidth: '30rem', borderRadius: '1rem',
          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)',
          boxShadow: '0 20px 25px rgba(0,0,0,0.2)', padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '3rem', height: '3rem', borderRadius: '9999px',
              backgroundColor: '#2563eb', color: 'white', fontSize: '1rem',
              fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {fullName}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Room {resident.room.roomNumber} · Bed #{resident.allocation.bedNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-tertiary)' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>USN</span>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                {student?.usn || 'N/A'}
              </p>
            </div>

            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-tertiary)' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</span>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                {student?.department || 'N/A'}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-tertiary)' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic Year</span>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                Year {student?.year || 1}
              </p>
            </div>

            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-tertiary)' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Allocated Since</span>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                {new Date(resident.allocation.allocatedFrom).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <Mail style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
              <span>{user?.email || 'N/A'}</span>
            </div>
            {user?.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <Phone style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                <span>{user.phone}</span>
              </div>
            )}
            {student?.guardianPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <Users style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                <span>Guardian: {student.guardianName || 'Parent'} ({student.guardianPhone})</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: '0.625rem', borderRadius: '0.625rem',
              border: '1px solid var(--border-primary)', backgroundColor: 'transparent',
              color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onVacate();
            }}
            style={{
              flex: 1, padding: '0.625rem', borderRadius: '0.625rem', border: 'none',
              backgroundColor: '#dc2626', color: 'white', fontSize: '0.875rem',
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            Vacate Resident
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ====================================================================== */
/*  Quick Allocate Student Modal                                          */
/* ====================================================================== */

function AllocateStudentModal({
  target,
  onClose,
}: {
  target: { roomId: string; roomNumber: string; bedNumber: number; hostelName?: string };
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Fetch unallocated students
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['unallocated-students', studentSearch],
    queryFn: () => userApi.getStudents({ allocated: 'false', search: studentSearch.trim() || undefined, limit: '50' }),
  });
  const unallocatedStudents: any[] = (studentsData?.data as any)?.data || [];

  const mutation = useMutation({
    mutationFn: () =>
      operationsApi.allocate({
        studentId: selectedStudentId,
        roomId: target.roomId,
        bedNumber: target.bedNumber,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(`Student successfully allocated to Room ${target.roomNumber}, Bed #${target.bedNumber}!`);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Allocation failed');
    },
  });

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
          width: '100%', maxWidth: '30rem', borderRadius: '1rem',
          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)',
          boxShadow: '0 20px 25px rgba(0,0,0,0.2)', padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem',
              backgroundColor: 'rgba(37,99,235,0.15)', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserPlus style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Allocate Student to Bed #{target.bedNumber}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Room {target.roomNumber} · {target.hostelName || 'Hostel'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        {/* Search unallocated students */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search style={{
            position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
            width: '1rem', height: '1rem', color: 'var(--text-muted)',
          }} />
          <input
            type="text"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="Search unallocated students by USN or Name..."
            style={{
              width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: '0.5rem', border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)',
              fontSize: '0.8125rem', outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Student list */}
        <div style={{
          maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-primary)',
          borderRadius: '0.625rem', padding: '0.375rem', marginBottom: '1.25rem',
          display: 'flex', flexDirection: 'column', gap: '0.25rem',
        }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
              <Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : unallocatedStudents.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              No unallocated students match your search.
            </p>
          ) : (
            unallocatedStudents.map((s) => {
              const name = s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() : 'Student';
              const isSelected = selectedStudentId === s.id;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  style={{
                    padding: '0.5rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(37,99,235,0.15)' : 'transparent',
                    border: isSelected ? '1px solid #2563eb' : '1px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {name}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                      {s.usn || 'No USN'} · Year {s.year} · {s.department}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#2563eb' }} />}
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
            type="button"
            disabled={!selectedStudentId || mutation.isPending}
            onClick={() => mutation.mutate()}
            style={{
              flex: 1, padding: '0.625rem', borderRadius: '0.625rem', border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #2563eb)',
              color: 'white', fontSize: '0.875rem', fontWeight: 700,
              cursor: (!selectedStudentId || mutation.isPending) ? 'not-allowed' : 'pointer',
              opacity: (!selectedStudentId || mutation.isPending) ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {mutation.isPending ? <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} /> : 'Assign Bed'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ====================================================================== */
/*  Academic Year Rollover Modal (Stage 4.3)                              */
/* ====================================================================== */

function AcademicRolloverModal({
  onClose,
  onConfirm,
  isLoading,
}: {
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const canProceed = confirmationInput === 'CONFIRM ROLLOVER';

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
          width: '100%', maxWidth: '32rem', borderRadius: '1rem',
          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)',
          boxShadow: '0 20px 25px rgba(0,0,0,0.2)', padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
            backgroundColor: 'rgba(234,88,12,0.15)', color: '#ea580c',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RefreshCw style={{ width: '1.5rem', height: '1.5rem' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Institutional Academic Year Rollover
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Stage 4.3: Bulk Graduation Checkout & Academic Cohort Promotion
            </p>
          </div>
        </div>

        <div style={{
          padding: '1rem', borderRadius: '0.75rem',
          backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
          fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Automated Actions in Transaction:</p>
          <p>1. <strong>Graduation Checkout:</strong> All Year 4 residents are marked as <code>VACATED</code> and their hostel beds are immediately released.</p>
          <p>2. <strong>Cohort Promotion:</strong> Year 3 students promote to Year 4, Year 2 promote to Year 3, and Year 1 promote to Year 2.</p>
          <p>3. <strong>Audit Trail:</strong> Immutable audit record logged with actor ID, timestamp, and counts.</p>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.375rem' }}>
            To prevent accidental execution, type <code style={{ color: '#ea580c' }}>CONFIRM ROLLOVER</code> below:
          </label>
          <input
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder="CONFIRM ROLLOVER"
            style={{
              width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.625rem',
              border: '1.5px solid var(--border-primary)', backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 700,
              fontFamily: 'monospace', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
            type="button"
            disabled={!canProceed || isLoading}
            onClick={onConfirm}
            style={{
              flex: 1, padding: '0.625rem', borderRadius: '0.625rem', border: 'none',
              backgroundColor: canProceed ? '#ea580c' : 'var(--bg-tertiary)',
              color: canProceed ? 'white' : 'var(--text-muted)',
              fontSize: '0.875rem', fontWeight: 700,
              cursor: canProceed ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {isLoading ? <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} /> : 'Execute Rollover'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
