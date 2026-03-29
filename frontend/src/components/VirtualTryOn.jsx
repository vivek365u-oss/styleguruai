// ============================================================
// StyleGuru — Virtual Try-On (Color Draping) — ENHANCED v2
// Canvas-based color overlay with outfit combos, before/after
// slider, T-shirt silhouette, and wardrobe save
// ============================================================
import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { ThemeContext } from '../App';
import { auth, saveWardrobeItem } from '../api/styleApi';

// ── Hex helpers ─────────────────────────────────────────────
function hexToRgb(hex) {
  if (!hex || hex.length < 7) return { r: 128, g: 128, b: 128 };
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function colorHarmonyScore(hex1, hex2) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  const diff = Math.sqrt((c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2);
  return Math.max(0, Math.min(100, Math.round(100 - diff / 4.41)));
}

// ── T-shirt silhouette path ─────────────────────────────────
function drawTshirtShape(ctx, cw, ch, startY, color, opacity) {
  const { r, g, b } = hexToRgb(color);
  ctx.save();
  ctx.beginPath();

  // Neck curve
  const neckW = cw * 0.18;
  const neckY = startY;
  const shoulderY = startY + ch * 0.04;
  const sleeveEndY = startY + ch * 0.14;
  const bodyEndY = ch;

  // Left shoulder to neck
  ctx.moveTo(0, shoulderY);
  ctx.lineTo(cw * 0.15, shoulderY);
  // Left sleeve up
  ctx.lineTo(cw * 0.22, neckY);
  // Neck curve
  ctx.quadraticCurveTo(cw * 0.5, neckY - ch * 0.03, cw * 0.78, neckY);
  // Right sleeve
  ctx.lineTo(cw * 0.85, shoulderY);
  ctx.lineTo(cw, shoulderY);
  // Right side down
  ctx.lineTo(cw, bodyEndY);
  // Bottom
  ctx.lineTo(0, bodyEndY);
  ctx.closePath();

  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  ctx.fill();

  // Add fabric texture effect
  ctx.globalCompositeOperation = 'overlay';
  const grad = ctx.createLinearGradient(0, neckY, 0, bodyEndY);
  grad.addColorStop(0, `rgba(255,255,255,0.08)`);
  grad.addColorStop(0.3, `rgba(0,0,0,0.03)`);
  grad.addColorStop(0.6, `rgba(255,255,255,0.05)`);
  grad.addColorStop(1, `rgba(0,0,0,0.08)`);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle collar shadow
  ctx.globalCompositeOperation = 'source-over';
  const collarGrad = ctx.createLinearGradient(0, neckY - 2, 0, neckY + ch * 0.03);
  collarGrad.addColorStop(0, `rgba(0,0,0,0.15)`);
  collarGrad.addColorStop(1, `rgba(0,0,0,0)`);
  ctx.fillStyle = collarGrad;
  ctx.beginPath();
  ctx.moveTo(cw * 0.22, neckY);
  ctx.quadraticCurveTo(cw * 0.5, neckY - ch * 0.03, cw * 0.78, neckY);
  ctx.lineTo(cw * 0.78, neckY + ch * 0.03);
  ctx.quadraticCurveTo(cw * 0.5, neckY, cw * 0.22, neckY + ch * 0.03);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ── Gradient drape overlay ──────────────────────────────────
function drawGradientDrape(ctx, cw, ch, drapeStart, color, opacity) {
  const { r, g, b } = hexToRgb(color);
  const drapeY = ch * drapeStart;
  const fadeZone = ch * 0.12;

  // Gradient zone
  const gradient = ctx.createLinearGradient(0, drapeY - fadeZone, 0, drapeY + fadeZone);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
  gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${opacity * 0.5})`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${opacity})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, drapeY - fadeZone, cw, fadeZone * 2);

  // Solid below
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  ctx.fillRect(0, drapeY + fadeZone, cw, ch - drapeY - fadeZone);
}

// ── Enhanced Canvas Engine ──────────────────────────────────
function useDrapingEngine(canvasRef, imageSrc, color, opacity, drapeStart, drapeMode) {
  const imageRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imageRef.current = img; setReady(true); };
    img.onerror = () => setReady(false);
    img.src = imageSrc;
  }, [imageSrc]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);

    if (!color) return;

    if (drapeMode === 'tshirt') {
      // T-shirt silhouette mode
      ctx.globalCompositeOperation = 'multiply';
      drawTshirtShape(ctx, cw, ch, ch * drapeStart, color, opacity);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      // Gradient drape mode
      ctx.globalCompositeOperation = 'multiply';
      drawGradientDrape(ctx, cw, ch, drapeStart, color, opacity);

      // Vibrancy overlay
      ctx.globalCompositeOperation = 'source-atop';
      const { r, g, b } = hexToRgb(color);
      const drapeY = ch * drapeStart;
      const fadeZone = ch * 0.12;
      const oGrad = ctx.createLinearGradient(0, drapeY - fadeZone, 0, drapeY + fadeZone);
      oGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
      oGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${opacity * 0.2})`);
      ctx.fillStyle = oGrad;
      ctx.fillRect(0, drapeY - fadeZone, cw, fadeZone * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.2})`;
      ctx.fillRect(0, drapeY + fadeZone, cw, ch - drapeY - fadeZone);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Bottom vignette
    const vGrad = ctx.createLinearGradient(0, ch - 50, 0, ch);
    vGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, ch - 50, cw, 50);

  }, [canvasRef, color, opacity, drapeStart, drapeMode, ready]);

  useEffect(() => { if (ready) draw(); }, [ready, draw]);

  return { ready, redraw: draw };
}

// ── Before/After Swipe Slider ───────────────────────────────
function BeforeAfterSlider({ uploadedImage, drapedCanvas, canvasSize, isDark }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current || !dragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleMouseDown = () => { dragging.current = true; };
  const handleMouseUp = () => { dragging.current = false; };

  useEffect(() => {
    const onMove = (e) => handleMove(e.clientX);
    const onTouchMove = (e) => handleMove(e.touches[0].clientX);
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [handleMove]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden cursor-col-resize select-none"
      style={{ width: '100%', aspectRatio: `${canvasSize.w}/${canvasSize.h}` }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* Original (left side) */}
      <img
        src={uploadedImage}
        alt="Original"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Draped (right side) visible through clip */}
      {drapedCanvas && (
        <img
          src={drapedCanvas}
          alt="With color"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
        />
      )}
      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-purple-400">
          <span className="text-purple-600 text-sm font-bold">⟷</span>
        </div>
      </div>
      {/* Labels */}
      <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10">
        <span className="text-[10px] text-white font-bold">ORIGINAL</span>
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-purple-600/80 backdrop-blur-sm border border-purple-400/30">
        <span className="text-[10px] text-white font-bold">WITH COLOR</span>
      </div>
    </div>
  );
}

// ── Outfit Combo Previewer ──────────────────────────────────
function OutfitComboCard({ combo, skinHex, isDark, onSelect }) {
  if (!combo) return null;
  const shirtHex = combo.shirtHex || '#6d28d9';
  const pantHex = combo.pantHex || '#1e293b';
  const score = colorHarmonyScore(skinHex, shirtHex);

  return (
    <button
      onClick={() => onSelect(combo)}
      className={`flex-shrink-0 rounded-2xl p-3 border transition-all hover:scale-[1.03] active:scale-[0.97] min-w-[140px] ${
        isDark ? 'bg-white/5 border-white/10 hover:border-purple-500/40' : 'bg-white border-gray-200 hover:border-purple-400 shadow-sm'
      }`}
    >
      {/* Visual outfit preview */}
      <div className="flex flex-col items-center gap-1 mb-2">
        {/* Shirt block */}
        <div className="w-16 h-10 rounded-lg border border-white/20 shadow-sm relative overflow-hidden"
          style={{ backgroundColor: shirtHex }}>
          <div className="absolute inset-x-0 top-0 h-2" style={{
            background: `linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)`
          }} />
          <span className="absolute inset-0 flex items-center justify-center text-xs">👕</span>
        </div>
        {/* Pant block */}
        <div className="w-12 h-14 rounded-lg border border-white/20 shadow-sm relative overflow-hidden"
          style={{ backgroundColor: pantHex }}>
          <span className="absolute inset-0 flex items-center justify-center text-xs">👖</span>
        </div>
      </div>
      <p className={`text-[10px] font-bold text-center truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
        {combo.label || 'Outfit'}
      </p>
      <div className={`mt-1 text-center text-[9px] font-bold px-2 py-0.5 rounded-full ${
        score >= 70 ? 'bg-green-500/20 text-green-400' : score >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
      }`}>
        {score}% match
      </div>
    </button>
  );
}

