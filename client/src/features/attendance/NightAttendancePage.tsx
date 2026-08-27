import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { attendanceApi } from '@/api/attendance.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { useTheme } from '@/providers/ThemeProvider';
import {
  ScanLine, StopCircle, CheckCircle2, AlertTriangle,
  XCircle, Users, UserCheck, CalendarOff, Shield,
} from 'lucide-react';

type ScanResult = {
  status: 'PRESENT' | 'ON_LEAVE' | 'ALREADY_MARKED' | 'WRONG_HOSTEL' | 'INVALID' | 'ERROR';
  message: string;
  studentName?: string;
  usn?: string;
};

const statusConfig: Record<string, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  PRESENT: { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)', icon: CheckCircle2 },
  ON_LEAVE: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', icon: CalendarOff },
  ALREADY_MARKED: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', icon: UserCheck },
  WRONG_HOSTEL: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', icon: XCircle },
  INVALID: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', icon: XCircle },
  ERROR: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', icon: AlertTriangle },
};

export function NightAttendancePage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const lastScanRef = useRef<string>('');
  const scanCooldownRef = useRef(false);

  // Check for active session
  const { data: sessionData, refetch: refetchSession } = useQuery({
    queryKey: ['active-attendance-session'],
    queryFn: () => attendanceApi.getActiveSession(),
    retry: 1,
  });

  const activeSession = (sessionData?.data as any)?.data;

  const startMutation = useMutation({
    mutationFn: () => attendanceApi.startSession(),
    onSuccess: () => {
      refetchSession();
      setScanning(true);
    },
  });

  const scanMutation = useMutation({
    mutationFn: (token: string) => attendanceApi.scanStudent(token),
    onSuccess: (res) => {
      const result = (res.data as any)?.data as ScanResult;
      setScanResult(result);
      if (result.status === 'PRESENT') {
        setScannedCount((c) => c + 1);
      }
      // Auto-clear result after 2.5 seconds
      setTimeout(() => {
        setScanResult(null);
        lastScanRef.current = '';
      }, 2500);
    },
    onError: () => {
      setScanResult({ status: 'ERROR', message: 'Failed to process scan.' });
      setTimeout(() => setScanResult(null), 2500);
    },
  });

  const endMutation = useMutation({
    mutationFn: () => attendanceApi.endSession(),
    onSuccess: (res) => {
      const data = (res.data as any)?.data;
      setSummaryData(data?.summary);
      setShowSummary(true);
      setScanning(false);
      stopScanner();
      queryClient.invalidateQueries({ queryKey: ['active-attendance-session'] });
    },
  });

  const [cameraBlocked, setCameraBlocked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Scanner logic ────────────────────────────────────────
  const handleQrResult = useCallback((decodedText: string) => {
    if (scanCooldownRef.current) return;
    if (decodedText === lastScanRef.current) return;

    let token = decodedText;
    const match = decodedText.match(/\/verify\/student\/([a-f0-9-]+)/i);
    if (match) token = match[1];

    lastScanRef.current = decodedText;
    scanCooldownRef.current = true;
    setTimeout(() => { scanCooldownRef.current = false; }, 3000);

    scanMutation.mutate(token);
  }, [scanMutation]);

  const startScanner = useCallback(async () => {
    if (scannerRef.current || !scannerContainerRef.current) return;

    const { Html5Qrcode } = await import('html5-qrcode');
    const scanner = new Html5Qrcode('qr-scanner-container');
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => handleQrResult(decodedText),
        () => { /* ignore scan errors */ }
      );
      setCameraBlocked(false);
    } catch (err: any) {
      const msg = String(err?.message || err || '').toLowerCase();
      const isHttpBlock = window.location.protocol === 'http:';
      setCameraBlocked(true);
      setScanResult({
        status: 'ERROR',
        message: isHttpBlock
          ? 'Camera requires HTTPS. Use the "Scan from Photo" button below, or access via https://.'
          : msg.includes('denied') || msg.includes('dismissed')
            ? 'Camera permission denied. Please allow camera access in your browser/device settings, then reload.'
            : 'Could not access camera. Use "Scan from Photo" below.',
      });
    }
  }, [handleQrResult]);

  /** File-based fallback: user takes a photo / picks an image of the QR */
  const handleFileScan = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let scanner = scannerRef.current;
      let createdHere = false;
      if (!scanner) {
        const { Html5Qrcode } = await import('html5-qrcode');
        scanner = new Html5Qrcode('qr-scanner-container');
        createdHere = true;
      }
      const result = await scanner.scanFile(file, /* showImage */ false);
      handleQrResult(result);
      if (createdHere) {
        scanner.clear();
      }
    } catch {
      setScanResult({ status: 'ERROR', message: 'Could not read QR from this image. Try again.' });
      setTimeout(() => setScanResult(null), 2500);
    }
    // Reset so the same file can be selected again
    e.target.value = '';
  }, [handleQrResult]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      // isScanning may not exist in all versions; guard both stop and clear
      (scanner.isScanning ? scanner.stop() : Promise.resolve())
        .catch(() => {})
        .finally(() => { try { scanner.clear(); } catch {} });
    }
  }, []);

  // Start scanner when scanning mode activates
  useEffect(() => {
    if (scanning) {
      // Small delay to let the DOM render the scanner container
      const timer = setTimeout(() => startScanner(), 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [scanning, startScanner, stopScanner]);

  // Resume scanning if there's an active session on page load
  useEffect(() => {
    if (activeSession && activeSession.status === 'ACTIVE' && !scanning && !showSummary) {
      setScannedCount(activeSession._count?.records || 0);
      setScanning(true);
    }
  }, [activeSession]);

  // Cleanup on unmount
  useEffect(() => () => stopScanner(), [stopScanner]);

  const handleStart = () => startMutation.mutate();
  const handleEnd = () => {
    if (window.confirm('End tonight\'s attendance session? This cannot be undone.')) {
      endMutation.mutate();
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  };

  // ─── Summary screen ───────────────────────────────────────
  if (showSummary && summaryData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader
          title="Attendance Complete"
          description="Tonight's night attendance session has been finalized"
          breadcrumbs={[{ label: 'Dashboard', href: '/security/dashboard' }, { label: 'Night Attendance' }]}
        />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ ...cardStyle, padding: '2rem', textAlign: 'center' }}>
          <CheckCircle2 style={{ width: '4rem', height: '4rem', color: '#16a34a', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Session Completed
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {activeSession?.hostel?.name || 'Hostel'} — {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', maxWidth: '500px', margin: '0 auto' }}>
            {[
              { label: 'Total', value: summaryData.total, color: '#3b82f6' },
              { label: 'Present', value: summaryData.present, color: '#16a34a' },
              { label: 'On Leave', value: summaryData.onLeave, color: '#f59e0b' },
              { label: 'Absent', value: summaryData.absent, color: '#dc2626' },
            ].map((s) => (
              <div key={s.label} style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setShowSummary(false); setSummaryData(null); }}
            style={{
              marginTop: '2rem', padding: '0.75rem 2rem', borderRadius: '0.75rem', border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #2563eb)', color: 'white',
              fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Not assigned state ───────────────────────────────────
  if (sessionData && !activeSession && !startMutation.isPending && startMutation.isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader
          title="Night Attendance"
          description="You are not assigned to any hostel"
          breadcrumbs={[{ label: 'Dashboard', href: '/security/dashboard' }, { label: 'Night Attendance' }]}
        />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ ...cardStyle, padding: '3rem', textAlign: 'center' }}>
          <Shield style={{ width: '3rem', height: '3rem', color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Not Assigned to a Hostel
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Contact the admin to get assigned to a hostel before starting attendance.
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Main view ────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Night Attendance"
        description={scanning ? `Scanning — ${activeSession?.hostel?.name || 'Hostel'}` : 'Start the nightly attendance session'}
        breadcrumbs={[{ label: 'Dashboard', href: '/security/dashboard' }, { label: 'Night Attendance' }]}
      />

      {/* Controls */}
      {!scanning ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, padding: '3rem', textAlign: 'center' }}>
          <ScanLine style={{ width: '3.5rem', height: '3.5rem', color: '#3b82f6', margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Ready to Start
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Begin tonight's attendance by scanning student QR codes. The camera will open automatically.
          </p>
          <button
            onClick={handleStart}
            disabled={startMutation.isPending}
            style={{
              padding: '0.875rem 2.5rem', borderRadius: '0.75rem', border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)', color: 'white',
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              opacity: startMutation.isPending ? 0.7 : 1,
            }}
          >
            {startMutation.isPending ? 'Starting...' : 'Start Night Attendance'}
          </button>
          {startMutation.isError && (
            <p style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '1rem' }}>
              {(startMutation.error as any)?.response?.data?.message || 'Failed to start session. Are you assigned to a hostel?'}
            </p>
          )}
        </motion.div>
      ) : (
        <>
          {/* Scanner + live counter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            {/* Scanned counter bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                ...cardStyle,
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Scanned</span>
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>{scannedCount}</span>
            </motion.div>

            {/* QR Scanner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ ...cardStyle, overflow: 'hidden' }}
            >
              <div
                id="qr-scanner-container"
                ref={scannerContainerRef}
                style={{
                  width: '100%',
                  minHeight: '300px',
                  backgroundColor: isDark ? '#0a0a0a' : '#111',
                }}
              />
            </motion.div>

            {/* Scan result overlay */}
            <AnimatePresence>
              {scanResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{
                    ...cardStyle,
                    padding: '1.25rem 1.5rem',
                    backgroundColor: statusConfig[scanResult.status]?.bg || 'var(--bg-card)',
                    border: `2px solid ${statusConfig[scanResult.status]?.color || 'var(--border-primary)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  {(() => {
                    const Icon = statusConfig[scanResult.status]?.icon || AlertTriangle;
                    const color = statusConfig[scanResult.status]?.color || '#dc2626';
                    return <Icon style={{ width: '2rem', height: '2rem', color, flexShrink: 0 }} />;
                  })()}
                  <div style={{ flex: 1 }}>
                    {scanResult.studentName && (
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {scanResult.studentName}
                      </div>
                    )}
                    {scanResult.usn && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {scanResult.usn}
                      </div>
                    )}
                    <div style={{ fontSize: '0.8125rem', color: statusConfig[scanResult.status]?.color, fontWeight: 600, marginTop: '0.25rem' }}>
                      {scanResult.message}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hidden file input for photo-based QR scanning */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileScan}
              style={{ display: 'none' }}
            />

            {/* Scan from Photo fallback — always visible, essential when camera is blocked */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.875rem', borderRadius: '0.75rem', border: '2px solid #3b82f6',
                background: cameraBlocked ? 'linear-gradient(135deg, #1e40af, #2563eb)' : 'transparent',
                color: cameraBlocked ? 'white' : '#3b82f6',
                fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              📷 Scan from Photo
            </button>

            {/* End button */}
            <button
              onClick={handleEnd}
              disabled={endMutation.isPending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.875rem', borderRadius: '0.75rem', border: 'none',
                background: '#dc2626', color: 'white',
                fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                opacity: endMutation.isPending ? 0.7 : 1,
              }}
            >
              <StopCircle style={{ width: '1.25rem', height: '1.25rem' }} />
              {endMutation.isPending ? 'Ending...' : 'End Attendance'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
