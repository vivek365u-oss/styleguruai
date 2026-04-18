import React, { useEffect, useState } from 'react';

/**
 * SplashScreen.jsx — StyleGuruAI Clean Entrance v6
 * Simple, fast, lightweight: real logo + brand name + progress bar.
 * No heavy particle/ring animations — smooth & instant feel.
 */
export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const TOTAL = 2200;

  useEffect(() => {
    // Smooth progress bar
    const start = Date.now();
    let raf;
    const tick = () => {
      const p = Math.min(100, ((Date.now() - start) / TOTAL) * 100);
      setProgress(p);
      if (p < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Fade out then call onComplete
    const fadeT  = setTimeout(() => setVisible(false), TOTAL - 350);
    const doneT  = setTimeout(() => onComplete(), TOTAL);
    return () => { cancelAnimationFrame(raf); clearTimeout(fadeT); clearTimeout(doneT); };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#050816',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.35s ease',
    }}>

      {/* Subtle bg glow — CSS only, no JS animation */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(109,40,217,0.22) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 1,
        textAlign: 'center', padding: '0 24px',
        animation: 'sgFadeUp 0.6s cubic-bezier(0.23,1,0.32,1) both',
      }}>

        {/* Real app logo */}
        <img
          src="/logo.png"
          alt="StyleGuru AI"
          style={{
            width: 110, height: 110,
            borderRadius: 28,
            objectFit: 'cover',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 20px 50px -8px rgba(139,92,246,0.65)',
            display: 'block',
            margin: '0 auto 22px',
          }}
        />

        {/* Brand name */}
        <h1 style={{
          fontSize: 26, fontWeight: 900,
          margin: '0 0 6px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          background: 'linear-gradient(90deg, #ffffff 10%, #C084FC 55%, #EC4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          StyleGuru AI
        </h1>

        {/* Divider */}
        <div style={{
          height: 2, width: 70,
          background: 'linear-gradient(90deg, transparent, #8B5CF6, #EC4899, transparent)',
          margin: '10px auto 14px', borderRadius: 99,
        }} />

        {/* Tagline */}
        <p style={{
          fontSize: 13, fontWeight: 500,
          color: 'rgba(255,255,255,0.42)',
          letterSpacing: '0.05em',
          margin: '0 0 28px',
        }}>
          Your Personal AI Fashion Advisor
        </p>

        {/* Trust badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { icon: '🔒', text: '100% Private' },
            { icon: '⚡', text: 'AI Powered'   },
            { icon: '🎨', text: 'Skin-Matched'  },
          ].map(b => (
            <div key={b.text} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px',
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.18)',
              borderRadius: 99,
              fontSize: 11, fontWeight: 600,
              color: 'rgba(255,255,255,0.45)',
            }}>
              <span>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 68,
        width: 180, zIndex: 1,
      }}>
        <div style={{
          height: 2.5, width: '100%',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 99, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899)',
            borderRadius: 99,
            transition: 'width 0.05s linear',
          }} />
        </div>
        <p style={{
          marginTop: 7, textAlign: 'center',
          fontSize: 9, fontWeight: 700,
          color: 'rgba(255,255,255,0.18)',
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          Loading {Math.round(progress)}%
        </p>
      </div>

      {/* Footer */}
      <p style={{
        position: 'absolute', bottom: 20,
        fontSize: 9, fontWeight: 500,
        color: 'rgba(255,255,255,0.10)',
        letterSpacing: '0.13em', textTransform: 'uppercase',
        margin: 0,
      }}>
        Trusted by fashion lovers across India
      </p>

      {/* One-time keyframe — no Framer Motion needed */}
      <style>{`
        @keyframes sgFadeUp {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}
