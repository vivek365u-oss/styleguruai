// ============================================================
// StyleGuruAI — In-Store Color Scanner
// Camera-based real-time color detection & palette matching
// ============================================================
import { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { FashionIcons, IconRenderer } from './Icons';
import { trackColorScannerUse } from '../utils/analytics';
import { saveWardrobeItem, auth } from '../api/styleApi';

function hexToRgb(hex) {
  if (!hex || hex.length < 7) return { r: 128, g: 128, b: 128 };
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function colorDistance(hex1, hex2) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  return Math.sqrt((c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2);
}

function getColorName(hex) {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;
  if (l > 0.9) return 'White';
  if (l < 0.1) return 'Black';
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1)) / 255;
  if (s < 0.15) return l > 0.5 ? 'Light Grey' : 'Dark Grey';
  let h = 0;
  if (max === r) h = ((g - b) / (max - min)) % 6;
  else if (max === g) h = (b - r) / (max - min) + 2;
  else h = (r - g) / (max - min) + 4;
  h = Math.round(h * 60); if (h < 0) h += 360;
  if (h < 15) return 'Red'; if (h < 45) return 'Orange'; if (h < 75) return 'Yellow';
  if (h < 150) return 'Green'; if (h < 210) return 'Cyan'; if (h < 270) return 'Blue';
  if (h < 330) return 'Purple'; return 'Red';
}

