// ============================================================
// StyleGuru — Virtual Try-On (Color Draping)
// Canvas-based color overlay on user's selfie
// ============================================================
import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { ThemeContext } from '../App';

// ── Hex to RGBA helper ──────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// ── Canvas Color Draping Engine ─────────────────────────────
function useColorDraping(canvasRef, imageSrc, selectedColor, opacity, drapeStart) {
  const imageRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Load image once
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setReady(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw canvas whenever color or opacity changes
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    const cw = canvas.width;
    const ch = canvas.height;

    // Clear
    ctx.clearRect(0, 0, cw, ch);

    // 1. Draw the original selfie
    ctx.drawImage(img, 0, 0, cw, ch);

    // 2. Create the color drape with gradient mask
    if (!selectedColor) return;
    const { r, g, b } = hexToRgb(selectedColor);

    // Drape zone: from drapeStart% of height to bottom
    const drapeY = ch * drapeStart;
    const fadeZone = ch * 0.12; // smooth fade-in zone

    // Create off-screen canvas for the drape
    const drapeCanvas = document.createElement('canvas');
    drapeCanvas.width = cw;
    drapeCanvas.height = ch;
    const dCtx = drapeCanvas.getContext('2d');

    // Draw gradient mask
    const gradient = dCtx.createLinearGradient(0, drapeY - fadeZone, 0, drapeY + fadeZone);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${opacity * 0.5})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${opacity})`);

    // Fill gradient zone
    dCtx.fillStyle = gradient;
    dCtx.fillRect(0, drapeY - fadeZone, cw, fadeZone * 2);

    // Fill solid below gradient
    dCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    dCtx.fillRect(0, drapeY + fadeZone, cw, ch - drapeY - fadeZone);

    // 3. Compose with multiply blend for realistic look
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(drapeCanvas, 0, 0);

    // 4. Add a subtle color overlay for vibrancy
    ctx.globalCompositeOperation = 'source-atop';
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = cw;
    overlayCanvas.height = ch;
    const oCtx = overlayCanvas.getContext('2d');

    const oGradient = oCtx.createLinearGradient(0, drapeY - fadeZone, 0, drapeY + fadeZone);
    oGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    oGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${opacity * 0.25})`);
    oCtx.fillStyle = oGradient;
    oCtx.fillRect(0, drapeY - fadeZone, cw, fadeZone * 2);
    oCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.25})`;
    oCtx.fillRect(0, drapeY + fadeZone, cw, ch - drapeY - fadeZone);

    ctx.drawImage(overlayCanvas, 0, 0);

    // Reset composite
    ctx.globalCompositeOperation = 'source-over';

    // 5. Add subtle vignette at bottom for polish
    const vGrad = ctx.createLinearGradient(0, ch - 40, 0, ch);
    vGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, ch - 40, cw, 40);

  }, [canvasRef, selectedColor, opacity, drapeStart, ready]);

  useEffect(() => {
    if (ready) draw();
  }, [ready, draw]);

  return { ready, redraw: draw };
}

// ── Main VirtualTryOn Component ─────────────────────────────
function VirtualTryOn({ uploadedImage, bestColors = [], avoidColors = [], gender, skinTone }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const canvasRef = useRef(null);

  // State
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mode, setMode] = useState('best'); // 'best' | 'avoid'
  const [opacity, setOpacity] = useState(0.45);
  const [drapeStart, setDrapeStart] = useState(0.38); // 38% from top = below face
  const [showOriginal, setShowOriginal] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 360, h: 480 });

  const colors = mode === 'best' ? bestColors : avoidColors;
  const currentColor = colors[selectedIdx];
  const currentHex = currentColor?.hex || '#6d28d9';
  const currentName = currentColor?.name || 'Purple';

  // Responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      const w = Math.min(window.innerWidth - 32, 400);
      const h = Math.round(w * 1.33); // 4:3 aspect ratio
      setCanvasSize({ w, h });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Canvas draping engine
  const { ready, redraw } = useColorDraping(
    canvasRef,
    showOriginal ? null : uploadedImage,
    showOriginal ? null : currentHex,
    opacity,
    drapeStart
  );

  // Draw original when toggling
  useEffect(() => {
    if (!canvasRef.current || !uploadedImage) return;
    if (showOriginal) {
      const ctx = canvasRef.current.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
        ctx.drawImage(img, 0, 0, canvasSize.w, canvasSize.h);
      };
      img.src = uploadedImage;
    } else {
      redraw();
    }
  }, [showOriginal, canvasSize]);

  // Navigate colors
  const prev = () => setSelectedIdx((i) => (i > 0 ? i - 1 : colors.length - 1));
  const next = () => setSelectedIdx((i) => (i < colors.length - 1 ? i + 1 : 0));

  // Reset index when switching mode
  useEffect(() => { setSelectedIdx(0); }, [mode]);

  // Download draping image
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `styleguruai-tryon-${currentName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // WhatsApp share
  const handleShare = () => {
    const msg = `👤 Virtual Try-On on StyleGuru AI!\n\n🎨 I tried "${currentName}" and it looks ${mode === 'best' ? 'amazing' : 'not great'} on my ${skinTone} skin tone!\n\nTry yours free 👇\nhttps://www.styleguruai.in`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Touch swipe on color bar
  const colorBarRef = useRef(null);

  // No image state
  if (!uploadedImage) {
    return (
      <div className="text-center py-10">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
          <span className="text-4xl">👤</span>
        </div>
        <h3 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Virtual Try-On</h3>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Upload a selfie first to try on colors</p>
      </div>
    );
  }

  if (colors.length === 0) {
    return (
      <div className="text-center py-10">
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>No colors available to try on</p>
      </div>
    );
  }

  const cardBg = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const labelCls = isDark ? 'text-white/50' : 'text-gray-500';
  const headingCls = isDark ? 'text-white' : 'text-gray-800';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
          ✨ Virtual Color Draping
        </p>
        <p className={`text-xs mt-1 ${labelCls}`}>See how colors look against your skin</p>
      </div>

      {/* Canvas Preview */}
      <div className={`relative rounded-2xl overflow-hidden ${cardBg}`}>
        {/* Toggle Original / Drape */}
        <button
          onMouseDown={() => setShowOriginal(true)}
          onMouseUp={() => setShowOriginal(false)}
          onMouseLeave={() => setShowOriginal(false)}
          onTouchStart={() => setShowOriginal(true)}
          onTouchEnd={() => setShowOriginal(false)}
          className={`absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md transition-all ${
            showOriginal
              ? isDark ? 'bg-purple-500/40 border-purple-400 text-white' : 'bg-purple-600 border-purple-600 text-white'
              : isDark ? 'bg-black/40 border-white/20 text-white/70 hover:text-white' : 'bg-white/80 border-gray-300 text-gray-600'
          }`}
        >
          {showOriginal ? '👁️ Original' : '👆 Hold to compare'}
        </button>

        {/* Color name badge */}
        <div className={`absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl backdrop-blur-md border ${
          mode === 'avoid'
            ? 'bg-red-500/30 border-red-500/30 text-red-200'
            : isDark ? 'bg-black/40 border-white/20' : 'bg-white/80 border-gray-300'
        }`}>
          <span className={`text-xs font-bold ${mode === 'avoid' ? '' : isDark ? 'text-white' : 'text-gray-800'}`}>
            {mode === 'avoid' ? '🚫 ' : ''}{currentName}
          </span>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="w-full block rounded-2xl"
          style={{ maxHeight: '65vh' }}
        />

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white text-lg hover:bg-black/60 transition-all active:scale-90 border border-white/10"
        >
          ‹
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white text-lg hover:bg-black/60 transition-all active:scale-90 border border-white/10"
        >
          ›
        </button>

        {/* Color indicator dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {colors.slice(0, 10).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === selectedIdx
                  ? 'w-6 h-2 bg-white shadow-lg'
                  : 'w-2 h-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Color Feedback */}
      <div className={`rounded-2xl p-3 text-center border ${
        mode === 'avoid'
          ? isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
          : isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-lg border border-white/30 shadow-sm" style={{ backgroundColor: currentHex }} />
          <span className={`text-sm font-bold ${
            mode === 'avoid'
              ? isDark ? 'text-red-300' : 'text-red-700'
              : isDark ? 'text-green-300' : 'text-green-700'
          }`}>
            {mode === 'avoid' ? `🚫 ${currentName} — Avoid this color` : `✅ ${currentName} — Great match!`}
          </span>
        </div>
        {currentColor?.reason && (
          <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{currentColor.reason}</p>
        )}
      </div>

      {/* Mode Toggle: Best vs Avoid */}
      <div className={`flex rounded-2xl p-1 gap-1 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
        <button
          onClick={() => setMode('best')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            mode === 'best'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span>✅</span><span>Best Colors ({bestColors.length})</span>
        </button>
        <button
          onClick={() => setMode('avoid')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            mode === 'avoid'
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg'
              : isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span>🚫</span><span>Avoid ({avoidColors.length})</span>
        </button>
      </div>

      {/* Color Swatch Bar */}
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${labelCls}`}>
          {mode === 'best' ? '✨ Tap a color to try it on' : '🚫 See why to avoid these'}
        </p>
        <div
          ref={colorBarRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          {colors.map((color, i) => (
            <button
              key={color.hex + i}
              onClick={() => setSelectedIdx(i)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-2 py-2 rounded-xl border transition-all duration-200 ${
                i === selectedIdx
                  ? mode === 'avoid'
                    ? 'border-red-400 bg-red-500/20 scale-105 shadow-lg'
                    : 'border-purple-400 bg-purple-500/20 scale-105 shadow-lg'
                  : isDark ? 'border-white/10 bg-white/5 hover:border-white/30' : 'border-gray-200 bg-white hover:border-purple-300 shadow-sm'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl shadow-md border transition-transform ${
                  i === selectedIdx ? 'scale-110 border-white/40' : 'border-white/20'
                }`}
                style={{ backgroundColor: color.hex }}
              />
              <span className={`text-[10px] font-semibold max-w-[60px] truncate ${
                i === selectedIdx
                  ? isDark ? 'text-white' : 'text-gray-900'
                  : isDark ? 'text-white/50' : 'text-gray-500'
              }`}>
                {color.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Intensity Slider */}
      <div className={`rounded-2xl p-4 border ${cardBg}`}>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-bold ${headingCls}`}>🎚️ Color Intensity</p>
          <span className={`text-xs font-mono ${labelCls}`}>{Math.round(opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="15"
          max="75"
          value={opacity * 100}
          onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${currentHex}33 0%, ${currentHex} 100%)`,
          }}
        />
        <div className="flex justify-between mt-1">
          <span className={`text-[10px] ${labelCls}`}>Subtle</span>
          <span className={`text-[10px] ${labelCls}`}>Bold</span>
        </div>
      </div>

      {/* Drape Position Slider */}
      <div className={`rounded-2xl p-4 border ${cardBg}`}>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-bold ${headingCls}`}>📏 Drape Position</p>
          <span className={`text-xs font-mono ${labelCls}`}>{Math.round(drapeStart * 100)}%</span>
        </div>
        <input
          type="range"
          min="20"
          max="60"
          value={drapeStart * 100}
          onChange={(e) => setDrapeStart(parseInt(e.target.value) / 100)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-purple-500/30 to-pink-500/30"
        />
        <div className="flex justify-between mt-1">
          <span className={`text-[10px] ${labelCls}`}>Higher (more coverage)</span>
          <span className={`text-[10px] ${labelCls}`}>Lower (less coverage)</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-2xl text-green-400 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>📱</span><span>WhatsApp</span>
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-2xl text-purple-400 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>💾</span><span>Save Image</span>
        </button>
      </div>

      {/* Pro tip */}
      <div className={`rounded-2xl p-3 border flex items-start gap-3 ${isDark ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-700/20' : 'bg-purple-50 border-purple-200'}`}>
        <span className="text-lg flex-shrink-0">💡</span>
        <div>
          <p className={`text-xs font-bold mb-0.5 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Pro Tip</p>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
            Hold the "Compare" button to see your original photo — release to see the color drape. Try both Best and Avoid colors to see the difference!
          </p>
        </div>
      </div>
    </div>
  );
}

export default VirtualTryOn;
