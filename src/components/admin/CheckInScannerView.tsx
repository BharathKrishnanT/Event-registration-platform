import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Volume2,
  VolumeX,
  RefreshCw,
  DoorOpen,
  User,
  ShieldCheck,
  Building2,
  GraduationCap,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { Event, CheckInResult, Registration, User as UserType, hasPermission } from '../../types.ts';
import { soundEffects } from '../../utils/audio.ts';

interface CheckInScannerViewProps {
  event: Event;
  currentUser?: UserType | null;
}

export const CheckInScannerView: React.FC<CheckInScannerViewProps> = ({ event, currentUser }) => {
  const canScan = hasPermission(currentUser, 'qr_scanner');

  // Scanner state
  const [selectedGate, setSelectedGate] = useState('Gate 1 (Main Entrance)');
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);

  // Manual fallback search state
  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState<Registration[]>([]);
  const [isSearchingManual, setIsSearchingManual] = useState(false);

  // Team Selection State
  const [teamSelectionData, setTeamSelectionData] = useState<{
    type: 'scan' | 'manual';
    qr_token?: string;
    registration: Registration;
  } | null>(null);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>([]);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestAnimationRef = useRef<number | null>(null);
  const lastScannedTokenRef = useRef<string>('');
  const cooldownRef = useRef<boolean>(false);

  // Available Gates
  const gates = [
    'Gate 1 (Main Entrance)',
    'Gate 2 (Auditorium)',
    'Gate 3 (Workshop Lab)',
    'VIP Entrance',
    'Helpdesk / Registration Desk',
  ];

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS/Safari
        await videoRef.current.play();
        setIsCameraActive(true);
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        'Unable to access camera. Please check camera permissions or use the manual search fallback below.'
      );
      setIsCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Continuous QR scan loop using jsQR
  const startScanningLoop = () => {
    const scanFrame = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = (jsQR as any)(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data && !cooldownRef.current) {
            const token = code.data.trim();
            if (token !== lastScannedTokenRef.current) {
              handleQrDetected(token);
            }
          }
        }
      }

      if (!cooldownRef.current) {
        requestAnimationRef.current = requestAnimationFrame(scanFrame);
      }
    };

    requestAnimationRef.current = requestAnimationFrame(scanFrame);
  };

  // Handle scanned QR token
  const handleQrDetected = async (token: string) => {
    cooldownRef.current = true;
    lastScannedTokenRef.current = token;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/check-in/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_token: token,
          event_id: event.id,
          gate: selectedGate,
          scanner_id: 'gate-camera-1',
        }),
      });

      const data: CheckInResult = await res.json();

      if (data.status === 'TEAM_SELECTION_REQUIRED' && data.registration) {
        setTeamSelectionData({ type: 'scan', qr_token: token, registration: data.registration });
        // Set all un-checked-in members as selected by default, or none.
        // Let's select none by default to force manual selection.
        setSelectedTeamMembers([]);
        setIsProcessing(false);
        // Do not restart scanning yet
        return;
      }

      setScanResult(data);

      if (data.success) {
        if (soundEnabled) soundEffects.playSuccess();
      } else {
        if (data.status === 'ALREADY_CHECKED_IN') {
          if (soundEnabled) soundEffects.playWarning();
        } else {
          if (soundEnabled) soundEffects.playError();
        }
      }
    } catch (err) {
      console.error('Check-in error', err);
      const errorResult: CheckInResult = {
        success: false,
        status: 'INVALID_TOKEN',
        message: 'Network error communicating with check-in service.',
      };
      setScanResult(errorResult);
      if (soundEnabled) soundEffects.playError();
    } finally {
      setIsProcessing(false);

      // Auto-resume after 2.8 seconds for continuous scanning if no team selection modal
      setTimeout(() => {
        setScanResult(null);
        lastScannedTokenRef.current = '';
        cooldownRef.current = false;
        startScanningLoop();
      }, 2800);
    }
  };

  const handleTeamSelectionSubmit = async () => {
    if (!teamSelectionData || selectedTeamMembers.length === 0) return;

    setIsProcessing(true);
    try {
      const isManual = teamSelectionData.type === 'manual';
      const endpoint = isManual ? '/api/check-in/manual' : '/api/check-in/scan';
      
      const bodyPayload: any = {
        event_id: event.id,
        gate: selectedGate,
        member_indices: selectedTeamMembers,
      };

      if (isManual) {
        bodyPayload.registration_id = teamSelectionData.registration.id;
        bodyPayload.reason = 'Manual fallback desk search with team selection';
      } else {
        bodyPayload.qr_token = teamSelectionData.qr_token;
        bodyPayload.scanner_id = 'gate-camera-1';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data: CheckInResult = await res.json();
      setTeamSelectionData(null);
      
      if (isManual && data.success) {
        setManualResults((prev) =>
          prev.map((r) => (r.id === teamSelectionData.registration.id ? { ...r, attendance_status: 'CHECKED_IN' } : r))
        );
      }
      
      setScanResult(data);

      if (data.success) {
        if (soundEnabled) soundEffects.playSuccess();
      } else {
        if (data.status === 'ALREADY_CHECKED_IN') {
          if (soundEnabled) soundEffects.playWarning();
        } else {
          if (soundEnabled) soundEffects.playError();
        }
      }
    } catch (err) {
      console.error('Team check-in error', err);
      setScanResult({
        success: false,
        status: 'INVALID_TOKEN',
        message: 'Network error during team check-in.',
      });
      if (soundEnabled) soundEffects.playError();
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setScanResult(null);
        lastScannedTokenRef.current = '';
        cooldownRef.current = false;
        if (teamSelectionData?.type === 'scan') {
          startScanningLoop();
        }
      }, 2800);
    }
  };

  const cancelTeamSelection = () => {
    const wasScan = teamSelectionData?.type === 'scan';
    setTeamSelectionData(null);
    setScanResult(null);
    lastScannedTokenRef.current = '';
    cooldownRef.current = false;
    if (wasScan) {
      startScanningLoop();
    }
  };

  // Manual Check-In Action
  const handleManualCheckIn = async (reg: Registration) => {
    try {
      const res = await fetch('/api/check-in/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: reg.id,
          event_id: event.id,
          gate: selectedGate,
          reason: 'Manual fallback desk search',
        }),
      });

      const data = await res.json();
      
      if (data.status === 'TEAM_SELECTION_REQUIRED' && data.participant) {
        setTeamSelectionData({ type: 'manual', registration: data.participant });
        setSelectedTeamMembers([]);
        return;
      }

      if (data.success) {
        if (soundEnabled) soundEffects.playSuccess();
        setScanResult(data);
        // Refresh search results
        setManualResults((prev) =>
          prev.map((r) => (r.id === reg.id ? { ...r, attendance_status: 'CHECKED_IN' } : r))
        );
        setTimeout(() => setScanResult(null), 3000);
      } else {
        if (soundEnabled) soundEffects.playWarning();
        setScanResult(data);
      }
    } catch (e) {
      console.error('Manual check in failed', e);
    }
  };

  // Search attendees manually
  const handleSearchManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;

    setIsSearchingManual(true);
    try {
      const res = await fetch(`/api/registrations?event_id=${event.id}`);
      if (res.ok) {
        const list: Registration[] = await res.json();
        const q = manualQuery.toLowerCase().trim();
        const filtered = list.filter(
          (r) =>
            r.registration_number.toLowerCase().includes(q) ||
            r.name.toLowerCase().includes(q) ||
            r.phone.includes(q) ||
            r.email.toLowerCase().includes(q)
        );
        setManualResults(filtered);
      }
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setIsSearchingManual(false);
    }
  };

  useEffect(() => {
    if (canScan) {
      startCamera();
    }
    return () => stopCamera();
  }, [event.id, canScan]);

  if (!canScan) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs max-w-xl mx-auto my-8 space-y-4">
        <div className="w-16 h-16 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">QR Gate Scanner Access Restricted</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Your administrator login (<strong>{currentUser?.email || 'Current Account'}</strong>) has not been authorized for <strong>QR Gate Scanner</strong> access.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Please ask a Super Administrator to edit your account permissions under the <em>Organizer Whitelist & RBAC</em> panel.
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            Requires: qr_scanner permission
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Scanner Control Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Check-In Gate
            </div>
            <div className="text-sm font-bold text-slate-900">{selectedGate}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Gate Selector */}
          <select
            value={selectedGate}
            onChange={(e) => setSelectedGate(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-0 text-slate-800 transition-colors focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            {gates.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Audio toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'border-slate-200 bg-slate-50 text-slate-700'
                : 'border-slate-200 bg-slate-100 text-slate-400'
            }`}
            title={soundEnabled ? 'Mute audio tones' : 'Enable audio feedback'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Camera Restart */}
          <button
            onClick={startCamera}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Restart camera stream"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Camera Viewport (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraError ? 'hidden' : 'block'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Reticle Overlay */}
            {!cameraError && !scanResult && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/60 rounded-xl relative">
                  {/* Glowing Corners */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  {/* Scanning sweep animation line */}
                  <div className="w-full h-0.5 bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse mt-32" />
                </div>
                <div className="mt-4 px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-semibold backdrop-blur">
                  Align Participant QR Code within frame
                </div>
              </div>
            )}

            {/* Camera Error State */}
            {cameraError && (
              <div className="p-8 text-center text-slate-300 max-w-sm">
                <Camera className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white mb-1">Camera Inactive</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 transition-colors"
                >
                  Retry Camera Access
                </button>
              </div>
            )}

            {/* Instant Result Overlay Banner */}
            {scanResult && (
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-150 backdrop-blur-md ${
                  scanResult.success
                    ? 'bg-emerald-950/90 text-white'
                    : scanResult.status === 'ALREADY_CHECKED_IN'
                    ? 'bg-amber-950/90 text-white'
                    : 'bg-rose-950/90 text-white'
                }`}
              >
                {/* Result Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 shadow-lg bg-white">
                  {scanResult.success ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  ) : scanResult.status === 'ALREADY_CHECKED_IN' ? (
                    <AlertTriangle className="w-10 h-10 text-amber-600" />
                  ) : (
                    <XCircle className="w-10 h-10 text-rose-600" />
                  )}
                </div>

                {/* Status Heading */}
                <h3 className="text-2xl font-black tracking-tight">
                  {scanResult.success
                    ? 'CHECKED IN!'
                    : scanResult.status === 'ALREADY_CHECKED_IN'
                    ? 'ALREADY CHECKED IN'
                    : 'INVALID PASS'}
                </h3>

                <p className="text-xs font-semibold max-w-sm mt-1 opacity-90">
                  {scanResult.message}
                </p>

                {/* Attendee Details Card */}
                {scanResult.registration && (
                  <div className="mt-4 p-4 rounded-xl bg-white/10 border border-white/20 text-left w-full max-w-sm space-y-1">
                    <div className="text-base font-bold text-white">
                      {scanResult.registration.name}
                    </div>
                    <div className="text-xs text-white/80 font-mono">
                      {scanResult.registration.registration_number}
                    </div>
                    <div className="text-xs text-white/70">
                      {scanResult.registration.college} • {scanResult.registration.department}
                    </div>
                    {scanResult.attendance && (
                      <div className="pt-2 mt-2 border-t border-white/20 text-[11px] text-emerald-300 flex items-center justify-between">
                        <span>Gate: {scanResult.attendance.gate}</span>
                        <span>
                          {new Date(scanResult.attendance.check_in_time).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 text-[10px] text-white/60">
                  Resuming scanner in 2 seconds...
                </div>
              </div>
            )}

            {/* Team Selection Modal overlay */}
            {teamSelectionData && (
              <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150 backdrop-blur-sm bg-slate-900/80 text-white overflow-y-auto">
                <div className="bg-slate-950 p-8 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md">
                  <h3 className="text-xl font-black tracking-tight mb-2 text-white">TEAM CHECK-IN</h3>
                  <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
                    Select which team members are present for {teamSelectionData.registration.team_name || teamSelectionData.registration.name}'s team.
                  </p>
                  <div className="w-full space-y-2 mb-8 text-left">
                    {teamSelectionData.registration.team_members?.map((member, idx) => {
                      const isCheckedIn = member.checked_in;
                      const isSelected = selectedTeamMembers.includes(idx);
                      return (
                        <button
                          key={idx}
                          disabled={isCheckedIn}
                          onClick={() => {
                            if (isCheckedIn) return;
                            setSelectedTeamMembers(prev => 
                              prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                            );
                          }}
                          className={`w-full p-3 rounded-xl border flex items-center justify-between transition-colors ${
                            isCheckedIn 
                              ? 'bg-slate-900 border-emerald-900/50 opacity-70 cursor-not-allowed'
                              : isSelected
                              ? 'bg-emerald-900/30 border-emerald-500'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div>
                            <div className={`text-sm font-bold ${isCheckedIn ? 'text-emerald-400' : 'text-white'}`}>
                              {member.name} {idx === 0 && '(Leader)'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {isCheckedIn ? `Checked in at ${new Date(member.checked_in_at!).toLocaleTimeString()}` : member.phone || 'No phone provided'}
                            </div>
                          </div>
                          <div>
                            {isCheckedIn ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 border border-emerald-500 flex items-center justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-white/20" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 w-full">
                    <button
                      onClick={cancelTeamSelection}
                      className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTeamSelectionSubmit}
                      disabled={selectedTeamMembers.length === 0}
                      className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 transition-colors disabled:opacity-50"
                    >
                      Confirm ({selectedTeamMembers.length})
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-semibold text-slate-800">
              Continuous scan mode active
            </span>
            <span>Single-use ticket encryption enforced</span>
          </div>
        </div>

        {/* Fallback Manual Search & Check-in (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col h-full">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Manual Check-In Desk</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            If an attendee cannot display their QR pass, search by Registration ID, Name, Phone, or Email.
          </p>

          <form onSubmit={handleSearchManual} className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="Search Reg ID, Name, Phone..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              type="submit"
              disabled={isSearchingManual || !manualQuery.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Search
            </button>
          </form>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[380px] pr-1">
            {manualResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {manualQuery ? 'No attendees match that search' : 'Search results will appear here'}
              </div>
            ) : (
              manualResults.map((r) => {
                const isCheckedIn = r.attendance_status === 'CHECKED_IN';
                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900">{r.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {r.registration_number}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.college} • {r.phone}
                      </div>
                    </div>

                    <div>
                      {isCheckedIn ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Checked In
                        </span>
                      ) : (
                        <button
                          onClick={() => handleManualCheckIn(r)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
