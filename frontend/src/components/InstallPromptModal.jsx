import React, { useState } from 'react';

export default function InstallPromptModal({ onInstall, onDismiss, platform, nativePromptAvailable, C }) {
  const [installing, setInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const bg = C?.navBg || 'rgba(11, 15, 26, 0.92)';
  const border = C?.border || 'rgba(139,92,246,0.3)';
  const text = C?.text || '#F9FAFB';
  const muted = C?.muted || '#9CA3AF';
  const grad = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)';

  const handleInstall = async () => {
    if (nativePromptAvailable) {
      // Android / Chrome — native prompt triggers, app installs directly
      setInstalling(true);
      const result = await onInstall();
      setInstalling(false);
      if (result === 'accepted') {
        onDismiss();
      }
    } else {
      // iOS Safari — show step-by-step guide
      setShowIOSGuide(true);
    }
  };

  // ── iOS Step-by-step guide ──
  if (showIOSGuide) {
    return (
      <div style={{
        position: 'fixed', bottom: 24, left: 16, right: 16, zIndex: 9999,
        display: 'flex', justifyContent: 'center',
        animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          background: bg, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid ${border}`, borderRadius: 20,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          padding: '20px', maxWidth: 420, width: '100%',
        }}>
          <button onClick={onDismiss} style={{
            position: 'absolute', top: 14, right: 14, background: 'transparent',
            border: 'none', color: muted, fontSize: '16px', cursor: 'pointer',
          }}>✕</button>

          <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B5CF6', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
            Install on iPhone
          </p>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: text, margin: '0 0 16px', fontFamily: 'Inter, sans-serif' }}>
            3 simple steps to install
          </h3>

          {[
            { step: '1', icon: '⬆️', text: 'Tap the Share button at the bottom of Safari (the box with an arrow)' },
            { step: '2', icon: '📋', text: 'Scroll down and tap "Add to Home Screen"' },
            { step: '3', icon: '✅', text: 'Tap "Add" — StyleGuru AI will appear on your home screen!' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: grad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', flexShrink: 0, boxShadow: '0 4px 12px rgba(139,92,246,0.3)'
              }}>
                {s.icon}
              </div>
              <p style={{ fontSize: '13px', color: muted, lineHeight: '1.55', margin: '4px 0 0', fontFamily: 'Inter, sans-serif' }}>
                {s.text}
              </p>
            </div>
          ))}

          <button onClick={onDismiss} style={{
            width: '100%', marginTop: 4, padding: '13px',
            background: grad, border: 'none', borderRadius: 12,
            color: 'white', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 14px rgba(139,92,246,0.4)',
          }}>
            Got it! 👍
          </button>
        </div>
      </div>
    );
  }

  // ── Android / Chrome — direct one-click install ──
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 16, right: 16, zIndex: 9999,
      display: 'flex', justifyContent: 'center',
      animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{
        background: bg, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${border}`, borderRadius: 20,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        padding: '20px', maxWidth: 420, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden'
      }}>
        <button onClick={onDismiss} style={{
          position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none',
          color: muted, fontSize: '16px', cursor: 'pointer', zIndex: 10, padding: '4px',
        }} aria-label="Close">✕</button>

        {/* Soft glow */}
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 100, height: 100,
          background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingRight: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: grad,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(139,92,246,0.3)'
          }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: text, fontFamily: "'Inter', sans-serif" }}>
              Install StyleGuruAI
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: muted, lineHeight: '1.4', fontFamily: "'Inter', sans-serif" }}>
              {platform === 'ios'
                ? 'Add to your Home Screen for fast access'
                : 'One tap install — works offline too!'}
            </p>
          </div>
        </div>

        <button
          onClick={handleInstall}
          disabled={installing}
          style={{
            width: '100%', background: installing ? 'rgba(139,92,246,0.5)' : grad,
            border: 'none', borderRadius: 12, color: 'white',
            fontSize: '14px', fontWeight: 700,
            padding: '14px', cursor: installing ? 'not-allowed' : 'pointer',
            fontFamily: "'Inter', sans-serif",
            boxShadow: '0 4px 12px rgba(139,92,246,0.4)',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {installing ? (
            <>
              <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Installing...
            </>
          ) : platform === 'ios' ? (
            '📲 How to Install'
          ) : (
            '⚡ Install Now'
          )}
        </button>
      </div>
    </div>
  );
}
