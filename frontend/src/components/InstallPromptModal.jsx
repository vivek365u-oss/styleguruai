import React, { useState } from 'react';

export default function InstallPromptModal({ onInstall, onDismiss, platform, nativePromptAvailable, C }) {
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const bg = C?.isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.98)';
  const border = C?.isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(226, 232, 240, 0.9)';
  const text = C?.isDark ? '#F9FAFB' : '#0F172A';
  const muted = C?.isDark ? '#9CA3AF' : '#64748B';
  const grad = 'linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #EC4899 100%)';

  const handleInstall = async () => {
    setInstalling(true);
    setInfoMessage('');

    try {
      const result = await onInstall();
      
      if (result === 'accepted') {
        setInstalledSuccess(true);
        setInfoMessage('🎉 Installed successfully! Added to your device.');
        setTimeout(() => {
          onDismiss();
        }, 1200);
        return;
      } else if (result === 'rejected') {
        setInstalling(false);
        return;
      }

      // If browser didn't provide a native prompt (e.g. desktop / browser restrictions):
      if (platform === 'ios') {
        setInstalling(false);
        setInfoMessage('Tap Safari Share (⬆️) → "Add to Home Screen" to install.');
      } else {
        // Automatically download desktop app launcher shortcut so user actually gets the app!
        try {
          const shortcutContent = `[InternetShortcut]\r\nURL=${window.location.origin}/\r\nIconIndex=0\r\nIconFile=${window.location.origin}/favicon.ico\r\n`;
          const blob = new Blob([shortcutContent], { type: 'application/octet-stream' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'StyleGuru AI.url';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);

          setInstalledSuccess(true);
          setInfoMessage('🎉 App launcher downloaded! Open it to add StyleGuru AI to your desktop.');
          setTimeout(() => {
            onDismiss();
          }, 2200);
        } catch (downloadErr) {
          setInstalling(false);
          setInfoMessage('StyleGuru AI is ready! You can pin or bookmark this app.');
        }
      }
    } catch (err) {
      console.warn('Install error:', err);
      setInstalling(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div 
        style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 24,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(124, 58, 237, 0.1)',
          padding: '28px 24px 24px',
          maxWidth: 420,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onDismiss} 
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            color: muted,
            fontSize: '18px',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s'
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Ambient background glow */}
        <div 
          style={{
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 200,
            height: 100,
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} 
        />

        {/* App Logo */}
        <div 
          style={{
            width: 68,
            height: 68,
            borderRadius: 20,
            background: grad,
            padding: 2.5,
            boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.35)',
            marginBottom: 16
          }}
        >
          <div 
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 18,
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            <img 
              src="/logo.png" 
              alt="StyleGuru AI" 
              style={{ width: '85%', height: '85%', objectFit: 'contain' }} 
            />
          </div>
        </div>

        {/* Title & Description */}
        <h3 
          style={{ 
            margin: '0 0 8px', 
            fontSize: '20px', 
            fontWeight: 800, 
            color: text, 
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            letterSpacing: '-0.02em'
          }}
        >
          Install StyleGuru AI
        </h3>
        
        <p 
          style={{ 
            margin: '0 0 18px', 
            fontSize: '13.5px', 
            color: muted, 
            lineHeight: '1.5', 
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            maxWidth: 320
          }}
        >
          Install the official app for instant 1-tap styling, offline access, and full-screen experience.
        </p>

        {/* Feature Pills */}
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 8, 
            justifyContent: 'center', 
            marginBottom: 22 
          }}
        >
          {[
            { label: '⚡ Instant Load' },
            { label: '📱 Full Screen' },
            { label: '🔒 100% Free' }
          ].map((pill, i) => (
            <span 
              key={i}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 999,
                background: C?.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124, 58, 237, 0.08)',
                color: C?.isDark ? '#E2E8F0' : '#6D28D9',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              {pill.label}
            </span>
          ))}
        </div>

        {/* Info Message if needed (e.g. success or 1-line guidance) */}
        {infoMessage && (
          <div 
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              marginBottom: 16,
              background: installedSuccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(124, 58, 237, 0.08)',
              border: `1px solid ${installedSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(124, 58, 237, 0.2)'}`,
              color: installedSuccess ? '#16A34A' : (C?.isDark ? '#C4B5FD' : '#6D28D9'),
              fontSize: '12.5px',
              fontWeight: 600,
              lineHeight: 1.4,
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            {infoMessage}
          </div>
        )}

        {/* Main Install Button */}
        <button
          onClick={handleInstall}
          disabled={installing || installedSuccess}
          style={{
            width: '100%',
            background: installedSuccess ? '#16A34A' : (installing ? 'rgba(124, 58, 237, 0.7)' : grad),
            border: 'none',
            borderRadius: 14,
            color: '#FFFFFF',
            fontSize: '14.5px',
            fontWeight: 700,
            padding: '14px 20px',
            cursor: (installing || installedSuccess) ? 'default' : 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: '0 8px 20px -4px rgba(124, 58, 237, 0.4)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {installing ? (
            <>
              <div 
                style={{ 
                  width: 16, 
                  height: 16, 
                  border: '2px solid rgba(255,255,255,0.3)', 
                  borderTopColor: '#FFFFFF', 
                  borderRadius: '50%', 
                  animation: 'spin 0.7s linear infinite' 
                }} 
              />
              Opening Installer...
            </>
          ) : installedSuccess ? (
            '✅ App Installed'
          ) : (
            '⚡ Install StyleGuru AI'
          )}
        </button>

        {/* Cancel / Not now link */}
        {!installedSuccess && (
          <button
            onClick={onDismiss}
            style={{
              marginTop: 12,
              background: 'transparent',
              border: 'none',
              color: muted,
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              padding: '6px'
            }}
          >
            Maybe later
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
