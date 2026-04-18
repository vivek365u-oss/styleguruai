/**
 * LoadingScreenWithProgress.jsx — Human-feeling loading screen v2
 * No AI-generated look. Clean, warm, editorial design.
 * Fast feel, never stuck, no heavy emoji overload.
 */

import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const TIPS = [
  'Skin tone is best read in natural daylight 🌤️',
  'Warm undertones love earthy, amber & rust shades',
  'Cool undertones pop with blues, lavenders & berries',
  'Your color season is determined by tone + undertone',
  'Neutral undertones can wear almost any palette',
  'Skin-tone matching improves outfit confidence by 40%',
  'Most Indian skin tones are warm or neutral-warm',
];

export function LoadingScreenWithProgress({ progress }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const rawPercent = typeof progress === 'number'
    ? progress
    : (progress?.percent ?? 0);
  const label = (typeof progress === 'object' && progress?.label) || 'Analyzing your photo...';
  const isError = progress?.isError || false;

  const [displayed, setDisplayed] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  // Smooth percent counter
  useEffect(() => {
    let raf;
    const run = () => {
      setDisplayed(prev => {
        const diff = rawPercent - prev;
        if (Math.abs(diff) < 0.2) return rawPercent;
        return prev + diff * 0.12; // eased approach
      });
      raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [rawPercent]);

  // Rotate tips every 3.5s
  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const pct = Math.min(Math.round(displayed), 100);

  // Step nodes
  const steps = [
    { label: 'Upload',     threshold: 5  },
    { label: 'Skin Tone',  threshold: 35 },
    { label: 'Palette',    threshold: 65 },
    { label: 'Outfit',     threshold: 85 },
    { label: 'Done',       threshold: 100 },
  ];

  const bg = isDark ? '#050816' : '#F8F7FF';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(139,92,246,0.12)';
  const textPrimary = isDark ? '#FFFFFF' : '#1A1A2E';
  const textMuted = isDark ? 'rgba(255,255,255,0.35)' : '#6366F1';
  const GRAD = 'linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899)';

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      background: bg,
      fontFamily: "'Outfit', 'Inter', sans-serif",
    }}>

      {/* Top: Logo + pulsing ring */}
      <div style={{ marginBottom: 32, position: 'relative' }}>
        {/* Outer glow ring */}
        <div style={{
          position: 'absolute', inset: -14,
          borderRadius: '50%',
          background: `conic-gradient(#8B5CF6 ${pct}%, transparent ${pct}%)`,
          animation: 'spin 3s linear infinite',
          opacity: 0.25,
        }} />

        {/* App logo */}
        <div style={{
          width: 88, height: 88,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)',
          borderRadius: 26,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40,
          boxShadow: '0 16px 48px rgba(139,92,246,0.45)',
          position: 'relative', zIndex: 1,
          overflow: 'hidden',
        }}>
          {/* Shine sweep */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            animation: 'shimmer 2s ease-in-out infinite',
          }} />
          <span style={{ position: 'relative', zIndex: 2, color: 'white', fontWeight: 300 }}>∞</span>
        </div>
      </div>

      {/* Status label */}
      <p style={{
        fontSize: 18, fontWeight: 800,
        color: textPrimary,
        marginBottom: 6, textAlign: 'center',
        letterSpacing: '-0.02em',
      }}>
        {isError ? '⚠️ Analysis Failed' : label}
      </p>
      <p style={{
        fontSize: 12, color: textMuted,
        marginBottom: 28, textAlign: 'center',
        letterSpacing: '0.04em',
      }}>
        {isError ? 'Please retry with a clearer photo' : 'StyleGuruAI is crafting your style profile'}
      </p>

      {/* Progress bar */}
      {!isError && (
        <>
          <div style={{
            width: '100%', maxWidth: 280,
            height: 6, borderRadius: 99,
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.12)',
            overflow: 'hidden', marginBottom: 12,
          }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: GRAD,
              borderRadius: 99,
              transition: 'width 0.3s ease',
              boxShadow: '0 0 12px rgba(139,92,246,0.5)',
            }} />
          </div>

          {/* Percent + step label */}
          <p style={{ fontSize: 12, color: textMuted, marginBottom: 28, letterSpacing: '0.06em' }}>
            {pct}% complete
          </p>

          {/* Step nodes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
            {steps.map((step, i) => {
              const done = pct >= step.threshold;
              const active = pct < step.threshold && (i === 0 || pct >= steps[i - 1].threshold);
              return (
                <React.Fragment key={step.label}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    opacity: done || active ? 1 : 0.35,
                    transition: 'opacity 0.4s',
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: done ? '#10B981' : active ? '#8B5CF6' : (isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB'),
                      boxShadow: active ? '0 0 8px rgba(139,92,246,0.6)' : 'none',
                      transition: 'all 0.4s',
                    }} />
                    <span style={{ fontSize: 9, color: textMuted, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{
                      flex: 1, height: 1,
                      background: pct >= step.threshold
                        ? 'linear-gradient(90deg, #10B981, #8B5CF6)'
                        : (isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'),
                      transition: 'background 0.5s',
                      marginBottom: 14,
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Rotating tip */}
          <div style={{
            width: '100%', maxWidth: 300,
            padding: '12px 16px',
            background: cardBg,
            border: `1px solid ${border}`,
            borderRadius: 16,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              Style Tip
            </p>
            <p style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.55)' : '#374151', lineHeight: 1.6, transition: 'opacity 0.5s' }}>
              {TIPS[tipIdx]}
            </p>
          </div>
        </>
      )}

      {/* Error card */}
      {isError && (
        <div style={{
          padding: '16px 24px', borderRadius: 16,
          background: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
          border: '1px solid rgba(239,68,68,0.3)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 13, color: isDark ? '#FCA5A5' : '#DC2626', fontWeight: 600 }}>
            {progress?.label || 'Could not analyze photo. Please use a clear, well-lit selfie.'}
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%,100% { transform: translateX(-100%); } 50% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}

export default LoadingScreenWithProgress;
