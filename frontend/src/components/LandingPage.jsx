import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from './SEOHead';
import { useLanguage } from '../i18n/LanguageContext';
import { trackCTAClick } from '../utils/analytics';
import { usePWA } from '../hooks/usePWA';
import InstallPromptModal from './InstallPromptModal';
import { LIGHT, GRAD } from '../utils/themeColors';

/* ══════════════════════════════════════════════
   LOGIN GATE MODAL (Light Mode Luxe)
   ══════════════════════════════════════════════ */
function LoginGateModal({ feature, onClose, onLogin }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md text-center rounded-3xl p-8 sm:p-10 shadow-2xl transition-all"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl mx-auto mb-5 flex items-center justify-center text-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(236,72,153,0.12))', border: '1px solid rgba(139,92,246,0.2)' }}>
          ✨
        </div>

        <span className="text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full text-violet-700 bg-violet-50 border border-violet-200 inline-block mb-3">
          100% Free Access
        </span>

        <h3 className="text-2xl font-bold text-slate-900 mb-2 font-serif">
          Access {feature}
        </h3>

        <p className="text-sm text-slate-600 mb-8 leading-relaxed">
          Sign in with one click to unlock personalized skin tone palettes, wardrobe management, and AI outfit recommendations.
        </p>

        <button
          onClick={onLogin}
          className="w-full py-3.5 px-6 rounded-2xl text-white font-semibold text-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 mb-3 cursor-pointer"
          style={{ background: GRAD }}
        >
          <span>Continue with Google / Email</span>
          <span>→</span>
        </button>

        <button
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors py-2 font-medium cursor-pointer bg-transparent border-none"
        >
          Explore More Features First
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MOBILE MENU (Light Mode)
   ══════════════════════════════════════════════ */
function MobileMenu({ open, onClose, navItems, onItemClick, onLoginClick, onDownloadApp }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: '#FFFFFF' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="StyleGuru AI Logo" className="w-8 h-8 rounded-xl object-contain shadow-sm" />
          <span className="text-base font-bold text-slate-900 tracking-tight">StyleGuru <span className="text-violet-600">AI</span></span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg hover:bg-slate-200 transition-colors cursor-pointer border-none"
        >
          ✕
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 flex flex-col justify-center px-8 gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { onItemClick(item); onClose(); }}
            className="w-full text-left py-4 text-2xl font-serif text-slate-800 border-b border-slate-100 flex items-center justify-between group hover:text-violet-600 transition-colors cursor-pointer bg-transparent"
          >
            <span>{item.label}</span>
            <span className="text-xs font-sans uppercase tracking-widest text-slate-400 group-hover:text-violet-500">Explore →</span>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="p-6 space-y-3 border-t border-slate-100">
        <button
          onClick={() => { onDownloadApp(); onClose(); }}
          className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
        >
          <span>📱</span>
          <span>Download Mobile App</span>
        </button>

        <button
          onClick={() => { onLoginClick(); onClose(); }}
          className="w-full py-3.5 px-6 rounded-2xl text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
          style={{ background: GRAD }}
        >
          <span>Get Started Free</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT: LandingPage
   ══════════════════════════════════════════════ */
export default function LandingPage({ user, onGetStarted, onLoginClick }) {
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [gateFeature, setGateFeature] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // PWA install hook
  const { isInstallable, promptInstall, dismissInstall, platform, nativePromptAvailable } = usePWA();

  // Scroll listener for sticky header
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Interactive Skin Tone Simulator State ──
  const skinTonesData = [
    {
      id: 'fair',
      name: 'Fair Cool',
      skinHex: '#F6E3D4',
      undertone: 'Cool (Bluish/Pinkish)',
      season: 'Winter / Summer',
      bestShirt: 'Navy Blue & Lavender',
      description: 'Stands out in rich jewel tones and high-contrast blues that prevent a washed-out appearance.',
      palette: [
        { name: 'Navy Blue', hex: '#000080' },
        { name: 'Deep Teal', hex: '#008080' },
        { name: 'Royal Indigo', hex: '#4B0082' },
        { name: 'Rose Pink', hex: '#E11D48' },
        { name: 'Emerald', hex: '#059669' },
        { name: 'Pure White', hex: '#FFFFFF' },
      ],
      avoid: ['Mustard Yellow', 'Muddy Brown']
    },
    {
      id: 'light',
      name: 'Light Warm',
      skinHex: '#E8C9A0',
      undertone: 'Warm (Golden/Peach)',
      season: 'Spring / Autumn',
      bestShirt: 'Terracotta & Warm Beige',
      description: 'Radiates in warm earth tones, peach, and burnt oranges that mirror your natural skin glow.',
      palette: [
        { name: 'Terracotta', hex: '#E2725B' },
        { name: 'Warm Amber', hex: '#D97706' },
        { name: 'Olive Green', hex: '#65A30D' },
        { name: 'Deep Camel', hex: '#B45309' },
        { name: 'Sage Green', hex: '#047857' },
        { name: 'Warm Cream', hex: '#FEF3C7' },
      ],
      avoid: ['Icy Silver', 'Stark Black']
    },
    {
      id: 'wheatish',
      name: 'Wheatish Neutral',
      skinHex: '#D4A574',
      undertone: 'Neutral / Olive',
      season: 'Autumn / Summer',
      bestShirt: 'Cobalt & Forest Green',
      description: 'The classic Indian wheatish complexion thrives in rich jewel colors and deep balanced contrast.',
      palette: [
        { name: 'Forest Green', hex: '#15803D' },
        { name: 'Cobalt Blue', hex: '#1D4ED8' },
        { name: 'Rich Maroon', hex: '#881337' },
        { name: 'Mustard Gold', hex: '#CA8A04' },
        { name: 'Charcoal', hex: '#334155' },
        { name: 'Soft Ivory', hex: '#FFFBEB' },
      ],
      avoid: ['Pale Beige', 'Neon Yellow']
    },
    {
      id: 'medium',
      name: 'Medium Warm',
      skinHex: '#C68642',
      undertone: 'Warm Golden',
      season: 'Warm Autumn',
      bestShirt: 'Rust & Regal Burgundy',
      description: 'Deep and radiant. Warm metallic accents and saturated earthy shades create unmatched elegance.',
      palette: [
        { name: 'Rust Orange', hex: '#C2410C' },
        { name: 'Regal Wine', hex: '#701A75' },
        { name: 'Deep Teal', hex: '#0F766E' },
        { name: 'Royal Gold', hex: '#EAB308' },
        { name: 'Dark Chocolate', hex: '#451A03' },
        { name: 'Warm Cream', hex: '#FDF6B2' },
      ],
      avoid: ['Pale Pastel Pink', 'Muddy Gray']
    },
    {
      id: 'olive',
      name: 'Olive Dusky',
      skinHex: '#A0785A',
      undertone: 'Subtle Green / Neutral',
      season: 'Deep Autumn',
      bestShirt: 'Emerald & Burnt Orange',
      description: 'Olive undertones shine brightest with deep jewel contrast and vivid warm earthy pairings.',
      palette: [
        { name: 'Vivid Coral', hex: '#F97316' },
        { name: 'Deep Emerald', hex: '#065F46' },
        { name: 'Cobalt Blue', hex: '#2563EB' },
        { name: 'Plum Purple', hex: '#581C87' },
        { name: 'Mustard Ochre', hex: '#A16207' },
        { name: 'Crisp White', hex: '#FFFFFF' },
      ],
      avoid: ['Olive Drab (blend-in)', 'Dull Tan']
    },
    {
      id: 'dark',
      name: 'Dark Warm (Deep Rich)',
      skinHex: '#6B3D2E',
      undertone: 'Deep Golden / Espresso',
      season: 'Vibrant Winter',
      bestShirt: 'Electric Blue & Bright Gold',
      description: 'High saturation power palette. Vivid, saturated tones pop with dramatic, magazine-grade elegance.',
      palette: [
        { name: 'Royal Gold', hex: '#FACC15' },
        { name: 'Electric Cobalt', hex: '#3B82F6' },
        { name: 'Hot Crimson', hex: '#DC2626' },
        { name: 'Vivid Turquoise', hex: '#06B6D4' },
        { name: 'Bright Fuchsia', hex: '#C026D3' },
        { name: 'Pure Contrast White', hex: '#FFFFFF' },
      ],
      avoid: ['Very Dark Navy', 'Dull Charcoal']
    }
  ];

  const [selectedTone, setSelectedTone] = useState(skinTonesData[2]); // Wheatish default

  const handleGetStarted = (source = 'hero') => {
    trackCTAClick('get_started', source);
    onGetStarted();
  };

  const handleFeatureClick = (feature, id) => {
    trackCTAClick('explore_feature', id);
    if (user) {
      onGetStarted();
    } else {
      setGateFeature(feature);
    }
  };

  const handleDownloadAppClick = async () => {
    trackCTAClick('download_app', 'landing');
    const hasPrompt = nativePromptAvailable || (typeof window !== 'undefined' && window.__deferredPWAInstallPrompt);
    if (hasPrompt) {
      try {
        const result = await promptInstall();
        if (result === 'accepted') {
          return;
        }
      } catch (err) {
        console.warn('Direct prompt failed:', err);
      }
    }
    setShowInstallModal(true);
  };

  const navItems = [
    { id: 'features', label: 'Features', action: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) },
    { id: 'how-it-works', label: 'How It Works', action: () => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) },
    { id: 'founder', label: 'Founder Story', action: () => document.getElementById('founder')?.scrollIntoView({ behavior: 'smooth' }) },
    { id: 'app', label: 'Download App', action: () => handleDownloadAppClick() },
    { id: 'contact', label: 'Contact', action: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) },
    { id: 'blog', label: 'Blog', isLink: true, href: '/blog' },
  ];

  return (
    <div className="bg-[#FAFAFC] text-slate-900 min-h-screen font-sans selection:bg-violet-500 selection:text-white antialiased">
      <SEOHead
        title="StyleGuru AI — AI Fashion & Color Intelligence for Every Indian Skin Tone"
        description="Discover your best colors, tailored outfits, and style guide with AI skin analysis. Made in India for every skin tone."
      />

      {/* ─── Login Gate Modal ─── */}
      {gateFeature && (
        <LoginGateModal
          feature={gateFeature}
          onClose={() => setGateFeature(null)}
          onLogin={() => { setGateFeature(null); onLoginClick(); }}
        />
      )}

      {/* ─── Mobile Menu Overlay ─── */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navItems={navItems}
        onItemClick={(item) => {
          if (item.action) item.action();
        }}
        onLoginClick={onLoginClick}
        onDownloadApp={handleDownloadAppClick}
      />

      {/* ─── PWA Install Prompt Modal ─── */}
      {showInstallModal && (
        <InstallPromptModal
          onInstall={promptInstall}
          onDismiss={() => setShowInstallModal(false)}
          platform={platform}
          nativePromptAvailable={nativePromptAvailable}
          C={LIGHT}
        />
      )}

      {/* ════════════════════════════════════════
          1. HEADER / NAVBAR (Light Mode Floating Glass)
          ════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm py-3.5'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center p-0.5 bg-gradient-to-tr from-violet-600 to-pink-500 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="StyleGuru AI" className="w-full h-full object-contain rounded-lg bg-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 font-sans">
                StyleGuru <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[9px] font-bold tracking-widest text-violet-700 uppercase px-1.5 py-0.5 bg-violet-100 rounded-md">
                Made in India 🇮🇳
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-7">
            {navItems.map(item =>
              item.isLink ? (
                <Link
                  key={item.id}
                  to={item.href}
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-violet-600 transition-colors py-1 no-underline"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-violet-600 transition-colors py-1 cursor-pointer bg-transparent border-none"
                >
                  {item.label}
                </button>
              )
            )}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Download App Button */}
            <button
              onClick={handleDownloadAppClick}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all hover:border-violet-300 shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Install App on Phone / PC"
            >
              <span>📲</span>
              <span>Download App</span>
            </button>

            {/* Login Button */}
            <button
              onClick={() => { trackCTAClick('login', 'navbar'); onLoginClick(); }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 hover:text-violet-600 transition-colors cursor-pointer bg-transparent border-none"
            >
              Sign In
            </button>

            {/* Try Free CTA */}
            <button
              onClick={() => handleGetStarted('navbar')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md shadow-violet-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-none"
              style={{ background: GRAD }}
            >
              Try Free →
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={handleDownloadAppClick}
              className="p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>📲</span>
              <span className="hidden xs:inline">App</span>
            </button>
            <button
              onClick={onLoginClick}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-700 hover:text-violet-600 cursor-pointer bg-transparent border-none"
            >
              Sign In
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-800 rounded-lg hover:bg-slate-100 text-xl font-bold cursor-pointer bg-transparent border-none"
            >
              ☰
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          2. HERO SECTION (High Impact + Live Skin Tone Simulator)
          ════════════════════════════════════════ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Subtle Background Glow Spheres */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-200/40 via-pink-200/30 to-indigo-200/40 blur-3xl pointer-events-none -z-10 rounded-full" />
        <div className="absolute top-64 right-10 w-72 h-72 bg-amber-100/40 blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content (Text & CTAs) */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100/70 border border-violet-200/80 shadow-sm">
                <span className="text-xs">🇮🇳</span>
                <span className="text-xs font-bold text-violet-900 tracking-wide">
                  AI-Powered Fashion Intelligence — Made in India
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] font-serif">
                Stop Guessing.<br />
                Wear Colors That Make You <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">Radiate</span>.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Calibrated specifically for rich Indian skin tones. In 10 seconds, our AI calculates your exact ITA skin angle, undertone, and curates a personalized wardrobe guide.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  onClick={() => handleGetStarted('hero_primary')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl text-white font-bold text-sm shadow-xl shadow-violet-500/25 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer border-none"
                  style={{ background: GRAD }}
                >
                  <span className="text-lg">📷</span>
                  <span>Analyze My Style Free</span>
                  <span>→</span>
                </button>

                <button
                  onClick={handleDownloadAppClick}
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl text-slate-800 font-bold text-sm bg-white border border-slate-200 hover:border-violet-300 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>📲</span>
                  <span>Install App on Mobile</span>
                </button>
              </div>

              {/* Trust Micro-Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <span className="font-bold">✓</span> 100% Free Forever
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="text-emerald-500 font-bold">✓</span> No Credit Card Needed
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="text-emerald-500 font-bold">✓</span> Privacy First (Zero Photos Stored)
                </span>
              </div>
            </div>

            {/* Right: Live Interactive Skin Tone Simulator */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl shadow-slate-200/60 relative">
                {/* Header of widget */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">
                      Live Color Science Lab
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      Tap a Tone to Test Instant AI Color Match
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-[10px] font-black border border-violet-200 uppercase">
                    Interactive
                  </span>
                </div>

                {/* 6 Skin Tone Swatch Selectors */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-6">
                  {skinTonesData.map(tone => {
                    const isSelected = selectedTone.id === tone.id;
                    return (
                      <button
                        key={tone.id}
                        onClick={() => setSelectedTone(tone)}
                        className={`flex flex-col items-center p-2 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-violet-600 bg-violet-50/60 ring-2 ring-violet-500/20 shadow-sm transform scale-105'
                            : 'border-slate-100 hover:border-slate-300 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full border-2 border-white shadow-md mb-2 transition-transform"
                          style={{ backgroundColor: tone.skinHex }}
                        />
                        <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">
                          {tone.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Preview Card for Selected Tone */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-violet-50/30 border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold">Detected Profile:</span>
                      <h4 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
                        {selectedTone.name}
                        <span className="w-3.5 h-3.5 rounded-full inline-block border border-slate-300 shadow-xs" style={{ backgroundColor: selectedTone.skinHex }} />
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Undertone</span>
                      <p className="text-xs font-bold text-violet-700">{selectedTone.undertone}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedTone.description}
                  </p>

                  {/* 6 Curated Palette Swatches */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-2">
                      Top Flattering Colors Curated for {selectedTone.name}:
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {selectedTone.palette.map((c, i) => (
                        <div key={i} className="group relative">
                          <div
                            className="w-full h-10 rounded-xl border border-black/10 shadow-xs transition-transform group-hover:scale-110 flex items-center justify-center cursor-pointer"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-[9px] font-semibold text-slate-600 block text-center truncate mt-1">
                            {c.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Colors to avoid badge */}
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                    <span className="font-bold">⚠️ Washout Colors:</span>
                    <span>{selectedTone.avoid.join(', ')}</span>
                  </div>
                </div>

                {/* Direct CTA on the widget */}
                <button
                  onClick={() => handleGetStarted('hero_widget')}
                  className="w-full mt-5 py-3 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                  style={{ background: GRAD }}
                >
                  <span>✨ Analyze My Exact Skin Tone with Selfie</span>
                  <span>→</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          3. CREDIBILITY & SCIENCE TICKER
          ════════════════════════════════════════ */}
      <section className="border-y border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="border-r border-slate-100 last:border-none">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">ITA 45°</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Colorimetry Science</p>
            </div>
            <div className="border-r border-slate-100 last:border-none">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">468-Point</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Facial Landmark Mesh</p>
            </div>
            <div className="border-r border-slate-100 last:border-none">
              <p className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">100% Free</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">No Paywalls Ever</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">0 Files Saved</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Zero-Storage Privacy</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          4. THE 5 CORE PRODUCT PILLARS (Voice Note Ecosystem)
          ════════════════════════════════════════ */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 sm:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700 bg-violet-100/60 px-3.5 py-1 rounded-full border border-violet-200">
            Engineered Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-serif mt-3">
            Your Complete AI Fashion Ecosystem
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Everything you need to dress sharper, shop with 100% confidence, and never ask "does this suit me?" again.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Core AI Analysis */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-violet-300 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                🔬
              </div>
              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest block mb-1">Pillar 01</span>
              <h3 className="text-xl font-bold text-slate-900 font-serif mb-2.5">
                Precision Skin & Undertone Analysis
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Upload a single selfie. Our algorithm isolates facial pixels, eliminates shadow bias, and determines whether you need warm, cool, or neutral palettes.
              </p>
            </div>
            <button
              onClick={() => handleFeatureClick('AI Skin Analysis', 'analysis')}
              className="text-xs font-bold text-violet-600 group-hover:text-violet-700 flex items-center gap-1 mt-auto cursor-pointer bg-transparent border-none p-0"
            >
              <span>Explore Analysis Suite</span> <span>→</span>
            </button>
          </div>

          {/* Card 2: Couple Styling Mode */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-pink-300 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                👫
              </div>
              <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest block mb-1">Pillar 02</span>
              <h3 className="text-xl font-bold text-slate-900 font-serif mb-2.5">
                Couple Outfit Harmony
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Heading to a wedding, date, or anniversary? Upload photos of both partners to get complementary color palettes that look stunning together in photos.
              </p>
            </div>
            <button
              onClick={() => handleFeatureClick('Couple Styling', 'couple')}
              className="text-xs font-bold text-pink-600 group-hover:text-pink-700 flex items-center gap-1 mt-auto cursor-pointer bg-transparent border-none p-0"
            >
              <span>Explore Couple Mode</span> <span>→</span>
            </button>
          </div>

          {/* Card 3: Smart Wardrobe & Laundry */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                👗
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">Pillar 03</span>
              <h3 className="text-xl font-bold text-slate-900 font-serif mb-2.5">
                Smart Wardrobe & Laundry Vault
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Catalog your clothes, log daily wears, and keep track of laundry cycles (Clean, In Wash, Ready to Wear). Never repeat outfits unconsciously.
              </p>
            </div>
            <button
              onClick={() => handleFeatureClick('Smart Wardrobe', 'wardrobe')}
              className="text-xs font-bold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1 mt-auto cursor-pointer bg-transparent border-none p-0"
            >
              <span>Explore Wardrobe Vault</span> <span>→</span>
            </button>
          </div>

          {/* Card 4: Power Style Tools */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                🛠️
              </div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-1">Pillar 04</span>
              <h3 className="text-xl font-bold text-slate-900 font-serif mb-2.5">
                On-The-Go Style Tools
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Includes Live Camera Color Scanner to scan clothing in stores, Outfit Match Compatibility Checker, and WCAG Contrast Calculator for shirt-pant balance.
              </p>
            </div>
            <button
              onClick={() => handleFeatureClick('Style Tools', 'tools')}
              className="text-xs font-bold text-amber-600 group-hover:text-amber-700 flex items-center gap-1 mt-auto cursor-pointer bg-transparent border-none p-0"
            >
              <span>Explore Tools Tab</span> <span>→</span>
            </button>
          </div>

          {/* Card 5: Curated Lookbook & Missions */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                📖
              </div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">Pillar 05</span>
              <h3 className="text-xl font-bold text-slate-900 font-serif mb-2.5">
                Digital Lookbook & Missions
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Event-specific outfit guides for Indian weddings, corporate offices, monsoon dinners, poojas, and dates — with direct Myntra and Amazon query links.
              </p>
            </div>
            <button
              onClick={() => handleFeatureClick('Digital Lookbook', 'lookbook')}
              className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1 mt-auto cursor-pointer bg-transparent border-none p-0"
            >
              <span>Explore Lookbook</span> <span>→</span>
            </button>
          </div>

          {/* Card 6: AI StyleBot Advisor */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                🤖
              </div>
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block mb-1">Pillar 06</span>
              <h3 className="text-xl font-bold text-slate-900 font-serif mb-2.5">
                AI StyleBot Assistant
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Ask any fashion question in English or Hinglish: "What should I wear with khaki trousers to an evening cocktail party?" Get instant expert advice.
              </p>
            </div>
            <button
              onClick={() => handleFeatureClick('AI StyleBot', 'stylebot')}
              className="text-xs font-bold text-purple-600 group-hover:text-purple-700 flex items-center gap-1 mt-auto cursor-pointer bg-transparent border-none p-0"
            >
              <span>Chat with StyleBot</span> <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          5. HOW IT WORKS (3 Simple Steps)
          ════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 bg-slate-50/70 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Simple Process</span>
            <h2 className="text-3xl font-black text-slate-900 font-serif mt-2">
              Three Steps to Your Style Guide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative">
              <span className="text-5xl font-serif font-black text-violet-100 absolute top-6 right-6">01</span>
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-2xl mb-6">
                📸
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Snap a Clear Selfie</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take a quick photo in natural daylight without heavy filters or makeup. Don't want to upload? You can also use our 4-question manual quiz!
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative">
              <span className="text-5xl font-serif font-black text-violet-100 absolute top-6 right-6">02</span>
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-2xl mb-6">
                🧬
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Analyzes Your Tone</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our engine extracts facial landmarks, calculates your skin melanin density and undertone, and maps your profile to our scientific Indian color charts.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative">
              <span className="text-5xl font-serif font-black text-violet-100 absolute top-6 right-6">03</span>
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-2xl mb-6">
                ✨
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Get Your Style DNA</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive your complete color palette, outfit pairings for top and bottom, colors to avoid, and direct budget shopping links tailored for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          6. MEET THE FOUNDER & MADE IN INDIA STORY
          ════════════════════════════════════════ */}
      <section id="founder" className="py-24 max-w-7xl mx-auto px-6 sm:px-10">
        <div className="bg-gradient-to-br from-violet-50 via-white to-pink-50/40 rounded-3xl p-8 sm:p-12 lg:p-16 border border-violet-100 shadow-lg relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Founder Avatar & Badge */}
            <div className="lg:col-span-4 text-center">
              <div className="relative inline-block">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full mx-auto bg-gradient-to-tr from-violet-600 to-pink-500 p-1 shadow-2xl shadow-violet-500/20">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <img
                      src="/logo.png"
                      alt="Vivek - Founder of StyleGuru AI"
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 right-2 sm:right-6 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                  Founder & Creator 🇮🇳
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 font-serif mt-5 mb-1">
                Vivek
              </h3>
              <p className="text-xs font-semibold text-violet-700">
                Founder, StyleGuru AI
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Engineered with pride in India
              </p>
            </div>

            {/* Founder Story & Vision */}
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-bold">
                <span>🇮🇳</span>
                <span>Our Founding Mission</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-serif leading-snug">
                "Fashion Advice Shouldn't Cost ₹5,000 or Rely on Western Color Charts That Ignore Indian Skin Tones."
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed">
                Most global fashion styling tools were built on European skin tone classifications that completely fail when applied to the rich, warm, and multifaceted spectrum of Indian complexions.
              </p>

              <p className="text-sm text-slate-600 leading-relaxed">
                I founded <strong>StyleGuru AI</strong> to bridge this gap. By combining computer vision with proven colorimetry (ITA individual typology angle), we built an algorithm that understands every Indian undertone — from Kashmir to Kanyakumari. Our promise is simple: <strong>high-tier style intelligence, zero subscription paywalls, and complete data privacy.</strong>
              </p>

              <div className="pt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
                  <span className="text-violet-600">🎯</span>
                  <span>100% Free For Every Indian</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
                  <span className="text-violet-600">🔒</span>
                  <span>Zero Photo Storage Policy</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200">
                  <span className="text-violet-600">🚀</span>
                  <span>Constantly Evolving AI Model</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          7. DOWNLOAD MOBILE APP BANNER (Working PWA Install)
          ════════════════════════════════════════ */}
      <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400 bg-pink-500/10 px-3.5 py-1 rounded-full border border-pink-500/20 inline-block">
                Progressive Web App
              </span>
              <h2 className="text-3xl sm:text-4xl font-black font-serif tracking-tight">
                Get StyleGuru AI in Your Pocket
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Install directly onto your Android, iPhone, or PC home screen. Instant launch, offline support, and no storage clutter — zero app store download required.
              </p>
              
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={handleDownloadAppClick}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl text-white font-bold text-sm shadow-xl shadow-pink-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer border-none"
                  style={{ background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)' }}
                >
                  <span className="text-xl">📲</span>
                  <span>Install App on Your Device</span>
                </button>

                <span className="text-xs text-slate-400">
                  {platform === 'ios' ? 'Works on iPhone Safari' : platform === 'android' ? 'One-tap install on Android' : 'Installs on Desktop / Chrome'}
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-56 p-4 rounded-3xl bg-slate-800 border border-slate-700 shadow-2xl text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl mx-auto p-1 bg-gradient-to-tr from-violet-500 to-pink-500 shadow-lg">
                  <img src="/logo.png" alt="App Icon" className="w-full h-full object-contain rounded-xl bg-white" />
                </div>
                <h4 className="font-bold text-sm text-white">StyleGuru AI</h4>
                <p className="text-[11px] text-slate-400">Fast • Lightweight • Offline Ready</p>
                <div className="pt-2 border-t border-slate-700">
                  <span className="text-[10px] text-emerald-400 font-semibold">✓ Standalone App Mode</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          8. CONNECT & SUPPORT (4 Contact Channels from User's Audio)
          ════════════════════════════════════════ */}
      <section id="contact" className="py-24 max-w-7xl mx-auto px-6 sm:px-10">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700 bg-violet-100/60 px-3.5 py-1 rounded-full border border-violet-200">
            Reach Out Directly
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-serif mt-3">
            Connect With Us On All 4 Platforms
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Have questions, feedback, or style partnership inquiries? Reach the founder directly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Channel 1: Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-pink-300 transition-all text-center group block no-underline"
          >
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md group-hover:scale-110 transition-transform">
              📸
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Instagram</h3>
            <p className="text-xs text-slate-500 mb-4">Follow styling tips, reels, and DM us directly</p>
            <span className="text-xs font-bold text-pink-600 group-hover:text-pink-700">
              Open Instagram →
            </span>
          </a>

          {/* Channel 2: Facebook */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all text-center group block no-underline"
          >
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl bg-blue-600 text-white shadow-md group-hover:scale-110 transition-transform">
              📘
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Facebook</h3>
            <p className="text-xs text-slate-500 mb-4">Join our community & stay updated on new drops</p>
            <span className="text-xs font-bold text-blue-600 group-hover:text-blue-700">
              Open Facebook →
            </span>
          </a>

          {/* Channel 3: WhatsApp */}
          <a
            href="https://wa.me/?text=Hi%20StyleGuru%20AI%2C%20I%20have%20a%20question%20about%20my%20style%20analysis!"
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all text-center group block no-underline"
          >
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl bg-emerald-500 text-white shadow-md group-hover:scale-110 transition-transform">
              💬
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">WhatsApp</h3>
            <p className="text-xs text-slate-500 mb-4">Chat with our team directly for instant support</p>
            <span className="text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
              Start WhatsApp Chat →
            </span>
          </a>

          {/* Channel 4: Gmail */}
          <a
            href="mailto:StyleGuruAI.in.gmail@gmail.com"
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-red-300 transition-all text-center group block no-underline"
          >
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl bg-red-500 text-white shadow-md group-hover:scale-110 transition-transform">
              ✉️
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Gmail / Email</h3>
            <p className="text-xs text-slate-500 mb-4 break-all">StyleGuruAI.in.gmail@gmail.com</p>
            <span className="text-xs font-bold text-red-600 group-hover:text-red-700">
              Send Email →
            </span>
          </a>
        </div>
      </section>

      {/* ════════════════════════════════════════
          9. INTERACTIVE FAQ ACCORDION
          ════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50/80 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-6 sm:px-10">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Got Questions?</span>
            <h2 className="text-3xl font-black text-slate-900 font-serif mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Is StyleGuru AI really 100% free?',
                a: 'Yes! All features — including skin tone analysis, wardrobe management, color palettes, and outfit checking — are completely free with zero subscription paywalls.'
              },
              {
                q: 'Is my photo stored on your servers?',
                a: 'No, absolutely not. Your photo is analyzed in real-time in memory to extract color metrics and landmarks, and then immediately discarded. We never save, store, or sell user images.'
              },
              {
                q: 'Does it work for deep, dark, and dusky Indian skin tones?',
                a: 'Yes! In fact, that is why StyleGuru AI was created. Unlike Western charts that lump dark skin into one generic bucket, our algorithm distinguishes between wheatish, olive, warm brown, caramel, and deep dark tones.'
              },
              {
                q: 'What if I take a selfie in poor or dim lighting?',
                a: 'Our built-in image quality gate detects underexposure and lighting color cast. If lighting is skewed, the AI will provide a warning and suggest standing in front of soft window daylight for 100% accuracy.'
              },
              {
                q: 'Can I install this as an app on my phone?',
                a: 'Yes! Click the "Download App" button at the top or bottom of this page. On Android, it installs directly; on iPhone, open Safari and tap Share ➔ Add to Home Screen.'
              }
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-xs cursor-pointer transition-all open:shadow-md"
              >
                <summary className="font-bold text-sm text-slate-800 flex items-center justify-between list-none">
                  <span>{faq.q}</span>
                  <span className="text-violet-600 text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          10. FINAL CALL TO ACTION
          ════════════════════════════════════════ */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-4xl mx-auto px-6 sm:px-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700 bg-violet-50 px-4 py-1.5 rounded-full border border-violet-200">
            Begin Your Transformation
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 font-serif mt-5 mb-4">
            Your Style Journey Starts Today
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Join thousands of users across India who have unlocked the confidence of wearing the right colors every single day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleGetStarted('bottom_cta')}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl text-white font-bold text-sm shadow-xl shadow-violet-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-none"
              style={{ background: GRAD }}
            >
              Analyze My Style Free →
            </button>
            <button
              onClick={handleDownloadAppClick}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-slate-700 font-bold text-sm border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
            >
              📲 Install Mobile App
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          11. LUXE FOOTER (All Links from Voice Note)
          ════════════════════════════════════════ */}
      <footer className="border-t border-slate-200 bg-white py-14">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            
            {/* Brand column */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl p-0.5 bg-gradient-to-tr from-violet-600 to-pink-500">
                  <img src="/logo.png" alt="StyleGuru AI" className="w-full h-full object-contain rounded-lg bg-white" />
                </div>
                <span className="text-base font-bold text-slate-900">
                  StyleGuru <span className="text-violet-600">AI</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                AI-powered fashion intelligence calibrated for Indian skin tones. Built with love in India by Vivek 🇮🇳
              </p>
              
              {/* Quick Social Badges */}
              <div className="flex items-center gap-3 pt-1">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-sm p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-pink-600 transition-colors no-underline" title="Instagram">
                  📸
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-sm p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors no-underline" title="Facebook">
                  📘
                </a>
                <a href="https://wa.me/?text=Hi%20StyleGuru%20AI" target="_blank" rel="noopener noreferrer" className="text-sm p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-emerald-600 transition-colors no-underline" title="WhatsApp">
                  💬
                </a>
                <a href="mailto:StyleGuruAI.in.gmail@gmail.com" className="text-sm p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-red-600 transition-colors no-underline" title="Email">
                  ✉️
                </a>
              </div>
            </div>

            {/* Product Links (From Voice Note: Analysis, History, Wardrobe, Tool, Blog) */}
            <div>
              <p className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-4">Product</p>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <button onClick={() => handleFeatureClick('Skin Analysis', 'analysis')} className="text-slate-600 hover:text-violet-600 transition-colors cursor-pointer bg-transparent border-none p-0">
                    AI Skin Analysis
                  </button>
                </li>
                <li>
                  <button onClick={() => handleFeatureClick('History', 'history')} className="text-slate-600 hover:text-violet-600 transition-colors cursor-pointer bg-transparent border-none p-0">
                    Analysis History
                  </button>
                </li>
                <li>
                  <button onClick={() => handleFeatureClick('Wardrobe', 'wardrobe')} className="text-slate-600 hover:text-violet-600 transition-colors cursor-pointer bg-transparent border-none p-0">
                    Smart Wardrobe
                  </button>
                </li>
                <li>
                  <button onClick={() => handleFeatureClick('Style Tools', 'tools')} className="text-slate-600 hover:text-violet-600 transition-colors cursor-pointer bg-transparent border-none p-0">
                    Style Tools
                  </button>
                </li>
                <li>
                  <Link to="/blog" className="text-slate-600 hover:text-violet-600 transition-colors no-underline">
                    Fashion Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links (From Voice Note: About, Contact, Policy, Terms) */}
            <div>
              <p className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-4">Company</p>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link to="/about" className="text-slate-600 hover:text-violet-600 transition-colors no-underline">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-slate-600 hover:text-violet-600 transition-colors no-underline">
                    Contact & Support
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-slate-600 hover:text-violet-600 transition-colors no-underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-slate-600 hover:text-violet-600 transition-colors no-underline">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <button onClick={handleDownloadAppClick} className="text-violet-700 font-bold hover:underline cursor-pointer bg-transparent border-none p-0">
                    📱 Download Mobile App
                  </button>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 StyleGuru AI. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <span>Made with pride in India</span>
              <span>🇮🇳</span>
              <span>by Vivek (Founder)</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
