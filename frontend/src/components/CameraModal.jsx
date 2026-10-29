import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiCamera, FiRefreshCw, FiX, FiCheck, FiImage, FiLock, FiSmartphone, FiAlertCircle } from 'react-icons/fi';

/**
 * CameraModal
 * A resilient, production-grade camera viewfinder for taking selfies on both Desktop & Mobile.
 * 
 * Key Features:
 * - Differentiates Desktop (ASUS / PC webcams) from Mobile (Android / iOS):
 *   Desktop uses universal video constraints (avoids OverconstrainedError on webcams without facingMode).
 * - Exact Error Diagnostics (Permission Blocked vs Camera Busy/In-Use vs Hardware Disabled).
 * - Actionable Bilingual Guidance (Hindi & English) for each failure scenario.
 * - Concurrency guard to prevent stream race conditions.
 * - Smooth visual loading state, oval face guide, flash effect, and photo review.
 */
export default function CameraModal({
  isOpen,
  onClose,
  onCapture,
  onFallbackNativeCamera,
  onFallbackGallery,
  isDark = true,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const inProgressRef = useRef(false);

  const [facingMode, setFacingMode] = useState('user');
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [flashActive, setFlashActive] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Check if current device is mobile
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Safely stop all active media stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Inspect available cameras on mobile to toggle front/back
  useEffect(() => {
    if (!isMobile || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    }).catch(() => {
      setHasMultipleCameras(true);
    });
  }, [isMobile, isStreaming]);

  // Start camera stream with progressive fallback tiers
  const startCamera = useCallback(async (mode = facingMode) => {
    if (inProgressRef.current) return;
    inProgressRef.current = true;

    stopStream();
    setCameraError(null);
    setIsStreaming(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      inProgressRef.current = false;
      setCameraError({
        type: 'unsupported',
        title: 'Camera Not Supported',
        message: 'Direct camera access is not supported by your browser or connection (HTTPS is required).',
        rawName: 'NotSupportedError',
        rawMessage: 'navigator.mediaDevices.getUserMedia is unavailable.',
      });
      return;
    }

    let stream = null;
    let lastError = null;

    // Constraint Tiers:
    // On Desktop: do NOT use facingMode because PC webcams (e.g. ASUS HD webcam) fail on facingMode.
    // On Mobile: use facingMode ('user' for front selfie, 'environment' for rear).
    const constraintTiers = isMobile
      ? [
          { video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
          { video: { facingMode: mode }, audio: false },
          { video: true, audio: false },
        ]
      : [
          { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
          { video: true, audio: false },
        ];

    for (const constraints of constraintTiers) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        lastError = err;
        // If permission was strictly denied by user, stop trying more tiers
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          break;
        }
      }
    }

    inProgressRef.current = false;

    if (!stream) {
      console.warn('Camera stream acquisition failed:', lastError);
      const errName = lastError?.name || 'CameraError';
      const errMsg = lastError?.message || String(lastError || '');

      let errorType = 'generic';
      let errorTitle = 'Camera Unavailable';
      let errorDesc = 'Unable to start camera stream.';

      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError' ||
        errName === 'SecurityError' ||
        errMsg.toLowerCase().includes('denied') ||
        errMsg.toLowerCase().includes('permission') ||
        errMsg.toLowerCase().includes('not allowed')
      ) {
        errorType = 'permission';
        errorTitle = 'Camera Permission Blocked';
        errorDesc = 'Browser me camera permission blocked hai.';
      } else if (
        errName === 'NotReadableError' ||
        errName === 'TrackStartError' ||
        errMsg.toLowerCase().includes('could not start video source') ||
        errMsg.toLowerCase().includes('in use') ||
        errMsg.toLowerCase().includes('busy')
      ) {
        errorType = 'in_use';
        errorTitle = 'Camera In Use or Hardware Disabled';
        errorDesc = 'Webcam kisi aur app me open hai ya laptop camera switch band hai.';
      } else if (
        errName === 'NotFoundError' ||
        errName === 'DevicesNotFoundError' ||
        errMsg.toLowerCase().includes('not found')
      ) {
        errorType = 'not_found';
        errorTitle = 'No Camera Device Found';
        errorDesc = 'Device par koi camera hardware nahi mila.';
      } else if (errName === 'OverconstrainedError') {
        errorType = 'overconstrained';
        errorTitle = 'Camera Resolution Conflict';
        errorDesc = 'Camera requested settings support nahi karta.';
      }

      setCameraError({
        type: errorType,
        title: errorTitle,
        message: errorDesc,
        rawName: errName,
        rawMessage: errMsg,
      });
      return;
    }

    streamRef.current = stream;

    // Attach stream to video DOM element
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      try {
        await videoRef.current.play();
        setIsStreaming(true);
      } catch (playErr) {
        console.warn('Direct play error, attaching metadata handler:', playErr);
        videoRef.current.onloadedmetadata = () => {
          if (!videoRef.current) return;
          videoRef.current.muted = true;
          videoRef.current
            .play()
            .then(() => setIsStreaming(true))
            .catch((err) => console.warn('Play error on metadata:', err));
        };
      }
    }
  }, [facingMode, isMobile, stopStream]);

  // Keep videoRef in sync if it mounts after stream is acquired
  useEffect(() => {
    if (isOpen && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.muted = true;
      videoRef.current.play().then(() => setIsStreaming(true)).catch((e) => console.warn('Sync play error:', e));
    }
  }, [isOpen, cameraError, isStreaming]);

  // Launch camera when modal opens, clean up on close
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      startCamera(facingMode);
    } else {
      stopStream();
      setCapturedImage(null);
      setCameraError(null);
    }

    return () => {
      stopStream();
    };
  }, [isOpen]);

  // Auto-recover when user toggles permission in browser address bar
  useEffect(() => {
    if (!isOpen || isStreaming) return;
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'camera' }).then((status) => {
        status.onchange = () => {
          if (status.state === 'granted') {
            startCamera(facingMode);
          }
        };
      }).catch(() => {});
    }
  }, [isOpen, isStreaming, facingMode, startCamera]);

  // Switch facing mode (front / back) - Mobile only
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (!capturedImage) {
      startCamera(nextMode);
    }
  };

  // Capture frame to blob & File
  const handleSnap = () => {
    if (!videoRef.current || !isStreaming) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');

    // Trigger visual flash
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    // Front camera is displayed mirrored, so mirror it horizontally before drawing
    if (facingMode === 'user' || !isMobile) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCapturedImage({ file, dataUrl });
        // Release camera hardware during review
        stopStream();
      },
      'image/jpeg',
      0.95
    );
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Confirm and submit photo
  const handleConfirm = () => {
    if (capturedImage?.file) {
      onCapture(capturedImage.file);
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalJSX = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Visual Flash Effect */}
      {flashActive && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200" />
      )}

      <div className="relative w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10 z-20">
          <div className="flex items-center gap-2 text-white">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <FiCamera className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold tracking-tight">
              {capturedImage ? 'Review Selfie' : (isMobile ? 'Instant AI Camera' : 'Webcam Selfie')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!capturedImage && hasMultipleCameras && !cameraError && (
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs font-semibold flex items-center gap-1 active:scale-95"
                title="Switch Camera"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
                <span className="text-[11px]">{facingMode === 'user' ? 'Front' : 'Back'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              title="Close Camera"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder / Review Area */}
        <div className="relative flex-1 min-h-[380px] sm:min-h-[440px] bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            /* Error State with Precise Actionable Guidance */
            <div className="p-5 text-center text-white max-w-sm mx-auto space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl border border-amber-500/30 shadow-lg">
                {cameraError.type === 'permission' ? <FiLock /> : <FiAlertCircle />}
              </div>
              
              <div>
                <h4 className="text-base font-black text-white mb-1">
                  {cameraError.title}
                </h4>

                {/* Scenario 1: Permission Blocked */}
                {cameraError.type === 'permission' && (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs text-amber-300 font-semibold">
                      कैमरा परमिशन ब्लॉक है — 5 सेकंड में चालू करें:
                    </p>
                    <div className="bg-white/[0.07] rounded-2xl p-3.5 text-left border border-white/10 space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                        <span className="text-white/80">Browser ke top address bar me <b>🔒 Lock</b> ya <b>Site Settings</b> icon dabayein.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                        <span className="text-white/80"><b>Camera</b> permission ko <b>Allow</b> karein.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                        <span className="text-white/80">Niche <b>"Try Camera Again"</b> dabayein.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scenario 2: Camera In Use / Hardware Disabled (Common on ASUS / PC) */}
                {cameraError.type === 'in_use' && (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs text-amber-300 font-semibold">
                      कैमरा किसी और ऐप में व्यस्त है या बंद है:
                    </p>
                    <div className="bg-white/[0.07] rounded-2xl p-3.5 text-left border border-white/10 space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                        <span className="text-white/80">Zoom, Google Meet, Teams ya Windows Camera app open ho toh <b>close karein</b>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                        <span className="text-white/80">Laptop camera slider / shutter open karein ya keyboard pe <b>Fn + F10</b> dabayein.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                        <span className="text-white/80">Dusre browser tabs jo camera use kar rahe hon unhe close karein.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scenario 3: Generic / Device Not Found */}
                {cameraError.type !== 'permission' && cameraError.type !== 'in_use' && (
                  <div className="mt-2 bg-white/[0.07] p-3 rounded-2xl border border-white/10 text-xs text-white/80">
                    <p className="mb-1 font-semibold">{cameraError.message}</p>
                    <p className="text-[11px] text-white/50">Kripya photo file upload karke bhi style analysis kar sakte hain.</p>
                  </div>
                )}

                {/* Technical Diagnostics Tag */}
                <div className="mt-3 px-2 py-1 rounded-lg bg-black/40 border border-white/5 inline-block text-[10px] text-white/40 font-mono">
                  {cameraError.rawName}: {cameraError.rawMessage}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <FiRefreshCw className="w-4 h-4" /> Try Camera Again / फिर से कोशिश करें
                </button>

                {isMobile && onFallbackNativeCamera && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onFallbackNativeCamera();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <FiSmartphone className="w-3.5 h-3.5" /> 📸 Use Phone Camera App
                  </button>
                )}

                {onFallbackGallery && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onFallbackGallery();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-1.5"
                  >
                    <FiImage className="w-3.5 h-3.5" /> 📁 {isMobile ? 'Browse Gallery Instead' : 'Upload Photo from Computer'}
                  </button>
                )}
              </div>
            </div>
          ) : capturedImage ? (
            /* Review Captured Frame */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedImage.dataUrl}
                alt="Captured Selfie"
                className="w-full h-full object-cover max-h-[500px]"
              />
              <div className="absolute top-3 inset-x-3 bg-black/60 backdrop-blur-md rounded-xl py-1.5 px-3 border border-white/10 text-center">
                <span className="text-[12px] font-semibold text-emerald-300">
                  ✓ Photo captured! Ready for AI analysis?
                </span>
              </div>
            </div>
          ) : (
            /* Live Camera Stream with Oval Guide */
            <div className="relative w-full h-full flex items-center justify-center">
              {!isStreaming && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 gap-3">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-white/70 font-semibold animate-pulse">Connecting to camera...</p>
                </div>
              )}

              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                onCanPlay={() => setIsStreaming(true)}
                style={{
                  transform: facingMode === 'user' || !isMobile ? 'scaleX(-1)' : 'none',
                }}
                className="w-full h-full object-cover min-h-[380px] sm:min-h-[440px]"
              />

              {/* Lighting Tip Pill */}
              <div className="absolute top-3 inset-x-4 flex justify-center pointer-events-none z-10">
                <div className="bg-black/60 backdrop-blur-md border border-white/15 rounded-full py-1 px-3 text-[11px] font-medium text-white/90 shadow-lg">
                  ☀️ Keep face centered in natural light
                </div>
              </div>

              {/* Oval Face Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <div
                  className="w-52 h-64 sm:w-60 sm:h-72 border-2 border-dashed border-purple-400/80 rounded-[50%] transition-all animate-pulse"
                  style={{
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                  }}
                />
              </div>

              {/* Guide hint text */}
              <div className="absolute bottom-4 inset-x-4 flex justify-center pointer-events-none z-10">
                <span className="text-[11px] font-bold text-white/80 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                  Align face inside oval
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="px-5 py-4 bg-black/70 backdrop-blur-md border-t border-white/10 z-20">
          {capturedImage ? (
            /* Review Buttons */
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white/90 bg-white/10 hover:bg-white/15 border border-white/15 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" /> Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <FiCheck className="w-4 h-4" /> Use This Photo
              </button>
            </div>
          ) : !cameraError ? (
            /* Shutter & Gallery Controls */
            <div className="flex items-center justify-between">
              {/* Gallery switch shortcut */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onFallbackGallery) onFallbackGallery();
                }}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all text-xs font-semibold flex flex-col items-center gap-1 active:scale-95"
                title={isMobile ? 'Browse Gallery' : 'Upload File'}
              >
                <FiImage className="w-4 h-4" />
                <span className="text-[10px]">{isMobile ? 'Gallery' : 'Upload'}</span>
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleSnap}
                disabled={!isStreaming}
                className={`relative w-18 h-18 rounded-full p-1 border-4 transition-all active:scale-90 ${
                  isStreaming
                    ? 'border-white hover:scale-105 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                    : 'border-white/30 opacity-50 cursor-not-allowed'
                }`}
                title="Capture Photo"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-inner">
                  <div className="w-12 h-12 rounded-full bg-white shadow-md" />
                </div>
              </button>

              {/* Switch Camera (Mobile only) */}
              {isMobile && hasMultipleCameras ? (
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all text-xs font-semibold flex flex-col items-center gap-1 active:scale-95"
                  title="Switch Camera"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  <span className="text-[10px]">Flip</span>
                </button>
              ) : (
                <div className="w-11" /> // balance spacing
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
