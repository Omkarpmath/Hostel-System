import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Building,
  Upload,
  CameraOff,
  Play,
  Pause,
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

  // Fetch today's stats for this guard's mess (lightweight count only)
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

  // Keep a stable ref to scanMutation so callbacks don't recreate on every render
  const scanMutationRef = useRef(scanMutation);
  useEffect(() => {
    scanMutationRef.current = scanMutation;
  }, [scanMutation]);

  // Handle scanned QR token (stable reference prevents unwanted scanner reloads)
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
      // Purge any leftover video/canvas tags from container
      if (scannerContainerRef.current) {
        scannerContainerRef.current.innerHTML = '';
      }
      isStoppingRef.current = false;
    }
  }, []);

  // Initialize camera scanner cleanly without duplicate instances
  const startScanner = useCallback(
    async (cameraId?: string) => {
      if (isStartingRef.current || isStoppingRef.current || scannerRef.current) return;
      if (!scannerContainerRef.current) return;

      isStartingRef.current = true;
      try {
        // Clear any old elements inside container before mounting
        if (scannerContainerRef.current) {
          scannerContainerRef.current.innerHTML = '';
        }

        const { Html5Qrcode } = await import('html5-qrcode');

        if (!scannerContainerRef.current) {
          isStartingRef.current = false;
          return;
        }

        // Query available camera devices if not fetched yet
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

        await scanner.start(
          cameraConfig,
          {
            fps: 10,
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

  // Manage scanner lifecycle with a slight delay to allow smooth DOM mounting
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

  // Handle switching cameras if multiple exist
  const handleToggleCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    await stopScanner();
    setSelectedCameraId(nextCamera.id);
  };

  // Handle image upload scan fallback
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Mess Entry Scanner
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-sm text-slate-400">
                {stats?.mess?.name ? (
                  <span className="text-slate-300 font-medium">{stats.mess.name}</span>
                ) : (
                  'Assigned Mess Facility'
                )}{' '}
                • Scan student Dynamic QR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-right">
              <div className="text-xs text-slate-400">Today's Total Entries</div>
              <div className="text-2xl font-bold text-amber-400">
                {statsLoading && localCount === null ? '...' : displayedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Scanner HUD Card */}
        <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 p-4 md:p-6 shadow-2xl overflow-hidden">
          {/* Top Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  scanning
                    ? 'bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20'
                    : 'bg-amber-500 ring-4 ring-amber-500/20'
                }`}
              />
              <span className="text-sm font-semibold text-slate-200">
                {scanning ? 'Scanner Active' : 'Scanner Stopped'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  scanning
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {scanning ? 'Camera Live' : 'Standby'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Primary Stop / Resume scanning button */}
              {scanning ? (
                <button
                  type="button"
                  onClick={() => setScanning(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  title="Stop scanning and turn off camera"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Stop Scanning</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setScanning(true)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                  title="Resume camera and continue scanning"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume Scanning</span>
                </button>
              )}

              {/* Flip camera if device has multiple cameras */}
              {cameras.length > 1 && scanning && (
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  title="Switch camera"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Flip</span>
                </button>
              )}

              {/* Image upload fallback */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title="Scan from image file"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Scanner Viewport Container with responsive square aspect on mobile */}
          <div className="relative w-full max-w-md mx-auto aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700/80 flex items-center justify-center shadow-2xl">
            {/* Scoped CSS to enforce proper alignment & ensure WebKit canvas renders */}
            <style>{`
              #mess-qr-scanner {
                position: relative !important;
                width: 100% !important;
                height: 100% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                overflow: hidden !important;
                background-color: #020617 !important;
              }
              #mess-qr-scanner video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                border-radius: 0.875rem !important;
              }
              #mess-qr-scanner canvas {
                position: absolute !important;
                opacity: 0 !important;
                pointer-events: none !important;
                z-index: -1 !important;
              }
              #mess-qr-scanner #qr-shaded-region {
                display: none !important;
              }
              #mess-qr-scanner #qr-shaded-region > div {
                display: none !important;
              }
            `}</style>

            {/* Html5Qrcode video mounting target */}
            <div
              id="mess-qr-scanner"
              ref={scannerContainerRef}
              className="w-full h-full"
            />

            {/* Active Scanner: Single Modern Centered Reticle */}
            {scanning && !cameraBlocked && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-amber-400/35 rounded-3xl shadow-[0_0_30px_rgba(245,158,11,0.12)]">
                  {/* Corner markers */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-xl shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-xl shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-xl shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-xl shadow-[0_0_8px_rgba(245,158,11,0.5)]" />

                  {/* Sweeping laser line */}
                  {!scanResult && (
                    <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                  )}
                </div>
              </div>
            )}

            {/* Standby View: When scanning is stopped by the guard */}
            {!scanning && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10 space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/80 flex items-center justify-center text-amber-400 shadow-xl">
                    <CameraOff className="w-9 h-9 opacity-80" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-slate-950 flex items-center justify-center text-xs font-bold text-slate-950">
                    ⏸
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Scanner Paused</h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                    Camera is currently stopped. Click below anytime you are ready to resume student QR scanning.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setScanning(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Resume Camera Scanner
                </button>
              </div>
            )}

            {/* Pending scan feedback */}
            {pendingScanUsn && !scanResult && (
              <div className="absolute bottom-4 inset-x-4 bg-slate-900/90 border border-amber-500/40 backdrop-blur-md rounded-xl p-3 text-center animate-pulse z-20">
                <div className="text-xs text-amber-300 font-semibold tracking-wider">
                  VERIFYING TOKEN...
                </div>
                <div className="text-sm font-bold text-white font-mono">{pendingScanUsn}</div>
              </div>
            )}

            {/* Camera blocked alert */}
            {cameraBlocked && scanning && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-white">Camera Access Blocked</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Camera permissions were denied or unavailable. Please enable camera access in your browser settings or scan an image file.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => startScanner(selectedCameraId)}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
                  >
                    Retry Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-medium text-xs hover:bg-slate-700 transition border border-slate-700 cursor-pointer"
                  >
                    Upload Image
                  </button>
                </div>
              </div>
            )}

            {/* Scan Result Overlay Modal/Banner */}
            {scanResult && (
              <div
                className={`absolute inset-4 rounded-2xl border-2 backdrop-blur-xl p-5 flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-200 ${getStatusColor(
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

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
              {scanning
                ? "Position the student's dynamic rotating QR code inside the target reticle."
                : "Scanner is currently paused on standby. Click 'Resume Scanning' when you are ready."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessEntryPage;
