import React, { useState, useEffect, useRef } from 'react';
import SEOHead from './SEOHead';
import { useLanguage } from '../i18n/LanguageContext';

/* ══════════════════════════════════════════════
   LOGIN GATE MODAL
   Appears when unauthenticated user clicks a feature
   ══════════════════════════════════════════════ */
function LoginGateModal({ feature, onClose, onLogin }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-6"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm text-center fade-up"
        style={{ background: '#111111', border: '1px solid #242424', padding: '48px 40px 40px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-10 h-0.5 mx-auto mb-8 sm:hidden" style={{ background: '#3A3A3A' }} />

        <p className="luxe-label mb-5" style={{ color: '#C9A96E' }}>Members Only</p>

        <h3 className="luxe-display mb-3" style={{ fontSize: '26px', color: '#F0EDE6' }}>
          Access {feature}
        </h3>

        <p className="mb-8 leading-relaxed" style={{ fontSize: '13px', color: '#6B6B6B' }}>
          Sign in to unlock personalized AI style analysis, wardrobe building tools, and expert recommendations.
        </p>

        <button
          onClick={onLogin}
          className="btn-luxe w-full mb-3"
        >
          Sign In to Continue
        </button>

        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#6B6B6B', fontSize: '12px', cursor: 'pointer', padding: '8px', letterSpacing: '0.05em' }}
        >
          Continue Exploring
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MOBILE MENU OVERLAY
   Full-screen black menu for mobile
   ══════════════════════════════════════════════ */
function MobileMenu({ open, onClose, navItems, onItemClick, onLoginClick }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: '#0A0A0A' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #1C1C1C' }}>
        <div className="flex items-center gap-2.5">
          <div style={{ width: 32, height: 32, background: '#C9A96E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0A0A0A', letterSpacing: '0.05em' }}>SG</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#F0EDE6', letterSpacing: '0.02em' }}>StyleGuru AI</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B6B6B', cursor: 'pointer', fontSize: '22px', padding: '4px' }}>
          ✕
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 flex flex-col justify-center px-8 gap-1">
        {navItems.map((item, i) => (
          <button
            key={item.id}
            onClick={() => { onItemClick(item); onClose(); }}
            className="w-full text-left py-5 fade-up"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: '1px solid #1C1C1C',
              fontFamily: "'Playfair Display', serif",
              fontSize: '32px', fontWeight: 300,
              color: '#F0EDE6',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              animationDelay: `${i * 0.06}s`, opacity: 0
            }}
          >
            {item.label}
            {item.requiresAuth && (
              <span className="luxe-label" style={{ color: '#C9A96E', fontSize: '9px' }}>Members</span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom */}
      <div className="p-8">
        <button onClick={() => { onLoginClick(); onClose(); }} className="btn-luxe w-full">
          Login / Sign Up
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   FEATURE PREVIEW CARD (locked behind login)
   ══════════════════════════════════════════════ */
function FeatureCard({ icon, title, desc, tag, items, onUnlock, delay }) {
  return (
    <div
      className="luxe-card card-hover stagger-1 flex flex-col"
      style={{ padding: '40px 32px', animationDelay: `${delay}s`, opacity: 0 }}
    >
      <p className="luxe-label mb-6" style={{ color: '#C9A96E' }}>{tag}</p>
      <div style={{ fontSize: '32px', marginBottom: '16px' }}>{icon}</div>
      <h3 className="luxe-display mb-3" style={{ fontSize: '22px', color: '#F0EDE6' }}>{title}</h3>
      <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: '1.7', marginBottom: '28px', flex: 1 }}>{desc}</p>

      {/* Preview locked items */}
      <div style={{ padding: '16px', background: '#0A0A0A', border: '1px solid #1C1C1C', marginBottom: '28px' }}>
        <p className="luxe-label mb-3" style={{ color: '#3A3A3A', fontSize: '9px' }}>Preview</p>
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A96E', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#3A3A3A' }}>{item}</span>
            </div>
          ))}
        </div>
        {/* Blur overlay */}
        <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(4px)', background: 'rgba(10,10,10,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0' }} />
      </div>

      <button onClick={onUnlock} className="btn-luxe-outline w-full">
        Sign In to Access
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SKIN TONE SWATCH
   ══════════════════════════════════════════════ */
function SkinToneSwatch({ name, hex, colors }) {
  return (
    <div className="text-center">
      <div
        style={{ width: 56, height: 56, borderRadius: '50%', background: hex, margin: '0 auto 10px', border: '2px solid #242424' }}
      />
      <p style={{ fontSize: '11px', color: '#6B6B6B', letterSpacing: '0.08em', marginBottom: '10px' }}>{name}</p>
      <div className="flex gap-1.5 justify-center">
        {colors.map((c, i) => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: '2px', background: c }} />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN LANDING PAGE
   ══════════════════════════════════════════════ */
export default function LandingPage({ user, onGetStarted, onLoginClick }) {
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [gateFeature, setGateFeature] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Scroll listener for navbar
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Testimonial auto-rotate
  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial(i => (i + 1) % testimonials.length), 4500);
    return () => clearInterval(timer);
  }, []);

  const handleFeatureClick = (feature, id) => {
    if (user) {
      onGetStarted();
    } else {
      setGateFeature(feature);
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', requiresAuth: false },
    { id: 'analyze', label: 'Analyze', requiresAuth: true },
    { id: 'history', label: 'History', requiresAuth: true },
    { id: 'wardrobe', label: 'Wardrobe', requiresAuth: true },
    { id: 'tools', label: 'Tools', requiresAuth: true },
    { id: 'profile', label: 'Profile', requiresAuth: true },
  ];

  const testimonials = [
    { quote: "Finally an AI that understood my warm Indian skin tone perfectly. The color recommendations were spot-on.", author: "Priya S.", location: "Mumbai" },
    { quote: "I never knew which colors suited me until StyleGuru AI analyzed my photo. Now I shop with confidence.", author: "Rahul K.", location: "Delhi" },
    { quote: "The outfit combinations it suggested for my olive skin were exactly what I needed for my interview.", author: "Ananya M.", location: "Bangalore" },
  ];

  const skinTones = [
    { name: 'Fair Cool', hex: '#F5E6D8', colors: ['#000080','#008080','#4B0082','#2F4F4F'] },
    { name: 'Light Warm', hex: '#E8C9A0', colors: ['#8B4513','#556B2F','#B8860B','#8B0000'] },
    { name: 'Wheatish', hex: '#D4A574', colors: ['#000080','#228B22','#8B0000','#2F4F4F'] },
    { name: 'Medium Warm', hex: '#C68642', colors: ['#000080','#008000','#800000','#FFFDD0'] },
    { name: 'Olive', hex: '#A0785A', colors: ['#FF7F50','#20B2AA','#9370DB','#F0E68C'] },
    { name: 'Dark Warm', hex: '#6B3D2E', colors: ['#FFD700','#FF6347','#00CED1','#FF69B4'] },
  ];

  const features = [
    {
      icon: '📷',
      tag: 'Core Feature',
      title: 'AI Skin Analysis',
      desc: 'Upload a selfie and our AI maps your exact skin tone using ITA color theory, then curates your complete personal color palette.',
      items: ['Skin tone detected & categorized', 'Best colors for shirts & tops', 'Colors to avoid', 'Seasonal palette assigned'],
      id: 'analyze',
      label: 'Analyze'
    },
    {
      icon: '👗',
      tag: 'Style Vault',
      title: 'Your Wardrobe',
      desc: 'Build and organize your personal wardrobe. Get AI outfit combinations and never wonder "what to wear" again.',
      items: ['Save your clothing pieces', 'AI outfit combinations', 'Occasion-based suggestions', 'Fit performance score'],
      id: 'wardrobe',
      label: 'Wardrobe'
    },
    {
      icon: '⚙️',
      tag: 'Power Tools',
      title: 'Style Tools',
      desc: 'AI style chat, outfit checker, outfit calendar, color contrast checker, and trending fashion picks — all in one place.',
      items: ['AI StyleBot chat', 'Outfit checker tool', 'Outfit calendar', 'Trending styles in India'],
      id: 'tools',
      label: 'Tools'
    },
  ];

  return (
    <div style={{ background: '#0A0A0A', color: '#F0EDE6', minHeight: '100vh', overflowX: 'hidden', fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      <SEOHead
        title="StyleGuru AI — AI Fashion Advisor for Your Skin Tone"
        description="Discover your perfect colors and outfits with AI-powered skin tone analysis. Personalized fashion advice for every Indian skin tone."
      />

      {/* ─── Login Gate Modal ─── */}
      {gateFeature && (
        <LoginGateModal
          feature={gateFeature}
          onClose={() => setGateFeature(null)}
          onLogin={() => { setGateFeature(null); onLoginClick(); }}
        />
      )}

      {/* ─── Mobile Menu ─── */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navItems={navItems}
        onItemClick={(item) => item.requiresAuth ? handleFeatureClick(item.label, item.id) : null}
        onLoginClick={onLoginClick}
      />

      {/* ════════════════════════════════════════
          NAVBAR
          ════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-[100]"
        style={{
          borderBottom: isScrolled ? '1px solid #1C1C1C' : '1px solid transparent',
          background: isScrolled ? 'rgba(10,10,10,0.95)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(20px)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between" style={{ height: 64 }}>
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{ width: 30, height: 30, background: '#C9A96E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#0A0A0A', letterSpacing: '0.05em' }}>SG</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#F0EDE6', letterSpacing: '0.06em', textTransform: 'uppercase' }}>StyleGuru AI</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => item.requiresAuth ? handleFeatureClick(item.label, item.id) : null}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#6B6B6B',
                  padding: '4px 0',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.target.style.color = '#F0EDE6'}
                onMouseLeave={e => e.target.style.color = '#6B6B6B'}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onLoginClick}
              style={{ background: 'none', border: '1px solid #242424', color: '#F0EDE6', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '9px 20px', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#C9A96E'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#242424'}
            >
              Login
            </button>
            <button onClick={onGetStarted} className="btn-gold" style={{ padding: '9px 20px' }}>
              Get Started
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden"
            style={{ background: 'none', border: 'none', color: '#F0EDE6', cursor: 'pointer', padding: '8px', fontSize: '20px' }}
          >
            ☰
          </button>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 64 }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8 py-20">

            {/* Left: Text */}
            <div className="flex-[1.2] text-center lg:text-left">
              <p className="luxe-label mb-8 fade-up" style={{ color: '#C9A96E', animationDelay: '0.1s', opacity: 0 }}>
                AI-Powered Fashion Intelligence
              </p>

              <h1
                className="luxe-display fade-up"
                style={{ fontSize: 'clamp(48px, 8vw, 88px)', color: '#F0EDE6', marginBottom: '24px', animationDelay: '0.2s', opacity: 0 }}
              >
                Discover Your<br />
                <em style={{ fontStyle: 'italic', color: '#C9A96E' }}>Perfect</em> Style
              </h1>

              <p className="fade-up" style={{ fontSize: '15px', color: '#6B6B6B', lineHeight: '1.8', marginBottom: '40px', maxWidth: 460, animationDelay: '0.3s', opacity: 0 }}>
                Upload a selfie. Our AI analyzes your skin tone, curates your color palette, and builds a personalized style guide — all in seconds.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
                <button onClick={onGetStarted} className="btn-gold" style={{ padding: '16px 44px', fontSize: '11px' }}>
                  Analyze My Style →
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-luxe-outline"
                  style={{ padding: '16px 44px', fontSize: '11px', color: 'var(--luxe-text)' }}
                >
                  Explore Features
                </button>
              </div>

              {/* Trust signals */}
              <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start fade-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
                <span style={{ fontSize: '11px', color: '#3A3A3A', letterSpacing: '0.05em' }}>✓ Free Forever</span>
                <span style={{ color: '#242424' }}>|</span>
                <span style={{ fontSize: '11px', color: '#3A3A3A', letterSpacing: '0.05em' }}>✓ No Credit Card</span>
                <span style={{ color: '#242424' }}>|</span>
                <span style={{ fontSize: '11px', color: '#3A3A3A', letterSpacing: '0.05em' }}>✓ Instant Results</span>
              </div>
            </div>

            {/* Right: Editorial Image */}
            <div className="flex-1 flex justify-center lg:justify-end w-full max-w-sm lg:max-w-none float">
              <div style={{ position: 'relative' }}>
                {/* Outer frame */}
                <div style={{ border: '1px solid #242424', padding: '8px', background: '#111111' }}>
                  <div style={{ width: '100%', maxWidth: 340, height: 440, overflow: 'hidden', position: 'relative' }}>
                    <img
                      src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=680&q=85&auto=format&fit=crop"
                      alt="Fashion editorial"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(20%) contrast(1.05)' }}
                    />
                    {/* Analysis overlay */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.92))' }}>
                      <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#C9A96E', textTransform: 'uppercase', marginBottom: '8px' }}>AI Analysis</p>
                      <p style={{ fontSize: '15px', fontFamily: "'Playfair Display', serif", color: '#F0EDE6', marginBottom: '8px' }}>Medium Warm Tone</p>
                      <div className="flex gap-1.5">
                        {['#000080','#008080','#800000','#556B2F','#FF7F50','#FFDB58'].map(c => (
                          <div key={c} style={{ width: 18, height: 18, borderRadius: '2px', background: c }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div style={{ position: 'absolute', top: -12, right: -12, background: '#C9A96E', padding: '8px 14px' }}>
                  <p style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#0A0A0A', fontWeight: 600 }}>98% ACCURACY</p>
                </div>

                {/* Bottom badge */}
                <div style={{ position: 'absolute', bottom: -12, left: -12, background: '#111111', border: '1px solid #242424', padding: '8px 14px' }}>
                  <p style={{ fontSize: '9px', letterSpacing: '0.1em', color: '#6B6B6B' }}>
                    <span style={{ color: '#C9A96E' }}>10,000+</span> analyses done
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS BAR
          ════════════════════════════════════════ */}
      <div style={{ borderTop: '1px solid #1C1C1C', borderBottom: '1px solid #1C1C1C' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { value: '10,000+', label: 'Style Analyses' },
              { value: '98%', label: 'Accuracy Rate' },
              { value: '6', label: 'Skin Tone Types' },
              { value: '100%', label: 'Free Forever' },
            ].map((stat, i) => (
              <div
                key={i}
                className="text-center py-8 px-4"
                style={{ borderRight: i < 3 ? '1px solid #1C1C1C' : 'none', borderBottom: i < 2 ? '1px solid #1C1C1C' : 'none' }}
              >
                <p className="luxe-display mb-1" style={{ fontSize: '32px', color: '#F0EDE6' }}>{stat.value}</p>
                <p className="luxe-label" style={{ color: '#6B6B6B', fontSize: '9px' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          FEATURE PREVIEW (explore without login)
          ════════════════════════════════════════ */}
      <section id="features" className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        <div className="text-center mb-16">
          <p className="luxe-label mb-4" style={{ color: '#C9A96E' }}>What's Inside</p>
          <h2 className="luxe-display" style={{ fontSize: 'clamp(32px, 5vw, 52px)', color: '#F0EDE6' }}>
            Your Complete Style Suite
          </h2>
          <div className="luxe-divider mt-8 mb-4 max-w-xs mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ border: '1px solid #1C1C1C' }}>
          {features.map((f, i) => (
            <div
              key={f.id}
              className="stagger-1"
              style={{
                background: '#111111',
                padding: '40px 32px',
                borderRight: i < 2 ? '1px solid #1C1C1C' : 'none',
                animationDelay: `${i * 0.1}s`, opacity: 0,
                position: 'relative',
                transition: 'background 0.25s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#141414'}
              onMouseLeave={e => e.currentTarget.style.background = '#111111'}
            >
              <p className="luxe-label mb-6" style={{ color: '#C9A96E' }}>{f.tag}</p>
              <div style={{ fontSize: '28px', marginBottom: '16px' }}>{f.icon}</div>
              <h3 className="luxe-display mb-3" style={{ fontSize: '22px', color: '#F0EDE6' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: '1.7', marginBottom: '28px' }}>{f.desc}</p>

              {/* Locked preview */}
              <div style={{ padding: '16px', background: '#0A0A0A', marginBottom: '28px', position: 'relative', overflow: 'hidden' }}>
                <p className="luxe-label mb-3" style={{ color: '#3A3A3A', fontSize: '9px' }}>Preview</p>
                <div style={{ filter: 'blur(3px)', pointerEvents: 'none' }}>
                  {f.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-3 mb-2">
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9A96E', flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: '#6B6B6B' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,10,0.5)' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#C9A96E', textTransform: 'uppercase' }}>🔒 Members Only</span>
                </div>
              </div>

              <button
                onClick={() => handleFeatureClick(f.label, f.id)}
                className="btn-luxe-outline w-full"
              >
                Sign In to Access →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS
          ════════════════════════════════════════ */}
      <section style={{ borderTop: '1px solid #1C1C1C', borderBottom: '1px solid #1C1C1C', padding: '80px 0' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center mb-14">
            <p className="luxe-label mb-4" style={{ color: '#C9A96E' }}>The Process</p>
            <h2 className="luxe-display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#F0EDE6' }}>
              Three Steps to Your Style
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              { n: '01', title: 'Upload a Photo', desc: 'Take a selfie or upload any clear photo of your face. Natural lighting gives the best results.' },
              { n: '02', title: 'AI Analyzes', desc: 'Our algorithm measures your skin tone using ITA angle calculation and seasonal color theory.' },
              { n: '03', title: 'Get Your Guide', desc: 'Receive your full color palette, outfit combinations, shopping links, and personalized style tips.' },
            ].map((step, i) => (
              <div
                key={i}
                className="text-center md:text-left"
                style={{ padding: '40px', borderRight: i < 2 ? '1px solid #1C1C1C' : 'none' }}
              >
                <p className="luxe-display mb-6" style={{ fontSize: '72px', color: '#1C1C1C', lineHeight: 1 }}>{step.n}</p>
                <h3 style={{ fontSize: '17px', fontWeight: 500, color: '#F0EDE6', marginBottom: '12px' }}>{step.title}</h3>
                <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: '1.75' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SKIN TONE SHOWCASE
          ════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        <div className="text-center mb-14">
          <p className="luxe-label mb-4" style={{ color: '#C9A96E' }}>Personalized for You</p>
          <h2 className="luxe-display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#F0EDE6' }}>
            Every Skin Tone. Every Style.
          </h2>
          <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '12px', maxWidth: 480, margin: '12px auto 0' }}>
            StyleGuru AI is built specifically for the rich spectrum of Indian skin tones.
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-8">
          {skinTones.map((tone, i) => (
            <SkinToneSwatch key={i} {...tone} />
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          EDITORIAL TESTIMONIAL
          ════════════════════════════════════════ */}
      <section style={{ borderTop: '1px solid #1C1C1C', padding: '80px 0', background: '#111111' }}>
        <div className="max-w-2xl mx-auto text-center px-6">
          <p className="luxe-label mb-8" style={{ color: '#C9A96E' }}>What They Say</p>
          <div style={{ position: 'relative', minHeight: 120 }}>
            {testimonials.map((t, i) => (
              <div
                key={i}
                style={{
                  position: i === 0 ? 'relative' : 'absolute',
                  top: 0, left: 0, right: 0,
                  opacity: activeTestimonial === i ? 1 : 0,
                  transition: 'opacity 0.6s ease',
                  pointerEvents: activeTestimonial === i ? 'auto' : 'none'
                }}
              >
                <blockquote className="luxe-display" style={{ fontSize: 'clamp(18px, 3vw, 26px)', color: '#F0EDE6', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '24px' }}>
                  "{t.quote}"
                </blockquote>
                <p className="luxe-label" style={{ color: '#6B6B6B', fontSize: '10px' }}>
                  — {t.author}, {t.location}
                </p>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-10">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                style={{
                  width: activeTestimonial === i ? 20 : 6,
                  height: 2,
                  background: activeTestimonial === i ? '#C9A96E' : '#2A2A2A',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA BANNER
          ════════════════════════════════════════ */}
      <section style={{ borderTop: '1px solid #1C1C1C' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-24 text-center">
          <p className="luxe-label mb-6" style={{ color: '#C9A96E' }}>Begin Today</p>
          <h2 className="luxe-display mb-6" style={{ fontSize: 'clamp(36px, 6vw, 72px)', color: '#F0EDE6' }}>
            Your Style Journey<br />Starts Here
          </h2>
          <p style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '40px', maxWidth: 420, margin: '0 auto 40px' }}>
            Join thousands of users across India who have discovered their perfect style with StyleGuru AI.
          </p>
          <button onClick={onGetStarted} className="btn-gold" style={{ padding: '18px 56px', fontSize: '11px' }}>
            Get Started Free →
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
          ════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid #1C1C1C', padding: '56px 0 32px', background: '#0A0A0A' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div style={{ width: 28, height: 28, background: '#C9A96E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#0A0A0A' }}>SG</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#F0EDE6', letterSpacing: '0.06em', textTransform: 'uppercase' }}>StyleGuru AI</span>
              </div>
              <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: '1.7', maxWidth: 280 }}>
                AI-powered fashion intelligence for every skin tone. Made in India 🇮🇳
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="luxe-label mb-4" style={{ color: '#3A3A3A', fontSize: '9px' }}>Product</p>
              {['Analyze', 'History', 'Wardrobe', 'Tools', 'Blog'].map(link => (
                <div key={link} style={{ marginBottom: '10px' }}>
                  <button
                    onClick={() => link === 'Blog' ? window.location.href = '/blog' : handleFeatureClick(link, link.toLowerCase())}
                    style={{ background: 'none', border: 'none', color: '#6B6B6B', fontSize: '13px', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#F0EDE6'}
                    onMouseLeave={e => e.target.style.color = '#6B6B6B'}
                  >{link}</button>
                </div>
              ))}
            </div>

            {/* Company */}
            <div>
              <p className="luxe-label mb-4" style={{ color: '#3A3A3A', fontSize: '9px' }}>Company</p>
              {[
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
              ].map(link => (
                <div key={link.label} style={{ marginBottom: '10px' }}>
                  <a href={link.href} style={{ color: '#6B6B6B', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#F0EDE6'}
                    onMouseLeave={e => e.target.style.color = '#6B6B6B'}
                  >{link.label}</a>
                </div>
              ))}
            </div>
          </div>

          <div className="luxe-divider mb-6" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p style={{ fontSize: '11px', color: '#3A3A3A', letterSpacing: '0.05em' }}>
              © 2026 StyleGuru AI. All rights reserved.
            </p>
            <p className="luxe-label" style={{ color: '#3A3A3A', fontSize: '9px' }}>
              Designed for Indian skin tones · Built in India 🇮🇳
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
