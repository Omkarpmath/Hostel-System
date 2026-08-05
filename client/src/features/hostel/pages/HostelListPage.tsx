import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { hostelApi } from '@/api/hostel.api';
import { userApi } from '@/api/user.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import {
  Building2,
  Plus,
  X,
  Loader2,
  MapPin,
  Users,
  BedDouble,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import type { Hostel } from '@/types';
import { useAuth } from '@/providers/AuthProvider';

const previewHostels: Hostel[] = [
  {
    id: 'hostel-demo-001',
    name: 'BMSCE Boys Hostel',
    type: 'BOYS',
    address: 'Basavanagudi, Bengaluru',
    description: 'Local browser preview record',
    isActive: true,
    allowedYears: [1, 2, 3, 4],
    createdAt: '2026-08-05T00:00:00.000Z',
    updatedAt: '2026-08-05T00:00:00.000Z',
    blocks: [{
      id: 'block-demo-001', hostelId: 'hostel-demo-001', name: 'Block A', isActive: true,
      floors: [{
        id: 'floor-demo-001', blockId: 'block-demo-001', floorNumber: 2, name: 'Second Floor',
        rooms: [{
          id: 'room-demo-001', floorId: 'floor-demo-001', roomNumber: 'A-204', capacity: 2, occupiedBeds: 1,
          type: 'DOUBLE', status: 'PARTIALLY_OCCUPIED', feePerSemester: 48000, isActive: true, version: 1,
        }],
      }],
    }],
  },
];

export function HostelListPage() {
  const { isPreviewMode } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedHostel, setExpandedHostel] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => hostelApi.getAll(),
    enabled: !isPreviewMode,
  });

  const hostels: Hostel[] = isPreviewMode ? previewHostels : (data?.data as any)?.data || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hostel Management"
        description="Create and manage hostels, blocks, floors, and rooms"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Hostels' },
        ]}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white gradient-bg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create Hostel
          </button>
        }
      />

      {isLoading ? (
        <PageSkeleton />
      ) : hostels.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No hostels created"
          description="Get started by creating your first hostel. You can add blocks, floors, and rooms to it."
          action={{
            label: 'Create Hostel',
            onClick: () => setShowCreate(true),
          }}
        />
      ) : (
        <div className="space-y-4">
          {hostels.map((hostel) => (
            <HostelCard
              key={hostel.id}
              hostel={hostel}
              isExpanded={expandedHostel === hostel.id}
              onToggle={() => setExpandedHostel(expandedHostel === hostel.id ? null : hostel.id)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateHostelModal onClose={() => setShowCreate(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function HostelCard({ hostel, isExpanded, onToggle }: { hostel: Hostel; isExpanded: boolean; onToggle: () => void }) {
  const totalRooms = hostel.blocks?.reduce(
    (acc, block) => acc + (block.floors?.reduce((a, floor) => a + (floor.rooms?.length || 0), 0) || 0), 0
  ) || 0;

  const totalBeds = hostel.blocks?.reduce(
    (acc, block) => acc + (block.floors?.reduce(
      (a, floor) => a + (floor.rooms?.reduce((r, room) => r + room.capacity, 0) || 0), 0
    ) || 0), 0
  ) || 0;

  return (
    <motion.div
      layout
      className="glass-card overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center gap-4 text-left hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
      >
        <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
          <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {hostel.name}
            </h3>
            <StatusBadge status={hostel.isActive ? 'ACTIVE' : 'INACTIVE'} />
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {hostel.type}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {hostel.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {hostel.address}
              </span>
            )}
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              {totalRooms} rooms
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {totalBeds} beds
            </span>
            {hostel.allowedYears?.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
                Year {hostel.allowedYears.join(', ')}
              </span>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t overflow-hidden"
            style={{ borderColor: 'var(--border-primary)' }}
          >
            <div className="p-6">
              {hostel.blocks && hostel.blocks.length > 0 ? (
                <div className="space-y-4">
                  {hostel.blocks.map((block) => (
                    <div key={block.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--border-primary)' }}>
                      <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{block.name}</h4>
                      {block.floors && block.floors.length > 0 ? (
                        block.floors.map((floor) => (
                          <div key={floor.id} className="ml-4 mb-3">
                            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                              {floor.name} (Floor {floor.floorNumber})
                            </p>
                            {floor.rooms && floor.rooms.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 ml-4">
                                {floor.rooms.map((room) => (
                                  <div
                                    key={room.id}
                                    className="p-3 rounded-lg border text-center text-sm"
                                    style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                                  >
                                    <p className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                                      {room.roomNumber}
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                      {room.occupiedBeds}/{room.capacity} beds
                                    </p>
                                    <StatusBadge status={room.status} className="mt-1.5" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs ml-4" style={{ color: 'var(--text-muted)' }}>No rooms</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs ml-4" style={{ color: 'var(--text-muted)' }}>No floors</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No blocks created yet</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CreateHostelModal({ onClose }: { onClose: () => void }) {
  const { isPreviewMode } = useAuth();
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

  const { data: wardensData } = useQuery({
    queryKey: ['wardens'],
    queryFn: () => userApi.getWardens(),
    enabled: !isPreviewMode,
  });

  const wardens = (wardensData?.data as any)?.data || [];

  const mutation = useMutation({
    mutationFn: () => {
      if (isPreviewMode) {
        return Promise.reject(new Error('Creating hostels is unavailable in the local UI preview.'));
      }
      return hostelApi.create(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create hostel');
    },
  });

  const toggleYear = (year: number) => {
    setForm((prev) => ({
      ...prev,
      allowedYears: prev.allowedYears.includes(year)
        ? prev.allowedYears.filter((y) => y !== year)
        : [...prev.allowedYears, year],
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--overlay)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg rounded-2xl border shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Create Hostel</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Add a new hostel to the system</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
            <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          className="p-6 space-y-5"
        >
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Hostel Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Vishveshwaraya Boys Hostel"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'BOYS' | 'GIRLS' })}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              >
                <option value="BOYS">Boys</option>
                <option value="GIRLS">Girls</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Warden</label>
              <select
                value={form.wardenId}
                onChange={(e) => setForm({ ...form, wardenId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              >
                <option value="">Select warden</option>
                {wardens.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Allowed Years *</label>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Select which year students can be allotted to this hostel</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => toggleYear(year)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${form.allowedYears.includes(year)
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                      : ''
                    }`}
                  style={
                    !form.allowedYears.includes(year)
                      ? { borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }
                      : undefined
                  }
                >
                  {year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Hostel address"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium border transition-colors"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !form.name || form.allowedYears.length === 0}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : 'Create Hostel'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