// ── Color Harmony Meter ─────────────────────────────────────
function HarmonyMeter({ skinHex, colorHex, isDark }) {
  const score = colorHarmonyScore(skinHex, colorHex);
  const barColor = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  const label = score >= 80 ? 'Perfect Match' : score >= 60 ? 'Great Choice' : score >= 40 ? 'Decent' : 'Not Ideal';
  const emoji = score >= 80 ? '🔥' : score >= 60 ? '✅' : score >= 40 ? '🤔' : '❌';

  return (
    <div className={`rounded-2xl p-3 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>🎯 Skin-Color Harmony</p>
        <span className="text-sm">{emoji}</span>
      </div>
      <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${score}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-[10px] font-bold ${isDark ? 'text-white/60' : 'text-gray-500'}`}>{label}</span>
        <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{score}%</span>
      </div>
    </div>
  );
}

// ================================================================
// ████  MAIN COMPONENT  ████
// ================================================================
function VirtualTryOn({
  uploadedImage, bestColors = [], avoidColors = [], pantColors = [],
  outfitCombos = [], gender, skinTone, skinHex, onSaveToWardrobe
}) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const canvasRef = useRef(null);

  // State
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mode, setMode] = useState('best'); // 'best' | 'avoid' | 'combo'
  const [opacity, setOpacity] = useState(0.50);
  const [drapeStart, setDrapeStart] = useState(0.36);
  const [drapeMode, setDrapeMode] = useState('tshirt'); // 'tshirt' | 'drape'
  const [viewMode, setViewMode] = useState('live'); // 'live' | 'compare'
  const [canvasSize, setCanvasSize] = useState({ w: 360, h: 480 });
  const [drapedImage, setDrapedImage] = useState(null);
  const [savedToast, setSavedToast] = useState(null);
  const [activeCombo, setActiveCombo] = useState(null);

  const colors = mode === 'best' ? bestColors : mode === 'avoid' ? avoidColors : bestColors;
  const currentColor = colors[selectedIdx];
  const currentHex = activeCombo ? activeCombo.shirtHex : (currentColor?.hex || '#6d28d9');
  const currentName = activeCombo ? activeCombo.label : (currentColor?.name || 'Purple');

  // Derived skin hex (fallback)
  const effectiveSkinHex = skinHex || '#C68642';

  // Responsive canvas
  useEffect(() => {
    const update = () => {
      const w = Math.min(window.innerWidth - 32, 400);
      setCanvasSize({ w, h: Math.round(w * 1.33) });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Canvas engine
  const { ready, redraw } = useDrapingEngine(
    canvasRef, uploadedImage, currentHex, opacity, drapeStart, drapeMode
  );

  // Capture draped image for before/after slider
  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    const timer = setTimeout(() => {
      try { setDrapedImage(canvasRef.current.toDataURL('image/png')); } catch {}
    }, 100);
    return () => clearTimeout(timer);
  }, [ready, currentHex, opacity, drapeStart, drapeMode]);

  // Navigate
  const prev = () => {
    setActiveCombo(null);
    setSelectedIdx((i) => (i > 0 ? i - 1 : colors.length - 1));
  };
  const next = () => {
    setActiveCombo(null);
    setSelectedIdx((i) => (i < colors.length - 1 ? i + 1 : 0));
  };

  useEffect(() => { setSelectedIdx(0); setActiveCombo(null); }, [mode]);

  // Download
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `styleguruai-tryon-${currentName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // WhatsApp share
  const handleShare = () => {
    const msg = `👤 Virtual Try-On on StyleGuru AI!\n\n🎨 I tried "${currentName}" and it looks ${mode === 'best' ? 'amazing' : 'interesting'} on my ${skinTone} skin!\n🎯 Harmony Score: ${colorHarmonyScore(effectiveSkinHex, currentHex)}%\n\nTry yours free 👇\nhttps://www.styleguruai.in`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Save to wardrobe
  const handleSaveToWardrobe = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setSavedToast('Login to save outfits'); setTimeout(() => setSavedToast(null), 2500); return; }
    try {
      await saveWardrobeItem(uid, {
        skin_hex: effectiveSkinHex,
        skin_tone: skinTone,
        source: 'virtual_tryon',
        outfit_data: {
          shirt: currentName,
          shirt_hex: currentHex,
          ...(activeCombo ? { pant: activeCombo.pantName, pant_hex: activeCombo.pantHex } : {}),
          ...(activeCombo ? { occasion: activeCombo.occasion } : {}),
        },
        compatibility_score: colorHarmonyScore(effectiveSkinHex, currentHex),
      });
      setSavedToast('✅ Saved to your wardrobe!');
    } catch {
      setSavedToast('❌ Could not save — try again');
    }
    setTimeout(() => setSavedToast(null), 2500);
  };

  // No image
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

  // Build outfit combo data from recommendation colors
  const comboData = outfitCombos.length > 0
    ? outfitCombos
    : bestColors.slice(0, 5).map((shirt, i) => ({
        label: `${shirt.name} + ${(pantColors[i] || pantColors[0] || { name: 'Dark' }).name}`,
        shirtHex: shirt.hex,
        shirtName: shirt.name,
        pantHex: (pantColors[i] || pantColors[0] || { hex: '#1e293b' }).hex,
        pantName: (pantColors[i] || pantColors[0] || { name: 'Navy' }).name,
        occasion: i === 0 ? 'Casual' : i === 1 ? 'Office' : i === 2 ? 'Party' : i === 3 ? 'Date' : 'Wedding',
      }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
          ✨ Virtual Color Draping
        </p>
        <p className={`text-xs mt-1 ${labelCls}`}>See how colors look against your skin</p>
      </div>

      {/* View Mode: Live vs Before/After */}
      <div className={`flex rounded-xl p-0.5 gap-0.5 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
        <button
          onClick={() => setViewMode('live')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'live'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
              : isDark ? 'text-white/40' : 'text-gray-400'
          }`}
        >🎨 Live Preview</button>
        <button
          onClick={() => setViewMode('compare')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'compare'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
              : isDark ? 'text-white/40' : 'text-gray-400'
          }`}
        >⟷ Before / After</button>
      </div>

      {/* Canvas / Comparison View */}
      {viewMode === 'live' ? (
        <div className={`relative rounded-2xl overflow-hidden ${cardBg}`}>
          {/* Drape mode toggle */}
          <div className="absolute top-3 right-3 z-10 flex gap-1">
            <button
              onClick={() => setDrapeMode(drapeMode === 'tshirt' ? 'drape' : 'tshirt')}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border backdrop-blur-md transition-all ${
                isDark ? 'bg-black/40 border-white/20 text-white/70 hover:text-white' : 'bg-white/80 border-gray-300 text-gray-600'
              }`}
            >
              {drapeMode === 'tshirt' ? '👕 T-Shirt' : '🎨 Drape'}
            </button>
          </div>

          {/* Color name badge */}
          <div className={`absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl backdrop-blur-md border ${
            mode === 'avoid'
              ? 'bg-red-500/30 border-red-500/30'
              : isDark ? 'bg-black/40 border-white/20' : 'bg-white/80 border-gray-300'
          }`}>
            <span className={`text-xs font-bold ${mode === 'avoid' ? 'text-red-200' : isDark ? 'text-white' : 'text-gray-800'}`}>
              {mode === 'avoid' ? '🚫 ' : ''}{currentName}
            </span>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            className="w-full block"
            style={{ maxHeight: '60vh' }}
          />

          {/* Nav arrows */}
          <button onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white text-lg hover:bg-black/60 transition-all active:scale-90 border border-white/10">‹</button>
          <button onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white text-lg hover:bg-black/60 transition-all active:scale-90 border border-white/10">›</button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {colors.slice(0, 10).map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${i === selectedIdx ? 'w-6 h-2 bg-white shadow-lg' : 'w-2 h-2 bg-white/40'}`} />
            ))}
          </div>
        </div>
      ) : (
        <BeforeAfterSlider
          uploadedImage={uploadedImage}
          drapedCanvas={drapedImage}
          canvasSize={canvasSize}
          isDark={isDark}
        />
      )}

      {/* Hidden canvas for compare mode rendering */}
      {viewMode === 'compare' && (
        <canvas ref={canvasRef} width={canvasSize.w} height={canvasSize.h} className="hidden" />
      )}

      {/* Color Harmony Meter */}
      <HarmonyMeter skinHex={effectiveSkinHex} colorHex={currentHex} isDark={isDark} />

      {/* Mode Toggle: Best / Avoid / Combos */}
      <div className={`flex rounded-2xl p-1 gap-1 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
        <button
          onClick={() => setMode('best')}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
            mode === 'best' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' : isDark ? 'text-white/40' : 'text-gray-400'
          }`}
        >✅ Best ({bestColors.length})</button>
        <button
          onClick={() => setMode('avoid')}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
            mode === 'avoid' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg' : isDark ? 'text-white/40' : 'text-gray-400'
          }`}
        >🚫 Avoid ({avoidColors.length})</button>
        <button
          onClick={() => setMode('combo')}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
            mode === 'combo' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : isDark ? 'text-white/40' : 'text-gray-400'
          }`}
        >👔 Combos</button>
      </div>

      {/* Outfit Combos Row */}
      {mode === 'combo' && comboData.length > 0 && (
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${labelCls}`}>👔 Tap an outfit to preview</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {comboData.map((combo, i) => (
              <OutfitComboCard
                key={i}
                combo={combo}
                skinHex={effectiveSkinHex}
                isDark={isDark}
                onSelect={(c) => { setActiveCombo(c); }}
              />
            ))}
          </div>
          {activeCombo && (
            <div className={`mt-2 rounded-xl p-3 border flex items-center gap-3 ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
              <div className="flex gap-1">
                <div className="w-8 h-8 rounded-lg border border-white/20" style={{ backgroundColor: activeCombo.shirtHex }} />
                <span className={`text-lg self-center ${isDark ? 'text-white/30' : 'text-gray-300'}`}>+</span>
                <div className="w-8 h-8 rounded-lg border border-white/20" style={{ backgroundColor: activeCombo.pantHex }} />
              </div>
              <div className="flex-1">
                <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{activeCombo.label}</p>
                <p className={`text-[10px] ${labelCls}`}>📅 {activeCombo.occasion}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Color Swatch Bar (for best/avoid modes) */}
      {mode !== 'combo' && (
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${labelCls}`}>
            {mode === 'best' ? '✨ Tap a color to try it on' : '🚫 See why to avoid these'}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {colors.map((color, i) => (
              <button
                key={color.hex + i}
                onClick={() => { setSelectedIdx(i); setActiveCombo(null); }}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-2 py-2 rounded-xl border transition-all duration-200 ${
                  i === selectedIdx && !activeCombo
                    ? mode === 'avoid'
                      ? 'border-red-400 bg-red-500/20 scale-105 shadow-lg'
                      : 'border-purple-400 bg-purple-500/20 scale-105 shadow-lg'
                    : isDark ? 'border-white/10 bg-white/5 hover:border-white/30' : 'border-gray-200 bg-white hover:border-purple-300 shadow-sm'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl shadow-md border transition-transform ${
                    i === selectedIdx && !activeCombo ? 'scale-110 border-white/40' : 'border-white/20'
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
                <span className={`text-[10px] font-semibold max-w-[60px] truncate ${
                  i === selectedIdx && !activeCombo ? isDark ? 'text-white' : 'text-gray-900' : isDark ? 'text-white/50' : 'text-gray-500'
                }`}>{color.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls: Intensity + Drape Position (collapsed) */}
      <details className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        <summary className={`px-4 py-3 text-xs font-bold cursor-pointer flex items-center justify-between ${headingCls}`}>
          <span>⚙️ Adjust Drape Settings</span>
          <span className={`text-[10px] ${labelCls}`}>Tap to expand</span>
        </summary>
        <div className="px-4 pb-4 space-y-4">
          {/* Intensity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className={`text-xs font-semibold ${headingCls}`}>🎚️ Intensity</p>
              <span className={`text-xs font-mono ${labelCls}`}>{Math.round(opacity * 100)}%</span>
            </div>
            <input type="range" min="15" max="75" value={opacity * 100}
              onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, ${currentHex}33 0%, ${currentHex} 100%)` }} />
          </div>
          {/* Position */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className={`text-xs font-semibold ${headingCls}`}>📏 Position</p>
              <span className={`text-xs font-mono ${labelCls}`}>{Math.round(drapeStart * 100)}%</span>
            </div>
            <input type="range" min="20" max="55" value={drapeStart * 100}
              onChange={(e) => setDrapeStart(parseInt(e.target.value) / 100)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-purple-500/30 to-pink-500/30" />
          </div>
        </div>
      </details>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-2xl text-green-400 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
          <span>📱</span><span>Share</span>
        </button>
        <button onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-2xl text-purple-400 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
          <span>💾</span><span>Save Image</span>
        </button>
        <button onClick={handleSaveToWardrobe}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 rounded-2xl text-pink-400 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
          <span>👗</span><span>Wardrobe</span>
        </button>
      </div>

      {/* Pro tip */}
      <div className={`rounded-2xl p-3 border flex items-start gap-3 ${isDark ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-700/20' : 'bg-purple-50 border-purple-200'}`}>
        <span className="text-lg flex-shrink-0">💡</span>
        <div>
          <p className={`text-xs font-bold mb-0.5 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>How to use</p>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
            Switch between 👕 T-Shirt and 🎨 Drape modes • Use ⟷ Before/After to compare • Tap 👔 Combos to preview full outfits • Save favorites to your wardrobe!
          </p>
        </div>
      </div>

      {/* Toast */}
      {savedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-bold px-5 py-3 rounded-full shadow-2xl border border-white/10 animate-bounce">
          {savedToast}
        </div>
      )}
    </div>
  );
}

export default VirtualTryOn;
