import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SplashScreen.jsx — StyleGuruAI Premium Entrance v2
 * Phase 1 (1.5s): Infinity logo only — clean and bold
 * Phase 2 (1.7s): Logo + brand name + fashion tagline + loading bar
 * ⚠️ NO grooming references. Fashion AI identity only.
 */
export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(2), 1500);
    const t2 = setTimeout(() => onComplete(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  const GRAD = 'linear-gradient(135deg, #4F46E5 0%, #8B5CF6 50%, #EC4899 100%)';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#050816',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>

      {/* Ambient glow — purple center */}
      <motion.div
        animate={{ opacity: [0.15, 0.28, 0.15], scale: [1, 1.18, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: '75vw', height: '75vw',
          background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(90px)', zIndex: 0
        }}
      />
      {/* Ambient glow — pink corner */}
      <motion.div
        animate={{ opacity: [0.08, 0.16, 0.08], scale: [1.1, 0.88, 1.1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        style={{
          position: 'absolute', width: '55vw', height: '55vw',
          background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(70px)',
          right: '-10%', bottom: '-5%', zIndex: 0
        }}
      />

      {/* Floating particle dots */}
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div key={i}
          animate={{ opacity: [0, 0.65, 0], y: [0, -55, 0] }}
          transition={{ duration: 2.5, delay: i * 0.45, repeat: Infinity }}
          style={{
            position: 'absolute',
            width: 4, height: 4, borderRadius: '50%',
            background: i % 2 === 0 ? '#8B5CF6' : '#EC4899',
            left: `${16 + i * 14}%`, bottom: '18%', zIndex: 1
          }}
        />
      ))}

      {/* ─── Phase 1: Big infinity logo ─── */}
      <AnimatePresence mode="wait">
        {phase === 1 && (
          <motion.div key="phase1"
            initial={{ opacity: 0, scale: 0.65, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.08, y: -25 }}
            transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
            style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}
          >
            <div style={{
              width: 136, height: 136,
              background: GRAD,
              borderRadius: 40,
              margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 64,
              boxShadow: '0 32px 64px -12px rgba(139,92,246,0.7), 0 0 0 1px rgba(255,255,255,0.07)',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Gloss sweep */}
              <motion.div
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.9 }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
                  transform: 'skewX(-18deg)'
                }}
              />
              <motion.span
                animate={{ scale: [1, 1.12, 1], rotate: [0, 6, -6, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'relative', zIndex: 2, lineHeight: 1 }}
              >∞</motion.span>
            </div>
          </motion.div>
        )}

        {/* ─── Phase 2: Logo + Brand + Tagline + Loading ─── */}
        {phase === 2 && (
          <motion.div key="phase2"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 28px', width: '100%', maxWidth: 320 }}
          >
            {/* Compact logo */}
            <motion.div
              initial={{ scale: 0.75 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              style={{
                width: 76, height: 76,
                background: GRAD,
                borderRadius: 24,
                margin: '0 auto 22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36,
                boxShadow: '0 16px 40px -8px rgba(139,92,246,0.55)',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <motion.div
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.1 }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transform: 'skewX(-18deg)'
                }}
              />
              <span style={{ position: 'relative', zIndex: 2 }}>∞</span>
            </motion.div>

            {/* Brand name */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
              style={{
                fontSize: 26, fontWeight: 900,
                margin: '0 0 4px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                background: 'linear-gradient(90deg, #fff 20%, #C084FC 60%, #EC4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              StyleGuru AI
            </motion.h1>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              style={{
                height: 2, width: 90,
                background: 'linear-gradient(90deg, transparent, #8B5CF6, #EC4899, transparent)',
                margin: '11px auto 13px', borderRadius: 99
              }}
            />

            {/* Primary tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.32 }}
              style={{
                fontSize: 10.5, fontWeight: 700,
                color: 'rgba(255,255,255,0.42)',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                margin: '0 0 5px'
              }}
            >
              AI-Powered Fashion Intelligence
            </motion.p>

            {/* Sub tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              style={{
                fontSize: 11, fontWeight: 400,
                color: 'rgba(255,255,255,0.2)',
                letterSpacing: '0.1em',
                margin: '0 0 28px'
              }}
            >
              Personalized for you ✦
            </motion.p>

            {/* Loading progress bar */}
            <div style={{
              width: '100%', maxWidth: 200, height: 3,
              background: 'rgba(255,255,255,0.07)',
              borderRadius: 99, overflow: 'hidden',
              margin: '0 auto 16px'
            }}>
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
                style={{
                  height: '100%', width: '100%',
                  background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899)',
                  borderRadius: 99,
                  boxShadow: '0 0 14px rgba(139,92,246,0.8)'
                }}
              />
            </div>

            {/* Pulse dots */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, delay: i * 0.22, repeat: Infinity }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6' }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer brand line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 2 ? 1 : 0 }}
        transition={{ delay: 0.7 }}
        style={{
          position: 'absolute', bottom: 22,
          fontSize: 9.5, fontWeight: 600,
          color: 'rgba(255,255,255,0.14)',
          letterSpacing: '0.1em', textTransform: 'uppercase'
        }}
      >
        POWERED BY STYLEGURU ENGINE v1.2
      </motion.p>
    </div>
  );
}
