import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Building,
  CameraOff,
  Play,
  Pause,
  UtensilsCrossed,
} from 'lucide-react';
import { messEntryApi, MessVerificationResponse } from '../../api/messEntry.api';
import { playScanAudio } from '../../utils/scanAudio';

export const MessEntryPage: React.FC = () => {
  const [scanning, setScanning] = useState(true);
  const [scanResult, setScanResult] = useState<MessVerificationResponse | null>(null);
  const [pendingScanUsn, setPendingScanUsn] = useState<string>('');
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const lastProcessedTokenRef = useRef<string>('');
  const isVerifyingRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch today's stats for this guard's mess
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['mess-entry-stats'],
    queryFn: () => messEntryApi.getStats(),
    staleTime: 60000,
  });

  const stats = statsData?.data?.data;
  const [localCount, setLocalCount] = useState<number | null>(null);

  // Sync initial count when stats load
  useEffect(() => {
    if (stats?.todayCount !== undefined && localCount === null) {
      setLocalCount(stats.todayCount);
    }
  }, [stats?.todayCount, localCount]);

  const displayedCount = localCount ?? stats?.todayCount ?? 0;

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: (token: string) => messEntryApi.verify(token),
    onSuccess: (res) => {
      isVerifyingRef.current = false;
      setPendingScanUsn('');
      const result = res.data.data;
      setScanResult(result);
      playScanAudio(result.status);

      // Instantly update counter with zero network delay
      if (result.todayCount !== undefined) {
        setLocalCount(result.todayCount);
      } else if (result.status === 'ENTRY_ALLOWED') {
        setLocalCount((prev) => (prev !== null ? prev + 1 : 1));
      }

      const duration =
        result.status === 'ENTRY_ALLOWED'
          ? 1200
          : result.status === 'EXPIRED' || result.status === 'NOT_ELIGIBLE' || result.status === 'INVALID'
          ? 2200
          : 1500;

      setTimeout(() => {
        setScanResult(null);
        lastProcessedTokenRef.current = '';
      }, duration);
    },
    onError: () => {
      isVerifyingRef.current = false;
      setPendingScanUsn('');
      playScanAudio('ERROR');
      setScanResult({
        status: 'ERROR',
        message: 'Failed to process mess verification scan.',
      });
      setTimeout(() => {
        setScanResult(null);
        lastProcessedTokenRef.current = '';
      }, 1800);
    },
  });

  const scanMutationRef = useRef(scanMutation);
  useEffect(() => {
    scanMutationRef.current = scanMutation;
  }, [scanMutation]);

  // Handle scanned QR token
  const handleQrResult = useCallback((decodedText: string) => {
    if (isVerifyingRef.current || scanMutationRef.current.isPending) return;
    if (!decodedText || decodedText === lastProcessedTokenRef.current) return;

    let token = decodedText;
    const match = decodedText.match(/\/verify\/student\/([A-Za-z0-9_\-\.]+)/i);
    if (match) token = match[1];

    // Optimistically decode USN for instant visual feedback
    if (token.startsWith('DQR_')) {
      try {
        const payloadBase64 = token.slice(4).split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
        const payloadJson = atob(payloadBase64);
        const parsed = JSON.parse(payloadJson);
        if (parsed?.usn) {
          setPendingScanUsn(parsed.usn);
        }
      } catch {}
    }

    isVerifyingRef.current = true;
    lastProcessedTokenRef.current = decodedText;
    scanMutationRef.current.mutate(token);
  }, []);

  // Gracefully stop scanner and release camera hardware stream
  const stopScanner = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
        } catch (e) {
          console.warn('Error stopping scanner:', e);
        }
        try {
          scanner.clear();
        } catch (e) {}
      }
    } finally {
      if (scannerContainerRef.current) {
        scannerContainerRef.current.innerHTML = '';
      }
      isStoppingRef.current = false;
    }
  }, []);

  // Initialize camera scanner cleanly matching Night Attendance
  const startScanner = useCallback(
    async (cameraId?: string) => {
      if (isStartingRef.current || isStoppingRef.current || scannerRef.current) return;
      if (!scannerContainerRef.current) return;

      isStartingRef.current = true;
      try {
        if (scannerContainerRef.current) {
          scannerContainerRef.current.innerHTML = '';
        }

        const { Html5Qrcode } = await import('html5-qrcode');

        if (!scannerContainerRef.current) {
          isStartingRef.current = false;
          return;
        }

        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id}` })));
          }
        } catch {}

        const scanner = new Html5Qrcode('mess-qr-scanner');
        scannerRef.current = scanner;

        const cameraConfig = cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: 'environment' };

        // Standard 10 FPS with 250x250 viewfinder box (same proven config as Night Attendance)
        await scanner.start(
          cameraConfig,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText: string) => handleQrResult(decodedText),
          () => {}
        );
        setCameraBlocked(false);
      } catch (err) {
        console.warn('Camera failed to start:', err);
        setCameraBlocked(true);
        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch {}
          scannerRef.current = null;
        }
      } finally {
        isStartingRef.current = false;
      }
    },
    [handleQrResult]
  );

  // Manage scanner lifecycle
  useEffect(() => {
    let active = true;
    if (scanning) {
      const timer = setTimeout(() => {
        if (active) {
          startScanner(selectedCameraId);
        }
      }, 150);
      return () => {
        active = false;
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [scanning, selectedCameraId, startScanner, stopScanner]);

  // Clean unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Switch camera if device has multiple
  const handleToggleCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    await stopScanner();
    setSelectedCameraId(nextCamera.id);
  };

  // Image upload fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempId = 'mess-temp-file-scanner';
      let div = document.getElementById(tempId);
      if (!div) {
        div = document.createElement('div');
        div.id = tempId;
        div.style.display = 'none';
        document.body.appendChild(div);
      }
      const scanner = new Html5Qrcode(tempId);
      const decoded = await scanner.scanFile(file, true);
      scanner.clear();
      handleQrResult(decoded);
    } catch {
      setScanResult({
        status: 'INVALID',
        message: 'Could not read any QR code from the uploaded image.',
      });
      setTimeout(() => setScanResult(null), 2000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ENTRY_ALLOWED':
        return 'border-emerald-500/80 bg-emerald-950/90 text-emerald-300';
      case 'NOT_ELIGIBLE':
        return 'border-red-500/80 bg-red-950/90 text-red-300';
      case 'EXPIRED':
        return 'border-amber-500/80 bg-amber-950/90 text-amber-300';
      default:
        return 'border-rose-500/80 bg-rose-950/90 text-rose-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 pb-20">
      <div className="max-w-[540px] mx-auto space-y-4">
        {/* Header Title */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-amber-400" />
              Mess Entry Verification
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {stats?.mess?.name || 'Main Campus Mess'} • Live Dining Scanner
            </p>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              scanning
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
          >
            {scanning ? 'Camera Live' : 'Standby'}
          </span>
        </div>

        {/* 1. Scanned Counter Bar (Matches User Screenshot) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 px-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-slate-100 text-base">Scanned</span>
          </div>
          <span className="text-2xl font-extrabold text-emerald-400">
            {statsLoading && localCount === null ? '...' : displayedCount}
          </span>
        </div>

        {/* 2. QR Scanner Card (Matches User Screenshot) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden relative shadow-2xl">
          {/* Natural video container without artificial zoom or distortion */}
          <div
            id="mess-qr-scanner"
            ref={scannerContainerRef}
            className="w-full min-h-[320px] bg-slate-950"
          />

          {/* Viewfinder Target Frame (Dashed rectangle matching user screenshot) */}
          {scanning && !cameraBlocked && (
            <div
              className={`absolute inset-8 pointer-events-none rounded-2xl border-2 transition-all duration-200 ${
                scanMutation.isPending
                  ? 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.3)_inset]'
                  : 'border-dashed border-white/30'
              }`}
            />
          )}

          {/* High-Tech Non-Blocking HUD Chip at Top (matching Night Attendance) */}
          {pendingScanUsn && !scanResult && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-sky-400 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-sky-400/40 shadow-xl z-20 whitespace-nowrap">
              <div className="w-3 h-3 border-2 border-sky-400/25 border-t-sky-400 rounded-full animate-spin" />
              <span>Verifying {pendingScanUsn}...</span>
            </div>
          )}

          {/* Standby View: When scanning is stopped */}
          {!scanning && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shadow-xl">
                <CameraOff className="w-8 h-8 opacity-80" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Scanner Paused</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Camera is stopped. Click below anytime you are ready to resume scanning.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScanning(true)}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Resume Scanner
              </button>
            </div>
          )}

          {/* Camera Blocked Alert */}
          {cameraBlocked && scanning && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-white">Camera Access Blocked</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Camera permissions were denied. Please enable camera access in browser settings or scan from photo below.
              </p>
              <button
                type="button"
                onClick={() => startScanner(selectedCameraId)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
              >
                Retry Camera
              </button>
            </div>
          )}

          {/* Scan Result Overlay Modal */}
          {scanResult && (
            <div
              className={`absolute inset-4 rounded-2xl border-2 backdrop-blur-xl p-5 flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-200 z-30 ${getStatusColor(
                scanResult.status
              )}`}
            >
              {scanResult.status === 'ENTRY_ALLOWED' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div className="text-xs font-bold tracking-widest uppercase text-emerald-400">
                    ENTRY ALLOWED
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-1">
                    {scanResult.studentName}
                  </h3>
                  <p className="text-sm font-mono text-emerald-200 mt-0.5">{scanResult.usn}</p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    <Building className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{scanResult.hostelName || 'BMSCE Hostel Resident'}</span>
                    {scanResult.roomNumber && <span>• Room {scanResult.roomNumber}</span>}
                  </div>
                </>
              ) : scanResult.status === 'NOT_ELIGIBLE' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center mb-3">
                    <XCircle className="w-10 h-10 text-red-400" />
                  </div>
                  <div className="text-xs font-bold tracking-widest uppercase text-red-400">
                    NOT ELIGIBLE
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {scanResult.studentName || 'Student'}
                  </h3>
                  {scanResult.usn && (
                    <p className="text-sm font-mono text-red-200">{scanResult.usn}</p>
                  )}
                  <p className="text-xs text-red-300 mt-2 max-w-xs">{scanResult.message}</p>
                </>
              ) : scanResult.status === 'EXPIRED' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-3">
                    <Clock className="w-10 h-10 text-amber-400" />
                  </div>
                  <div className="text-xs font-bold tracking-widest uppercase text-amber-400">
                    QR EXPIRED
                  </div>
                  <p className="text-xs text-amber-200 mt-2 max-w-xs">{scanResult.message}</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center mb-3">
                    <AlertTriangle className="w-10 h-10 text-rose-400" />
                  </div>
                  <div className="text-xs font-bold tracking-widest uppercase text-rose-400">
                    SCAN ERROR
                  </div>
                  <p className="text-xs text-rose-200 mt-2 max-w-xs">{scanResult.message}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* 3. Action Controls Below Scanner (Matches User Screenshot) */}
        <div className="space-y-3 pt-1">
          {/* Scan from Photo fallback (clean outline button matching user screenshot) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-blue-400 border-2 border-blue-500/60 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <span>📷 Scan from Photo</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Primary Stop / Resume button (solid colored matching user screenshot) */}
          {scanning ? (
            <button
              type="button"
              onClick={() => setScanning(false)}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 cursor-pointer active:scale-[0.99]"
            >
              <Pause className="w-4 h-4" />
              <span>Stop Scanning</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setScanning(true)}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer active:scale-[0.99]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Scanning</span>
            </button>
          )}

          {/* Switch Camera button (if device has front & back cameras) */}
          {cameras.length > 1 && scanning && (
            <button
              type="button"
              onClick={handleToggleCamera}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Switch Camera ({cameras.find((c) => c.id === selectedCameraId)?.label || 'Camera'})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessEntryPage;
