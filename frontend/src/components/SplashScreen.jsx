import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * SplashScreen.jsx — StyleGuruAI Premium Entrance
 * ═══════════════════════════════════════════════════
 * Resolves the [UNRESOLVED_IMPORT] error in App.jsx.
 * Features a high-end infinity-pulse animation and radial glows.
 */
export default function SplashScreen({ onComplete }) {
  useEffect(() => {
    // Premium reveal duration: 2.8s provides a professional feel
    const timer = setTimeout(() => {
      onComplete();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#050816',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Dynamic Background Glows */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.2, scale: 1.2 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
        style={{
          position: 'absolute',
          width: '80vw',
          height: '80vw',
          background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          zIndex: 0
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: 0.1, scale: 0.8 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', delay: 1 }}
        style={{
          position: 'absolute',
          width: '60vw',
          height: '60vw',
          background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          right: '-10%',
          bottom: '-10%',
          zIndex: 0
        }}
      />

      {/* Center Branding Content */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
        {/* Animated Logo Box */}
        <motion.div
          initial={{ y: 30, opacity: 0, rotate: -5 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ 
            duration: 1, 
            ease: [0.23, 1, 0.32, 1], // Custom cubic-bezier for premium feel
            delay: 0.2 
          }}
          style={{
            width: 140,
            height: 140,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)',
            borderRadius: 40,
            margin: '0 auto 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 56,
            fontWeight: 900,
            color: '#fff',
            boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Inner Gloss Shine */}
          <motion.div 
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              transform: 'skewX(-20deg)'
            }}
          />
          
          <motion.span
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.9, 1, 0.9]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: 'relative', zIndex: 2 }}
          >
            SG
          </motion.span>
        </motion.div>

        {/* Text Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <h1 style={{
            fontSize: 40,
            fontWeight: 950,
            color: '#fff',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            background: 'linear-gradient(to bottom, #fff, #9CA3AF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
          }}>
            StyleGuru AI
          </h1>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 100 }}
            transition={{ duration: 0.8, delay: 1 }}
            style={{
              height: 2,
              background: 'linear-gradient(90deg, transparent, #8B5CF6, transparent)',
              margin: '16px auto'
            }}
          />

          <p style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            margin: 0
          }}>
            Hyper-Personalized Grooming
          </p>
        </motion.div>
      </div>

      {/* Progress Track */}
      <div style={{
        position: 'absolute',
        bottom: 80,
        width: 240,
        height: 3,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 99,
        overflow: 'hidden'
      }}>
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
          transition={{ duration: 2.5, ease: [0.65, 0, 0.35, 1] }}
          style={{
            height: '100%',
            width: '100%',
            background: 'linear-gradient(90deg, #6366F1, #EC4899)',
            borderRadius: 99,
            boxShadow: '0 0 15px #8B5CF6'
          }}
        />
      </div>

      {/* Footer Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        style={{
          position: 'absolute',
          bottom: 30,
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.1em'
        }}
      >
        POWERED BY STYLEGURU ENGINE v1.2
      </motion.p>
    </div>
  );
}
