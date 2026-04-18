import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SplashScreen.jsx — StyleGuruAI Cinematic Entrance v5
 * ──────────────────────────────────────────────────────
 * Premium animated splash: rotating rings, floating particles,
 * shimmer logo, staggered reveals, synced progress bar.
 */

// ── Floating particle dot ─────────────────────────────
function Particle({ x, y, size, duration, delay, color }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: 'blur(0.5px)',
        pointerEvents: 'none',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0.4, 0],
        scale: [0, 1, 0.8, 0],
        y: [0, -60, -120],
        x: [0, Math.random() * 20 - 10],
      }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: Math.random() * 2 }}
    />
  );
}

// ── Generate random particles ─────────────────────────
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: 30 + Math.random() * 60,
  size: `${2 + Math.random() * 4}px`,
  duration: 2.5 + Math.random() * 2.5,
  delay: Math.random() * 3,
  color: ['rgba(139,92,246,0.9)', 'rgba(236,72,153,0.8)', 'rgba(99,102,241,0.9)', 'rgba(167,139,250,0.7)'][i % 4],
}));

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0); // 0=logo, 1=text, 2=badges, 3=fade
  const TOTAL = 2800;

  useEffect(() => {
    // Progress bar animation (0→100 over TOTAL ms)
    const start = Date.now();
    const raf = () => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, (elapsed / TOTAL) * 100));
      if (elapsed < TOTAL) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Phase timers
    const t1 = setTimeout(() => setPhase(1), 600);  // text reveal
    const t2 = setTimeout(() => setPhase(2), 1100); // badges reveal
    const t3 = setTimeout(() => setPhase(3), 2400); // fade-out starts
    const t4 = setTimeout(() => onComplete(), TOTAL);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 3 ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'radial-gradient(ellipse at 50% 40%, #130926 0%, #050816 65%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          fontFamily: "'Outfit', 'Inter', sans-serif",
        }}
      >
        {/* ── Background ambient blobs ─────────────────── */}
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.22, 0.38, 0.22] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', width: '75vw', height: '75vw',
            background: 'radial-gradient(circle, rgba(109,40,217,0.35) 0%, transparent 70%)',
            borderRadius: '50%', filter: 'blur(70px)',
            top: '10%', left: '50%', transform: 'translateX(-50%)',
          }}
        />
        <motion.div
          animate={{ scale: [1.1, 0.85, 1.1], opacity: [0.14, 0.26, 0.14] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          style={{
            position: 'absolute', width: '55vw', height: '55vw',
            background: 'radial-gradient(circle, rgba(236,72,153,0.28) 0%, transparent 70%)',
            borderRadius: '50%', filter: 'blur(60px)',
            bottom: '5%', right: '-5%',
          }}
        />

        {/* ── Floating particles ───────────────────────── */}
        {PARTICLES.map(p => <Particle key={p.id} {...p} />)}

        {/* ── Shooting star ────────────────────────────── */}
        <motion.div
          style={{
            position: 'absolute', top: '18%', left: '-10%',
            width: 180, height: 1.5,
            background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.9), transparent)',
            borderRadius: 99, rotate: 30,
          }}
          animate={{ x: ['0vw', '120vw'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.2, delay: 0.9, repeat: Infinity, repeatDelay: 4.5, ease: 'easeIn' }}
        />
        <motion.div
          style={{
            position: 'absolute', top: '62%', left: '-8%',
            width: 120, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(236,72,153,0.7), transparent)',
            borderRadius: 99, rotate: 20,
          }}
          animate={{ x: ['0vw', '110vw'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.1, delay: 2.7, repeat: Infinity, repeatDelay: 5.2, ease: 'easeIn' }}
        />

        {/* ── Main content ─────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px' }}>

          {/* ── Logo with rings ──────────────────────────── */}
          <div style={{ position: 'relative', width: 148, height: 148, margin: '0 auto 28px' }}>

            {/* Outer rotating ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', inset: -8,
                border: '1.5px solid transparent',
                borderRadius: '50%',
                background: 'linear-gradient(#050816, #050816) padding-box, linear-gradient(135deg, rgba(139,92,246,0.9), rgba(236,72,153,0.4), rgba(99,102,241,0.1), rgba(139,92,246,0.9)) border-box',
              }}
            />
            {/* Inner rotating ring (opposite) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', inset: 2,
                border: '1px solid transparent',
                borderRadius: '50%',
                background: 'linear-gradient(#050816, #050816) padding-box, linear-gradient(225deg, rgba(236,72,153,0.7), transparent, rgba(139,92,246,0.5), transparent) border-box',
              }}
            />
            {/* Orbit dot on outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', inset: -8, borderRadius: '50%' }}
            >
              <div style={{
                position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
                width: 7, height: 7, borderRadius: '50%',
                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                boxShadow: '0 0 10px rgba(139,92,246,1)',
              }} />
            </motion.div>

            {/* Logo square */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.72, ease: [0.23, 1, 0.32, 1] }}
              style={{
                position: 'absolute', inset: 14,
                background: 'linear-gradient(135deg, #6B4EFF 0%, #8B5CF6 50%, #EC4899 100%)',
                borderRadius: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 24px 60px -8px rgba(139,92,246,0.80), 0 0 80px rgba(139,92,246,0.30)',
                overflow: 'hidden',
              }}
            >
              {/* Gloss sweep */}
              <motion.div
                animate={{ x: ['-180%', '200%'] }}
                transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.6 }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)',
                  transform: 'skewX(-15deg)',
                }}
              />
              {/* ∞ symbol */}
              <motion.span
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'relative', zIndex: 2,
                  fontSize: 52, color: 'white',
                  fontWeight: 300, letterSpacing: '-2px',
                  lineHeight: 1, userSelect: 'none',
                  filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.4))',
                }}
              >
                ∞
              </motion.span>
            </motion.div>
          </div>

          {/* ── Brand name ────────────────────────────────── */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
              >
                <motion.h1
                  style={{
                    fontSize: 28, fontWeight: 900,
                    margin: '0 0 4px',
                    letterSpacing: '0.20em',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(90deg, #FFFFFF 5%, #C084FC 50%, #EC4899 95%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.1,
                  }}
                >
                  StyleGuru AI
                </motion.h1>

                {/* Animated divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.18, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  style={{
                    height: 2, width: 90,
                    background: 'linear-gradient(90deg, transparent, #8B5CF6, #EC4899, transparent)',
                    margin: '10px auto 14px', borderRadius: 99,
                  }}
                />

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.28, duration: 0.5 }}
                  style={{
                    fontSize: 13, fontWeight: 500,
                    color: 'rgba(255,255,255,0.50)',
                    letterSpacing: '0.08em',
                    margin: '0 0 22px',
                    lineHeight: 1.5,
                  }}
                >
                  Your Personal AI Fashion Advisor
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Trust badges ──────────────────────────────── */}
          <AnimatePresence>
            {phase >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}
              >
                {[
                  { icon: '🔒', text: '100% Private' },
                  { icon: '⚡', text: 'AI Powered' },
                  { icon: '🎨', text: 'Skin-Matched' },
                ].map((badge, i) => (
                  <motion.div
                    key={badge.text}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.09, duration: 0.35 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 13px',
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.20)',
                      borderRadius: 99,
                      fontSize: 11, fontWeight: 600,
                      color: 'rgba(255,255,255,0.55)',
                      letterSpacing: '0.03em',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{badge.icon}</span>
                    <span>{badge.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Progress bar at bottom ────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ position: 'absolute', bottom: 72, width: 200, zIndex: 10 }}
        >
          {/* Track */}
          <div style={{
            height: 2.5, width: '100%',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 99, overflow: 'hidden',
          }}>
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899)',
                borderRadius: 99,
                boxShadow: '0 0 10px rgba(139,92,246,0.8)',
                width: `${progress}%`,
              }}
              transition={{ ease: 'linear' }}
            />
          </div>
          {/* Percentage label */}
          <motion.p
            style={{
              marginTop: 8, textAlign: 'center',
              fontSize: 9, fontWeight: 700,
              color: 'rgba(255,255,255,0.20)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            Loading {Math.round(progress)}%
          </motion.p>
        </motion.div>

        {/* ── Bottom footer ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          style={{
            position: 'absolute', bottom: 22,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 99 }} />
          <p style={{
            fontSize: 9, fontWeight: 500,
            color: 'rgba(255,255,255,0.12)',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            margin: 0,
          }}>
            Trusted by fashion lovers across India
          </p>
          <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 99 }} />
        </motion.div>

      </motion.div>
    </AnimatePresence>
  );
}
