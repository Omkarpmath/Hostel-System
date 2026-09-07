import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed, Calendar, Search, Download,
  RefreshCw, CheckCircle2,
} from 'lucide-react';
import { messEntryApi } from '@/api/messEntry.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useTheme } from '@/providers/ThemeProvider';

export const MessHistoryPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch entries for selected date
  const {
    data: entriesData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['mess-entries-history', selectedDate],
    queryFn: () => messEntryApi.getEntries({ date: selectedDate, limit: 500 }),
    refetchInterval: 15000,
  });

  const rawEntries: any[] = (entriesData?.data as any)?.data || [];

  // Filter entries client-side
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return rawEntries;
    const q = searchQuery.toLowerCase().trim();
    return rawEntries.filter(
      (e) =>
        e.studentName?.toLowerCase().includes(q) ||
        e.usn?.toLowerCase().includes(q) ||
        e.hostelName?.toLowerCase().includes(q) ||
        e.roomNumber?.toLowerCase().includes(q)
    );
  }, [rawEntries, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredEntries.length === 0) return;

    const headers = ['Time', 'Student Name', 'USN', 'Hostel', 'Room Number', 'Mess Facility'];
    const rows = filteredEntries.map((e) => [
      new Date(e.scannedAt).toLocaleTimeString(),
      `"${e.studentName}"`,
      e.usn,
      `"${e.hostelName}"`,
      e.roomNumber,
      `"${e.messName || 'Mess'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mess_entries_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
    border: '1px solid var(--border-primary)',
    borderRadius: '0.625rem',
    padding: '0.5rem 0.875rem',
    color: 'var(--text-primary)',
    fontSize: '0.8125rem',
    fontFamily: 'inherit',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Mess Entry History"
        description="Daily student dining entries, real-time scans, and attendance log reports"
        breadcrumbs={[
          { label: 'Dashboard', href: '/security/dashboard' },
          { label: 'Mess Entry History' },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.625rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw
                style={{ width: '0.875rem', height: '0.875rem' }}
                className={isFetching ? 'animate-spin' : ''}
              />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredEntries.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.625rem',
                backgroundColor: '#d97706',
                border: 'none',
                color: 'white',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: filteredEntries.length === 0 ? 'not-allowed' : 'pointer',
                opacity: filteredEntries.length === 0 ? 0.6 : 1,
              }}
            >
              <Download style={{ width: '0.875rem', height: '0.875rem' }} />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div
        style={{
          ...cardStyle,
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: '1' }}>
          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar style={{ width: '1rem', height: '1rem', color: 'var(--text-muted)' }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '360px' }}>
            <Search
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '0.875rem',
                height: '0.875rem',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search by student, USN, or hostel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, width: '100%', paddingLeft: '2.25rem' }}
            />
          </div>
        </div>

        {/* Counter Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Verified Admissions:</span>
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7',
              color: '#d97706',
              fontWeight: 800,
            }}
          >
            {filteredEntries.length}
          </span>
        </div>
      </div>

      {/* Entries Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Loading dining entries...
          </div>
        ) : filteredEntries.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-primary)',
                    color: 'var(--text-muted)',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  }}
                >
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Time</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Student Name</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>USN</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Hostel</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Room</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, idx) => (
                  <tr
                    key={entry.id || idx}
                    style={{
                      borderBottom: idx < filteredEntries.length - 1 ? '1px solid var(--border-primary)' : 'none',
                    }}
                  >
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' }}>
                      {new Date(entry.scannedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {entry.studentName}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontFamily: 'monospace', color: '#d97706', fontWeight: 700 }}>
                      {entry.usn}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)' }}>
                      {entry.hostelName}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)' }}>
                      {entry.roomNumber}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(22, 163, 74, 0.12)',
                          color: '#16a34a',
                        }}
                      >
                        <CheckCircle2 style={{ width: '0.75rem', height: '0.75rem' }} />
                        ADMITTED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={UtensilsCrossed}
            title="No entry records found"
            description={
              searchQuery
                ? `No entries match "${searchQuery}" for ${selectedDate}.`
                : `No student dining admissions recorded on ${selectedDate}.`
            }
          />
        )}
      </motion.div>
    </div>
  );
};

export default MessHistoryPage;
