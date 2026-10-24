import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { googleLogin, saveAuth } from '../api/styleApi';
import { trackLogin } from '../utils/analytics';

export default function AuthPromptModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Save to Your Profile',
  subtitle = 'Sign in with Google to permanently save this to your profile and sync across all your devices.',
  actionBadge = 'Cloud Feature',
  icon = '🧬',
  isDark = true,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const bg = isDark ? '#111827' : '#FFFFFF';
  const border = isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(226, 232, 240, 0.9)';
  const text = isDark ? '#F9FAFB' : '#0F172A';
  const muted = isDark ? '#9CA3AF' : '#64748B';
  const grad = 'linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #EC4899 100%)';

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await googleLogin();
      saveAuth({ user_name: user.name, email: user.email });
      trackLogin('google_prompt_modal');
      if (onSuccess) {
        await onSuccess(user);
      }
      onClose();
    } catch (err) {
      if (err?.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.');
      } else {
        setError('Sign in failed. You can also sign in with email below.');
      }
    } finally {
      setLoading(false);
    }
  };

  const modalJSX = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        backgroundColor: 'rgba(5, 8, 22, 0.88)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        animation: 'authBackdropFadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 24,
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.55), 0 0 30px rgba(124, 58, 237, 0.2)',
          padding: '28px 24px 22px',
          maxWidth: 420,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          animation: 'authModalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 220,
            height: 100,
            background: 'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            color: muted,
            fontSize: '18px',
            cursor: loading ? 'default' : 'pointer',
            padding: '6px',
            borderRadius: '50%',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Icon / Badge */}
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            background: grad,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            marginBottom: 14,
            boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.4)',
            color: '#FFFFFF'
          }}
        >
          {icon}
        </div>

        {/* Badge */}
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '3px 10px',
            borderRadius: 999,
            background: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.08)',
            color: isDark ? '#C4B5FD' : '#7C3AED',
            marginBottom: 8,
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
        >
          {actionBadge}
        </span>

        {/* Title */}
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
          {title}
        </h3>

        {/* Subtitle */}
        <p
          style={{
            margin: '0 0 20px',
            fontSize: '13px',
            color: muted,
            lineHeight: '1.5',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            maxWidth: 320
          }}
        >
          {subtitle}
        </p>

        {/* Error message */}
        {error && (
          <div
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              marginBottom: 16,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            {error}
          </div>
        )}

        {/* Google 1-Tap Sign-In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            background: isDark ? '#FFFFFF' : '#0F172A',
            color: isDark ? '#0F172A' : '#FFFFFF',
            border: 'none',
            borderRadius: 14,
            fontSize: '14px',
            fontWeight: 700,
            padding: '12px 18px',
            cursor: loading ? 'default' : 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 0.2s ease',
            opacity: loading ? 0.75 : 1,
          }}
        >
          {loading ? (
            <>
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: `2px solid ${isDark ? '#0F172A' : '#FFFFFF'}`,
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite'
                }}
              />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Email sign in fallback */}
        <div style={{ marginTop: 14 }}>
          <a
            href="/login?mode=login"
            style={{
              color: isDark ? '#A78BFA' : '#6D28D9',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            Or sign in with Email & Password →
          </a>
        </div>

        {/* Dismiss / Continue Guest button */}
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            marginTop: 12,
            background: 'transparent',
            border: 'none',
            color: muted,
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            padding: '4px'
          }}
        >
          Maybe later, stay in Guest Mode
        </button>
      </div>

      <style>{`
        @keyframes authBackdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes authModalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return createPortal(modalJSX, document.body);
}
