import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * SplashScreen.jsx — StyleGuruAI Premium Entrance v4
 * Single screen: App logo + brand name + trust tagline
 */
export default function SplashScreen({ onComplete }) {
  useEffect(() => {
    const t = setTimeout(() => onComplete(), 2800);
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
        animate={{ opacity: [0.18, 0.30, 0.18], scale: [1, 1.15, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: '70vw', height: '70vw',
          background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(80px)', zIndex: 0
        }}
      />
      {/* Pink ambient glow */}
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

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
        style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 32px' }}
      >
        {/* App Logo */}
        <div style={{
          width: 120, height: 120,
          background: GRAD,
          borderRadius: 34,
          margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 28px 60px -10px rgba(139,92,246,0.75), 0 0 0 1px rgba(255,255,255,0.07)',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Gloss shine */}
          <motion.div
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.8 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
              transform: 'skewX(-18deg)'
            }}
          />
          <motion.span
            animate={{ scale: [1, 1.07, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'relative', zIndex: 2,
              fontSize: 54, color: 'white',
              fontWeight: 300, letterSpacing: '-2px',
              userSelect: 'none', lineHeight: 1
            }}
          >∞</motion.span>
        </div>

        {/* Brand Name */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          style={{
            fontSize: 26, fontWeight: 900,
            margin: '0 0 6px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            background: 'linear-gradient(90deg, #ffffff 10%, #C084FC 55%, #EC4899 100%)',
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
          transition={{ delay: 0.5, duration: 0.55 }}
          style={{
            height: 2, width: 80,
            background: 'linear-gradient(90deg, transparent, #8B5CF6, #EC4899, transparent)',
            margin: '10px auto 16px', borderRadius: 99
          }}
        />

        {/* Trust Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          style={{
            fontSize: 13, fontWeight: 600,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.04em',
            margin: '0 0 20px',
            lineHeight: 1.5
          }}
        >
          Your Personal AI Fashion Advisor
        </motion.p>

        {/* Trust badges row */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.45 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}
        >
          {[
            { icon: '🔒', text: '100% Private' },
            { icon: '⚡', text: 'AI Powered' },
            { icon: '🎨', text: 'Skin-Matched' },
          ].map((badge) => (
            <div key={badge.text} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 99,
              fontSize: 11, fontWeight: 600,
              color: 'rgba(255,255,255,0.50)',
              letterSpacing: '0.03em'
            }}>
              <span style={{ fontSize: 12 }}>{badge.icon}</span>
              <span>{badge.text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Loading bar at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        style={{ position: 'absolute', bottom: 70, width: 180, zIndex: 10 }}
      >
        <div style={{
          height: 2.5, width: '100%',
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 99, overflow: 'hidden'
        }}>
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 1.8, ease: [0.65, 0, 0.35, 1], delay: 1.0 }}
            style={{
              height: '100%', width: '100%',
              background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899)',
              borderRadius: 99,
              boxShadow: '0 0 10px rgba(139,92,246,0.8)'
            }}
          />
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{
          position: 'absolute', bottom: 26,
          fontSize: 10, fontWeight: 500,
          color: 'rgba(255,255,255,0.14)',
          letterSpacing: '0.12em', textTransform: 'uppercase'
        }}
      >
        Trusted by fashion lovers across India
      </motion.p>
    </div>
  );
}