function ColorScanner({ savedPalette = [], onClose }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);

  const [detectedHex, setDetectedHex] = useState('#808080');
  const [detectedName, setDetectedName] = useState('Grey');
  const [matchResult, setMatchResult] = useState(null); // { match, closest, score }
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [savingColor, setSavingColor] = useState(false);
  const [colorSaved, setColorSaved] = useState(false);

  const handleSaveToCloset = async () => {
    if (!auth.currentUser) return;
    setSavingColor(true);
    try {
      await saveWardrobeItem(auth.currentUser.uid, {
        source: 'color_scanner',
        category: 'top', // Default
        hex: detectedHex,
        color_name: detectedName,
        tags: ['scanned_in_store'],
        compatibility_score: matchResult?.score || 0,
      });
      setColorSaved(true);
      window.dispatchEvent(new CustomEvent('sg_wardrobe_updated'));
      setTimeout(() => setColorSaved(false), 3000);
    } catch (e) {
      console.warn('Failed to save scanned color', e);
    }
    setSavingColor(false);
  };

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCameraReady(true);
          };
        }
      } catch (err) {
        setError(err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access.'
          : 'Camera not available on this device.');
      }
    };
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Torch toggle
  const toggleTorch = async () => {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track) {
        await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
        setTorchOn(!torchOn);
      }
    } catch {
      // ignore empty catch
    }
  };

  // Color detection loop
  const detectColor = useCallback(function loop() {
    if (frozen || !videoRef.current || !canvasRef.current || !cameraReady) {
      animRef.current = requestAnimationFrame(loop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.drawImage(video, 0, 0);

    // Sample center 60×60 area
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const sampleSize = 30;
    const imgData = ctx.getImageData(cx - sampleSize, cy - sampleSize, sampleSize * 2, sampleSize * 2);
    const pixels = imgData.data;

    let totalR = 0, totalG = 0, totalB = 0, count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      totalR += pixels[i]; totalG += pixels[i + 1]; totalB += pixels[i + 2]; count++;
    }

    const avgR = Math.round(totalR / count);
    const avgG = Math.round(totalG / count);
    const avgB = Math.round(totalB / count);
    const hex = rgbToHex(avgR, avgG, avgB);

    setDetectedHex(hex);
    setDetectedName(getColorName(hex));

    // Match against saved palette
    if (savedPalette.length > 0) {
      let bestMatch = null, bestDist = Infinity;
      for (const c of savedPalette) {
        const dist = colorDistance(hex, c.hex);
        if (dist < bestDist) { bestDist = dist; bestMatch = c; }
      }
      const score = Math.max(0, Math.min(100, Math.round(100 - bestDist / 4.41)));
      setMatchResult({
        match: score >= 60,
        closest: bestMatch,
        score,
        verdict: score >= 80 ? 'Perfect match!' : score >= 60 ? 'Good match' : score >= 40 ? 'Decent' : 'Not your color',
      });
      // Fire tracking once for high confidence match
      if (score >= 80 && !frozen) {
        trackColorScannerUse('match', hex);
      }
    }

    animRef.current = requestAnimationFrame(loop);
  }, [frozen, cameraReady, savedPalette]);

  useEffect(() => {
    if (cameraReady) {
      animRef.current = requestAnimationFrame(detectColor);
      return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }
  }, [cameraReady, detectColor]);

  // Freeze/unfreeze
  const toggleFreeze = () => {
    setFrozen(!frozen);
    if (!frozen) trackColorScannerUse('scan', detectedHex);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className={`rounded-2xl p-6 text-center border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
          <div className="w-12 h-12 mx-auto mb-3 opacity-30"><IconRenderer icon={FashionIcons.Analysis} /></div>
          <p className={`text-sm font-bold mb-1 ${isDark ? 'text-red-300' : 'text-red-700'}`}>Camera Error</p>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{error}</p>
        </div>
        {onClose && (
          <button onClick={onClose}
            className={`w-full py-2.5 rounded-xl text-xs font-bold border ${isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
            ← Go Back
          </button>
        )}
      </div>
    );
  }

  const cardBg = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
            <span className="w-4 h-4"><IconRenderer icon={FashionIcons.Analysis} /></span> Color Scanner
          </p>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
            Point at clothing to check color match
          </p>
        </div>
        {onClose && (
          <button onClick={onClose}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
            ✕ Close
          </button>
        )}
      </div>

      {/* Camera View */}
      <div className={`relative rounded-2xl overflow-hidden ${cardBg}`}>
        <video ref={videoRef} autoPlay playsInline muted className="w-full block" style={{ maxHeight: '55vh' }} />
        <canvas ref={canvasRef} className="hidden" />

        {/* Center crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-16 h-16 border-2 border-white rounded-xl shadow-lg"
            style={{ boxShadow: `0 0 20px ${detectedHex}80` }} />
        </div>

        {/* Detected color badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
          <div className="w-8 h-8 rounded-lg border-2 border-white/30 shadow-lg" style={{ backgroundColor: detectedHex }} />
          <div>
            <p className="text-white text-xs font-bold">{detectedName}</p>
            <p className="text-white/50 text-[10px] font-mono">{detectedHex}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button onClick={toggleTorch}
            className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md border transition-all ${torchOn ? 'bg-yellow-500/40 border-yellow-400 text-yellow-200' : 'bg-black/40 border-white/10 text-white/70'
              }`}><IconRenderer icon={FashionIcons.Sun} className="w-5 h-5" /></button>
          <button onClick={toggleFreeze}
            className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md border transition-all ${frozen ? 'bg-blue-500/40 border-blue-400 text-blue-200' : 'bg-black/40 border-white/10 text-white/70'
              }`}><IconRenderer icon={frozen ? FashionIcons.Shirt : FashionIcons.Wardrobe} className="w-5 h-5" /></button>
        </div>

        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white text-sm">Opening camera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Match Result */}
      {matchResult && (
        <div className={`rounded-2xl p-4 border ${matchResult.match
            ? isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
            : isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
          }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-lg font-bold flex items-center gap-2 ${matchResult.match ? 'text-green-400' : isDark ? 'text-red-300' : 'text-red-600'}`}>
               <span className="w-5 h-5"><IconRenderer icon={matchResult.match ? FashionIcons.Accuracy : FashionIcons.Analysis} /></span> {matchResult.verdict}
            </span>
            <span className={`text-xs font-black px-2 py-1 rounded-full ${matchResult.score >= 60 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>{matchResult.score}%</span>
          </div>

          {/* Harmony bar */}
          <div className={`w-full h-2.5 rounded-full overflow-hidden mb-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${matchResult.score}%`,
                backgroundColor: matchResult.score >= 60 ? '#22c55e' : '#ef4444',
              }} />
          </div>

          {matchResult.closest && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg border border-white/20" style={{ backgroundColor: matchResult.closest.hex }} />
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                Closest in your palette: <strong>{matchResult.closest.name}</strong>
              </p>
            </div>
          )}

          {matchResult.match && (
            <button
              onClick={handleSaveToCloset}
              disabled={savingColor || colorSaved}
              className={`w-full mt-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                colorSaved 
                  ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
                  : isDark ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' : 'bg-gray-900 hover:bg-gray-800 text-white shadow-md'
              }`}
            >
              {savingColor ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : colorSaved ? (
                '✅ Saved to Closet'
              ) : (
                '👗 Save to Smart Closet'
              )}
            </button>
          )}
        </div>
      )}

      {/* Your Palette Reference */}
      {savedPalette.length > 0 && (
        <div className={`rounded-2xl p-3 border ${cardBg}`}>
          <p className={`text-xs font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
             <span className="w-4 h-4"><IconRenderer icon={FashionIcons.Analysis} /></span> {t('savedColors') || 'Your Color Palette'}
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {savedPalette.map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 rounded-lg border border-white/20 shadow-sm" style={{ backgroundColor: c.hex }} />
                <span className={`text-[8px] max-w-[40px] truncate ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pro tip */}
      <div className={`rounded-2xl p-3 border flex items-start gap-3 ${isDark ? 'bg-purple-900/20 border-purple-700/20' : 'bg-purple-50 border-purple-200'}`}>
        <span className="w-5 h-5 flex-shrink-0"><IconRenderer icon={FashionIcons.Bulb} className="text-purple-400" /></span>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
          Point the camera at any clothing item. The center square detects the color and checks if it matches your personal palette. Use 🔦 for dark stores and ⏸ to freeze the frame.
        </p>
      </div>
    </div>
  );
}

export default ColorScanner;
