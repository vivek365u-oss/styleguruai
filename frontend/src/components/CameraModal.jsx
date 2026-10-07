import { useState, useRef, useEffect, useCallback } from 'react';
import { FiCamera, FiRefreshCw, FiX, FiCheck, FiAlertCircle, FiImage } from 'react-icons/fi';

/**
 * CameraModal
 * A premium, full-featured live camera viewfinder for capturing high-quality selfies.
 * Supports:
 * - Live front (selfie) & back camera stream via getUserMedia
 * - Mirroring for natural front-facing selfie feel
 * - Oval face alignment guide
 * - Shutter click flash animation
 * - Instant photo review (Retake / Use Photo)
 * - Safe fallback to native camera & gallery if permissions are denied
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
  const [facingMode, setFacingMode] = useState('user');
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [flashActive, setFlashActive] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Stop camera tracks safely
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

  // Check available cameras
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    }).catch(() => {
      setHasMultipleCameras(true); // default to allowing flip
    });
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (mode = facingMode) => {
    stopStream();
    setCameraError(null);
    setIsStreaming(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError({
        type: 'unsupported',
        message: 'Direct camera access is not supported by your browser or connection (HTTPS is required).',
      });
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            .play()
            .then(() => setIsStreaming(true))
            .catch((playErr) => console.warn('Video play error:', playErr));
        };
      }
    } catch (err) {
      console.error('Camera stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError({
          type: 'permission',
          message: 'Camera permission denied. Please allow camera access in browser settings to take a selfie directly.',
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError({
          type: 'not_found',
          message: 'No camera hardware found on this device.',
        });
      } else {
        setCameraError({
          type: 'generic',
          message: 'Unable to start camera viewfinder. You can use your device camera or pick from gallery.',
        });
      }
    }
  }, [facingMode, stopStream]);

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
  }, [isOpen, facingMode, startCamera, stopStream]);

  // Switch facing mode (front / back)
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
    if (facingMode === 'user') {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
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
              {capturedImage ? 'Review Selfie' : 'Instant AI Selfie'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!capturedImage && hasMultipleCameras && (
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
            /* Error State */
            <div className="p-6 text-center text-white max-w-xs space-y-4">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl">
                <FiAlertCircle />
              </div>
              <p className="text-sm font-semibold">{cameraError.message}</p>
              <div className="space-y-2 pt-2">
                {onFallbackNativeCamera && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onFallbackNativeCamera();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-md transition-all active:scale-95"
                  >
                    📸 Open System Camera
                  </button>
                )}
                {onFallbackGallery && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onFallbackGallery();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white/90 bg-white/10 hover:bg-white/15 border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <FiImage className="w-3.5 h-3.5" /> Browse Gallery Instead
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full py-2 px-4 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-all"
                >
                  Try Camera Again
                </button>
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
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                style={{
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
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
                title="Browse Gallery"
              >
                <FiImage className="w-4 h-4" />
                <span className="text-[10px]">Gallery</span>
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

              {/* Switch Camera */}
              {hasMultipleCameras ? (
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
}
