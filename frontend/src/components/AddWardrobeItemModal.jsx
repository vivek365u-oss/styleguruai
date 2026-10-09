import React, { useState, useEffect, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  FASHION_CATEGORIES,
  ALL_CATEGORIES,
  getCategoryLabel,
  getCategoryEmoji,
  getCategoryGroup,
  WARDROBE_SECTIONS
} from '../constants/fashionCategories';
import { compressImage, saveLocalWardrobeImage } from '../utils/indexedDB';
import { saveWardrobeItem, auth } from '../api/styleApi';
import { MASTER_COLORS } from '../utils/colorTheoryEngine';
import { trackWardrobeInteraction } from '../utils/analytics';
import { FashionIcons, IconRenderer } from './Icons';

// ── Color Utilities ───────────────────────────────────────────
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return { r: 128, g: 128, b: 128 };
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16)
    };
  }
  return {
    r: parseInt(clean.slice(0, 2), 16) || 128,
    g: parseInt(clean.slice(2, 4), 16) || 128,
    b: parseInt(clean.slice(4, 6), 16) || 128
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

function colorDistance(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  return Math.sqrt((c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2);
}

function getClosestFashionColor(hex) {
  if (!hex) return { name: 'Custom Hue', hex: '#888888' };
  let best = { name: 'Fashion Hue', hex };
  let minDiff = Infinity;
  for (const item of Object.values(MASTER_COLORS)) {
    const diff = colorDistance(hex, item.hex);
    if (diff < minDiff) {
      minDiff = diff;
      best = item;
    }
  }
  return best;
}

// ── Curated Fashion Swatches for Quick Color Pick ─────────────
const QUICK_SWATCHES = [
  { name: 'Jet Black', hex: '#111111' },
  { name: 'Crisp White', hex: '#FFFFFF' },
  { name: 'Midnight Navy', hex: '#000080' },
  { name: 'Charcoal Grey', hex: '#36454F' },
  { name: 'Slate Grey', hex: '#708090' },
  { name: 'Natural Beige', hex: '#F5F5DC' },
  { name: 'Classic Khaki', hex: '#C3B091' },
  { name: 'Desert Sand', hex: '#C2B280' },
  { name: 'Olive Green', hex: '#556B2F' },
  { name: 'Forest Green', hex: '#228B22' },
  { name: 'Deep Teal', hex: '#008080' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Deep Maroon', hex: '#800000' },
  { name: 'Wine Burgundy', hex: '#722F37' },
  { name: 'Earthy Rust', hex: '#B7410E' },
  { name: 'Terracotta', hex: '#E2725B' },
  { name: 'Mustard Gold', hex: '#E1AD01' },
  { name: 'Warm Peach', hex: '#FFDAB9' },
  { name: 'Dusty Rose', hex: '#DCAE96' },
  { name: 'Rose Pink', hex: '#FF66B2' },
  { name: 'Cool Lavender', hex: '#E6E6FA' },
  { name: 'Rich Plum', hex: '#8E4585' },
  { name: 'Chocolate Brown', hex: '#5C381E' }
];

export default function AddWardrobeItemModal({
  isOpen,
  onClose,
  onItemAdded,
  defaultGender = 'male',
  initialCategory = ''
}) {
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  // Modes: 'photo' (camera/upload) or 'swatch' (color picker)
  const [inputMode, setInputMode] = useState('photo');
  const [selectedGender, setSelectedGender] = useState(defaultGender);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [categorySearch, setCategorySearch] = useState('');

  // Image & Color State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [colorHex, setColorHex] = useState('#111111');
  const [colorName, setColorName] = useState('Jet Black');
  const [customHexInput, setCustomHexInput] = useState('#111111');

  // Garment Attributes
  const [selectedFit, setSelectedFit] = useState('fit_regular');
  const [selectedFabric, setSelectedFabric] = useState('fabric_cotton');
  const [selectedPattern, setSelectedPattern] = useState('pattern_solid');
  const [selectedMood, setSelectedMood] = useState('mood_comfort');
  const [selectedTags, setSelectedTags] = useState(['tag_casual']);

  // UI & Saving State
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showColorCustomizer, setShowColorCustomizer] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Initialize Gender and Saved DNA Palette
  const [userProfile, setUserProfile] = useState({
    skin_tone: 'medium',
    skin_hex: '#C68642',
    undertone: 'warm',
    saved_palette: []
  });

  useEffect(() => {
    try {
      const lastAnalysis = JSON.parse(localStorage.getItem('sg_last_analysis') || '{}');
      const storedGender = localStorage.getItem('sg_gender') || defaultGender;
      if (storedGender) setSelectedGender(storedGender.toLowerCase());

      const skinData = lastAnalysis?.skin_analysis || lastAnalysis?.fullData?.skin_analysis;
      if (skinData) {
        setUserProfile({
          skin_tone: skinData.skin_tone || 'medium',
          skin_hex: skinData.skin_color_hex || '#C68642',
          undertone: skinData.undertone || 'warm',
          saved_palette: lastAnalysis?.best_colors || []
        });
      }
    } catch {
      // Keep defaults
    }
  }, [defaultGender, isOpen]);

  // Reset or Sync when opened
  useEffect(() => {
    if (isOpen) {
      if (initialCategory) setSelectedCategory(initialCategory);
      setErrorMsg('');
    }
  }, [isOpen, initialCategory]);

  // Extract Dominant Color from Image Preview
  const extractDominantColor = (imgElement) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = (canvas.width = 120);
      const height = (canvas.height = 120);
      ctx.drawImage(imgElement, 0, 0, width, height);

      // Sample central 60% of image to avoid background borders
      const startX = Math.floor(width * 0.2);
      const startY = Math.floor(height * 0.2);
      const sampleWidth = Math.floor(width * 0.6);
      const sampleHeight = Math.floor(height * 0.6);
      const imgData = ctx.getImageData(startX, startY, sampleWidth, sampleHeight).data;

      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let i = 0; i < imgData.length; i += 16) { // step by 4 pixels (16 bytes)
        const a = imgData[i + 3];
        if (a < 128) continue;
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        rSum += r;
        gSum += g;
        bSum += b;
        count++;
      }

      if (count > 0) {
        const hex = rgbToHex(rSum / count, gSum / count, bSum / count);
        const match = getClosestFashionColor(hex);
        setColorHex(hex);
        setColorName(match.name);
        setCustomHexInput(hex);
      }
    } catch (e) {
      console.warn('Color extraction fallback', e);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setImagePreview(dataUrl);
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      tempImg.onload = () => extractDominantColor(tempImg);
      tempImg.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSwatch = (swatch) => {
    setColorHex(swatch.hex);
    setColorName(swatch.name);
    setCustomHexInput(swatch.hex);
  };

  const handleCustomHexChange = (e) => {
    const val = e.target.value;
    setCustomHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setColorHex(val);
      const match = getClosestFashionColor(val);
      setColorName(match.name);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // ── Style DNA Harmony Calculator ─────────────────────────────
  // Computes harmony with user's skin undertone / palette
  // NOTE: Score is purely informational and NEVER blocks saving!
  const getHarmonyPreview = () => {
    let baseScore = 75; // Default solid neutral baseline
    let reason = 'A versatile everyday staple that easily pairs with your essentials.';

    const hex = colorHex;
    const { r, g, b } = hexToRgb(hex);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Check distance to user's saved palette
    if (userProfile.saved_palette?.length > 0) {
      let minDist = Infinity;
      for (const item of userProfile.saved_palette) {
        if (item.hex) {
          const d = colorDistance(hex, item.hex);
          if (d < minDist) minDist = d;
        }
      }
      if (minDist < 60) {
        baseScore = 96;
        reason = `Matches perfectly with your signature ${userProfile.undertone} palette!`;
      } else if (minDist < 120) {
        baseScore = 88;
        reason = `Harmonious shade that complements your natural complexion.`;
      } else {
        baseScore = 72;
        reason = `High-contrast statement color. Great for standout styling!`;
      }
    } else {
      // Undertone heuristics
      if (userProfile.undertone === 'warm') {
        if (r > b || (g > 80 && r > 100)) {
          baseScore = 92;
          reason = 'Warm earthy tones naturally radiate against your skin undertone.';
        } else {
          baseScore = 78;
          reason = 'Cool contrast piece. Balance it with warm or neutral accessories.';
        }
      } else if (userProfile.undertone === 'cool') {
        if (b > r || (brightness < 60)) {
          baseScore = 93;
          reason = 'Cool undertone harmony creates striking clarity and focus.';
        } else {
          baseScore = 76;
          reason = 'Bold warm accent. Pair with crisp whites or charcoals.';
        }
      }
    }

    return { score: baseScore, reason };
  };

  const harmony = getHarmonyPreview();

  // ── Category List derivation ─────────────────────────────────
  const activeGenderKey = selectedGender === 'female' ? 'FEMALE' : 'MALE';
  const availableGroups = FASHION_CATEGORIES[activeGenderKey] || FASHION_CATEGORIES.MALE;

  const filteredCategories = [];
  Object.entries(availableGroups).forEach(([groupKey, list]) => {
    const matching = list.filter(c =>
      !categorySearch ||
      c.label.toLowerCase().includes(categorySearch.toLowerCase()) ||
      groupKey.toLowerCase().includes(categorySearch.toLowerCase())
    );
    if (matching.length > 0) {
      filteredCategories.push({
        groupKey,
        meta: WARDROBE_SECTIONS[groupKey] || { label: groupKey, emoji: '👗' },
        items: matching
      });
    }
  });

  // ── Save Handler ─────────────────────────────────────────────
  const handleDirectSave = async () => {
    if (!selectedCategory) {
      setErrorMsg('Please select a clothing category first (e.g. T-Shirt, Jeans, Saree)');
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setErrorMsg('Please log in to save items to your wardrobe');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      let thumbnailBase64 = null;
      const imageId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // Compress photo or fallback
      if (imageFile) {
        try {
          thumbnailBase64 = await compressImage(imageFile, 300);
          await saveLocalWardrobeImage(imageId, thumbnailBase64);
        } catch (err) {
          console.warn('Local image compression fallback', err);
          thumbnailBase64 = imagePreview;
        }
      }

      const itemPayload = {
        source: 'manual_add',
        category: selectedCategory,
        tags: selectedTags,
        fit: selectedFit,
        fabric: selectedFabric,
        pattern: selectedPattern,
        mood: selectedMood,
        gender: selectedGender,
        imageId: thumbnailBase64 ? imageId : null,
        thumbnail: thumbnailBase64 || null,
        hex: colorHex,
        color_name: colorName,
        outfit_data: {
          title: `${colorName} ${getCategoryLabel(selectedCategory)}`,
          colors: [{ name: colorName, hex: colorHex }],
          top: selectedCategory.includes('top') || selectedCategory.includes('shirt') ? getCategoryLabel(selectedCategory) : '',
          bottom: selectedCategory.includes('pant') || selectedCategory.includes('jean') ? getCategoryLabel(selectedCategory) : ''
        },
        skin_tone: userProfile.skin_tone,
        skin_hex: userProfile.skin_hex,
        compatibility_score: harmony.score,
        status: 'available',
        saved_at: new Date().toISOString()
      };

      const savedDoc = await saveWardrobeItem(uid, itemPayload);
      const createdItem = { id: savedDoc?.id || `item_${Date.now()}`, ...itemPayload };

      trackWardrobeInteraction('add', 1);
      window.dispatchEvent(new CustomEvent('sg_wardrobe_updated'));

      if (onItemAdded) onItemAdded(createdItem);
      onClose();
    } catch (err) {
      console.error('Failed to add wardrobe item:', err);
      setErrorMsg('Failed to save item. Please check your internet connection.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 pointer-events-none">
        {/* Full-screen Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="pointer-events-auto fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className={`pointer-events-auto relative z-10 w-full max-w-xl max-h-[92vh] sm:rounded-3xl rounded-t-3xl border shadow-2xl flex flex-col overflow-hidden ${
            isDark ? 'bg-[#0F172A] border-white/10 text-slate-100' : 'bg-white border-purple-100 text-slate-900'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[var(--border-primary)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
                <span className="text-lg">✨</span>
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg tracking-tight leading-snug">
                  Add to Smart Wardrobe
                </h3>
                <p className="text-[11px] opacity-50 font-medium">
                  Catalog your pieces with instant color & style intelligence
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              ✕
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span> {errorMsg}
              </div>
            )}

            {/* STEP 1: Image / Color Swatch Mode Switcher */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  1. Clothing Visual
                </label>
                <div className="flex bg-[var(--bg-accent)] p-0.5 rounded-xl border border-[var(--border-primary)]">
                  <button
                    type="button"
                    onClick={() => setInputMode('photo')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                      inputMode === 'photo'
                        ? 'bg-purple-600 text-white shadow'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    📸 Upload / Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('swatch')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                      inputMode === 'swatch'
                        ? 'bg-purple-600 text-white shadow'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    🎨 Color Swatch
                  </button>
                </div>
              </div>

              {inputMode === 'photo' ? (
                <div>
                  {imagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-black/20 group">
                      <img
                        src={imagePreview}
                        alt="Clothing preview"
                        className="w-full h-44 object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg border-2 border-white shadow-lg cursor-pointer"
                            style={{ backgroundColor: colorHex }}
                            onClick={() => setShowColorCustomizer(!showColorCustomizer)}
                            title="Click to change detected color"
                          />
                          <div className="text-white text-xs">
                            <p className="font-bold flex items-center gap-1.5">
                              {colorName}
                              <button
                                type="button"
                                onClick={() => setShowColorCustomizer(!showColorCustomizer)}
                                className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/20 text-white hover:bg-white/40"
                              >
                                Edit Color
                              </button>
                            </p>
                            <p className="text-[10px] opacity-70">Auto-detected color</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-[11px] font-black uppercase backdrop-blur-sm shadow"
                        >
                          Change Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Take Photo with Camera */}
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-98 ${
                          isDark
                            ? 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300'
                            : 'border-purple-300 bg-purple-50/60 hover:bg-purple-100/60 text-purple-700'
                        }`}
                      >
                        <span className="text-3xl">📷</span>
                        <div className="text-center">
                          <p className="font-black text-xs uppercase tracking-wider">Take Photo</p>
                          <p className="text-[10px] opacity-60">Instant Camera Shot</p>
                        </div>
                      </button>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {/* Upload from Gallery */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-98 ${
                          isDark
                            ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-3xl">🖼️</span>
                        <div className="text-center">
                          <p className="font-black text-xs uppercase tracking-wider">Upload File</p>
                          <p className="text-[10px] opacity-60">From Photo Library</p>
                        </div>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              ) : null}

              {/* Swatch & Color Fine-Tuning Drawer */}
              {(inputMode === 'swatch' || showColorCustomizer) && (
                <div className={`mt-3 p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md border shadow" style={{ backgroundColor: colorHex }} />
                      <span className="text-xs font-black">{colorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorHex}
                        onChange={(e) => {
                          const hex = e.target.value;
                          setColorHex(hex);
                          setCustomHexInput(hex);
                          setColorName(getClosestFashionColor(hex).name);
                        }}
                        className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
                        title="Pick custom hex"
                      />
                      <input
                        type="text"
                        value={customHexInput}
                        onChange={handleCustomHexChange}
                        className="w-20 px-2 py-0.5 rounded text-[11px] font-mono border uppercase bg-transparent"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-2">
                    Popular Fashion Swatches
                  </p>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                    {QUICK_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.name}
                        type="button"
                        onClick={() => handleSelectSwatch(swatch)}
                        className={`h-8 rounded-xl border flex items-center justify-center transition-all hover:scale-110 relative ${
                          colorHex.toLowerCase() === swatch.hex.toLowerCase()
                            ? 'ring-2 ring-purple-500 scale-105 border-white'
                            : 'border-white/20'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.name}
                      >
                        {colorHex.toLowerCase() === swatch.hex.toLowerCase() && (
                          <span className={`text-[10px] font-black ${swatch.hex === '#FFFFFF' ? 'text-black' : 'text-white'}`}>
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: Gender & Category Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  2. Garment Category <span className="text-red-500">*</span>
                </label>
                {/* Gender Toggle */}
                <div className="flex bg-[var(--bg-accent)] p-0.5 rounded-xl border border-[var(--border-primary)]">
                  {['male', 'female'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGender(g)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                        selectedGender === g
                          ? 'bg-purple-600 text-white shadow'
                          : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      {g === 'female' ? '👩 Women' : '👨 Men'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar for Categories */}
              <div className="relative mb-3">
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Filter categories (e.g. T-Shirt, Jeans, Saree, Hoodie)..."
                  className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-purple-500'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500'
                  }`}
                />
                <span className="absolute left-2.5 top-2.5 text-xs opacity-40">🔍</span>
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch('')}
                    className="absolute right-2.5 top-2 text-xs opacity-50 hover:opacity-100"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Grouped Category Chips */}
              <div className="max-h-52 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
                {filteredCategories.length === 0 ? (
                  <p className="text-center py-6 text-xs opacity-40">No matching categories found</p>
                ) : (
                  filteredCategories.map(({ groupKey, meta, items }) => (
                    <div key={groupKey}>
                      <p className={`text-[10px] font-black uppercase tracking-wider mb-1.5 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                        {meta.emoji} {meta.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(cat => {
                          const isSelected = selectedCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                setErrorMsg('');
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95 ${
                                isSelected
                                  ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/30 scale-[1.02]'
                                  : isDark
                                  ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50 hover:border-purple-300'
                              }`}
                            >
                              <span className="text-sm">{cat.emoji || meta.emoji}</span>
                              <span>{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* STEP 3: Smart Attributes (Fit, Fabric, Pattern, Mood) */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider opacity-60 mb-2">
                3. Garment Attributes
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Fit */}
                <div>
                  <span className="text-[9px] font-black uppercase opacity-50 block mb-1">Fit</span>
                  <select
                    value={selectedFit}
                    onChange={(e) => setSelectedFit(e.target.value)}
                    className={`w-full p-2 rounded-xl text-[11px] font-bold border ${
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="fit_slim">Slim Fit</option>
                    <option value="fit_regular">Regular Fit</option>
                    <option value="fit_relaxed">Relaxed Fit</option>
                    <option value="fit_oversized">Oversized</option>
                  </select>
                </div>

                {/* Fabric */}
                <div>
                  <span className="text-[9px] font-black uppercase opacity-50 block mb-1">Fabric</span>
                  <select
                    value={selectedFabric}
                    onChange={(e) => setSelectedFabric(e.target.value)}
                    className={`w-full p-2 rounded-xl text-[11px] font-bold border ${
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="fabric_cotton">Cotton</option>
                    <option value="fabric_linen">Linen</option>
                    <option value="fabric_denim">Denim</option>
                    <option value="fabric_silk">Silk</option>
                    <option value="fabric_wool">Wool</option>
                    <option value="fabric_rayon">Rayon</option>
                    <option value="fabric_polyester">Polyester</option>
                  </select>
                </div>

                {/* Pattern */}
                <div>
                  <span className="text-[9px] font-black uppercase opacity-50 block mb-1">Pattern</span>
                  <select
                    value={selectedPattern}
                    onChange={(e) => setSelectedPattern(e.target.value)}
                    className={`w-full p-2 rounded-xl text-[11px] font-bold border ${
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="pattern_solid">Solid</option>
                    <option value="pattern_striped">Striped</option>
                    <option value="pattern_checked">Checked</option>
                    <option value="pattern_printed">Printed</option>
                    <option value="pattern_textured">Textured</option>
                  </select>
                </div>

                {/* Mood */}
                <div>
                  <span className="text-[9px] font-black uppercase opacity-50 block mb-1">Vibe</span>
                  <select
                    value={selectedMood}
                    onChange={(e) => setSelectedMood(e.target.value)}
                    className={`w-full p-2 rounded-xl text-[11px] font-bold border ${
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="mood_comfort">Comfort</option>
                    <option value="mood_confidence">Sharp & Confident</option>
                    <option value="mood_minimal">Minimalist</option>
                    <option value="mood_attention">Statement / Party</option>
                  </select>
                </div>
              </div>

              {/* Quick Tags / Occasions */}
              <div className="mt-3">
                <span className="text-[9px] font-black uppercase opacity-50 block mb-1.5">Occasion Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'tag_casual', label: 'Casual' },
                    { id: 'tag_office', label: 'Office' },
                    { id: 'tag_party', label: 'Party' },
                    { id: 'tag_traditional', label: 'Traditional' },
                    { id: 'tag_campus', label: 'College' },
                    { id: 'tag_gym', label: 'Athletic' }
                  ].map(tObj => (
                    <button
                      key={tObj.id}
                      type="button"
                      onClick={() => toggleTag(tObj.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        selectedTags.includes(tObj.id)
                          ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                          : isDark
                          ? 'bg-white/5 border-white/10 text-white/50'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      #{tObj.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 4: Live Style DNA Harmony Preview */}
            <div className={`p-4 rounded-2xl border ${
              harmony.score >= 85
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : harmony.score >= 75
                ? 'bg-purple-500/10 border-purple-500/20'
                : 'bg-amber-500/10 border-amber-500/20'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{harmony.score >= 85 ? '🌟' : harmony.score >= 75 ? '✨' : '🎨'}</span>
                  <span className="text-xs font-black uppercase tracking-wider">
                    Style DNA Harmony
                  </span>
                </div>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  harmony.score >= 85
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : harmony.score >= 75
                    ? 'bg-purple-500/20 text-purple-500'
                    : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {harmony.score}% Match
                </span>
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed font-medium">
                {harmony.reason}
              </p>
              <p className="text-[9px] opacity-40 mt-1 italic">
                * Even if score is low, ToneFit saves your clothing unconditionally.
              </p>
            </div>
          </div>

          {/* Footer with Direct Save Action */}
          <div className="p-4 sm:p-5 border-t border-[var(--border-primary)] bg-[var(--bg-accent)] flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${
                isDark ? 'border-white/10 hover:bg-white/5 text-white/70' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDirectSave}
              disabled={saving || !selectedCategory}
              className="flex-1 py-3 px-5 rounded-2xl text-white font-black text-xs uppercase tracking-wider shadow-lg bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving to Closet...</span>
                </>
              ) : (
                <>
                  <span>👗</span>
                  <span>Save to Smart Wardrobe</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
