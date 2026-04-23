import React from 'react';

export default function InstallPromptModal({ onInstall, onDismiss, platform, nativePromptAvailable, C }) {
  // Use theme colors if available, otherwise fallback to premium defaults
  const bg = C?.navBg || 'rgba(11, 15, 26, 0.85)';
  const border = C?.border || 'rgba(139,92,246,0.3)';
  const text = C?.text || '#F9FAFB';
  const muted = C?.muted || '#9CA3AF';
  const grad = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)';

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 16, right: 16, zIndex: 9999,
      display: 'flex', justifyContent: 'center', animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{
        background: bg, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${border}`, borderRadius: 20,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        padding: '20px', maxWidth: 420, width: '100%',
        display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden'
      }}>
        {/* Soft glow */}
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 100, height: 100,
          background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
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
              {nativePromptAvailable 
                ? "Get the full premium experience. Add to your home screen for fast access and offline wardrobe."
                : "Install as an app for the best experience. Click below to see how to add it to your home screen."}
            </p>
          </div>
        </div>

        {!nativePromptAvailable && (
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px',
            fontSize: '11px', color: muted, border: `1px dashed ${border}`
          }}>
            {platform === 'ios' ? (
              <p style={{ margin: 0 }}>
                <strong>For iPhone/iPad:</strong> Tap the <strong>Share</strong> button <span style={{ fontSize: '14px' }}>⎋</span> at the bottom of the screen, then select <strong>"Add to Home Screen"</strong>.
              </p>
            ) : (
              <p style={{ margin: 0 }}>
                <strong>For Android:</strong> Tap the <strong>three dots</strong> <span style={{ fontSize: '14px' }}>⋮</span> in the top-right corner, then select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onDismiss} style={{
            flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`,
            borderRadius: 12, color: muted, fontSize: '13px', fontWeight: 600,
            padding: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s'
          }}>
            Maybe later
          </button>
          
          {nativePromptAvailable && (
            <button onClick={onInstall} style={{
              flex: 1, background: grad,
              border: 'none', borderRadius: 12, color: 'white', fontSize: '13px', fontWeight: 600,
              padding: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              boxShadow: '0 4px 12px rgba(139,92,246,0.4)', transition: 'all 0.2s'
            }}>
              Install Now
            </button>
          )}

          {!nativePromptAvailable && (
            <button onClick={onDismiss} style={{
              flex: 1, background: grad,
              border: 'none', borderRadius: 12, color: 'white', fontSize: '13px', fontWeight: 600,
              padding: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              boxShadow: '0 4px 12px rgba(139,92,246,0.4)', transition: 'all 0.2s'
            }}>
              Got it!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
