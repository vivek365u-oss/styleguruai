import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * SplashScreen.jsx — StyleGuruAI Premium Entrance v3
 * ⚠️ SINGLE PHASE — Just the real app logo, no multi-step loading.
 * Shows for 2.4s then calls onComplete().
 * The logo matches the actual PWA app icon (gradient square + ∞ symbol).
 */
export default function SplashScreen({ onComplete }) {
  useEffect(() => {
    const t = setTimeout(() => onComplete(), 2400);
    return () => clearTimeout(t);
  }, [onComplete]);

  const GRAD = 'linear-gradient(135deg, #6B4EFF 0%, #8B5CF6 45%, #EC4899 100%)';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#050816',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>

      {/* Purple ambient glow */}
      <motion.div
        animate={{ opacity: [0.18, 0.3, 0.18], scale: [1, 1.15, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: '70vw', height: '70vw',
          background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(80px)', zIndex: 0
        }}
      />
      {/* Pink ambient glow — bottom right */}
      <motion.div
        animate={{ opacity: [0.08, 0.18, 0.08], scale: [1.1, 0.9, 1.1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute', width: '50vw', height: '50vw',
          background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(70px)',
          right: '-8%', bottom: '-5%', zIndex: 0
        }}
      />

      {/* ── LOGO — matches the actual PWA app icon style ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}
      >
        {/* The app logo square */}
        <div style={{
          width: 130, height: 130,
          background: GRAD,
          borderRadius: 36,
          margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 30px 70px -10px rgba(139,92,246,0.75), 0 0 0 1px rgba(255,255,255,0.06)',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Gloss shine */}
          <motion.div
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              transform: 'skewX(-18deg)'
            }}
          />
          {/* Infinity text symbol — styled like the real logo */}
          <motion.span
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'relative', zIndex: 2,
              fontSize: 58, lineHeight: 1,
              color: 'white',
              fontWeight: 300,
              letterSpacing: '-2px',
              userSelect: 'none'
            }}
          >
            ∞
          </motion.span>
        </div>
      </motion.div>

      {/* Footer — subtle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{
          position: 'absolute', bottom: 30,
          fontSize: 10, fontWeight: 600,
          color: 'rgba(255,255,255,0.15)',
          letterSpacing: '0.12em', textTransform: 'uppercase'
        }}
      >
        StyleGuru AI
      </motion.p>
    </div>
  );
}
