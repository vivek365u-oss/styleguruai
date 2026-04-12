import React from 'react';

export default function InstallPromptModal({ onInstall, onDismiss }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 16, right: 16, zIndex: 9999,
      display: 'flex', justifyContent: 'center', animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{
        background: 'rgba(11, 15, 26, 0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        padding: '20px', maxWidth: 420, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden'
      }}>
        {/* Soft glow in the corner of the modal */}
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 100, height: 100,
          background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* App Icon Representation */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(139,92,246,0.3)'
          }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#F9FAFB', fontFamily: "'Inter', sans-serif" }}>
              Install StyleGuruAI
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF', lineHeight: '1.4', fontFamily: "'Inter', sans-serif" }}>
              Get the full premium experience. Add to to your home screen for fast access and offline wardrobe.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onDismiss} style={{
            flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, color: '#D1D5DB', fontSize: '13px', fontWeight: 600,
            padding: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}>
            Not Now
          </button>
          
          <button onClick={onInstall} style={{
            flex: 1, background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
            border: 'none', borderRadius: 12, color: 'white', fontSize: '13px', fontWeight: 600,
            padding: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            boxShadow: '0 4px 12px rgba(139,92,246,0.4)', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(139,92,246,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.4)' }}>
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}
