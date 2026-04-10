import { useState } from 'react';
import { registerUser, loginUser, saveAuth, googleLogin } from '../api/styleApi';
import { useLanguage } from '../i18n/LanguageContext';
import { Link } from 'react-router-dom';

/* ══════════════════════════════════════════════
   AuthPage — Premium Editorial Split Screen
   Left: Fashion imagery + brand story
   Right: Clean minimal form
   ══════════════════════════════════════════════ */
function AuthPage({ onLoginSuccess }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError('');
    if (!form.email || !form.password) return setError('Please enter your email and password.');
    if (mode === 'register' && !form.full_name) return setError('Please enter your full name.');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await loginUser({ email: form.email, password: form.password })
        : await registerUser({ email: form.email, password: form.password, full_name: form.full_name });
      saveAuth(res.data);
      onLoginSuccess({ name: res.data.user_name, email: res.data.email });
    } catch (err) {
      const msg =
        err.code === 'auth/user-not-found'      ? t('noAccount') :
        err.code === 'auth/wrong-password'       ? t('wrongPassword') :
        err.code === 'auth/email-already-in-use' ? t('emailInUse') :
        err.code === 'auth/weak-password'        ? t('weakPassword') :
        err.response?.data?.detail || t('somethingWrong');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const user = await googleLogin();
      saveAuth({ user_name: user.name, email: user.email });
      onLoginSuccess({ name: user.name, email: user.email });
    } catch {
      setError(t('googleFailed'));
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ── Minimal line-only input style ── */
  const inputStyle = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #2A2A2A',
    color: '#F0EDE6',
    fontSize: '14px',
    padding: '12px 0',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.2s',
    letterSpacing: '0.02em',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#0A0A0A',
        fontFamily: "'Inter', 'DM Sans', sans-serif",
      }}
    >
      {/* ─────────────────────────────────────
          LEFT — Editorial Image Side (desktop)
          ───────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: '#0F0F0F' }}
      >
        {/* Full-bleed fashion image */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=90&auto=format&fit=crop"
            alt="Fashion"
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(30%) brightness(0.45) contrast(1.1)' }}
          />
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.3) 50%, rgba(10,10,10,0.5) 100%)' }} />
        </div>

        {/* Top: Brand */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: '#C9A96E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#0A0A0A', letterSpacing: '0.05em' }}>SG</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#F0EDE6', letterSpacing: '0.1em', textTransform: 'uppercase' }}>StyleGuru AI</span>
          </Link>
        </div>

        {/* Bottom: Hero text */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: '20px', fontFamily: "'Inter', sans-serif" }}>
            AI Fashion Intelligence
          </p>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '54px', fontWeight: 300,
              color: '#F0EDE6', lineHeight: 1.1,
              marginBottom: '20px', letterSpacing: '-0.01em'
            }}
          >
            Elevate Your<br />
            <em style={{ fontStyle: 'italic', color: '#C9A96E' }}>Personal Style</em>
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(240,237,230,0.5)', lineHeight: '1.8', maxWidth: 360, marginBottom: '32px' }}>
            Join thousands discovering their perfect colors and outfits through AI-powered skin tone analysis.
          </p>

          <div style={{ display: 'flex', gap: 24 }}>
            {['Instant Analysis', '98% Accuracy', 'Made for India'].map(item => (
              <span key={item} style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(240,237,230,0.3)' }}>{item}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────
          RIGHT — Auth Form Side
          ───────────────────────────────────── */}
      <div
        className="w-full lg:w-[42%] flex flex-col items-center justify-center px-8 sm:px-16"
        style={{ background: '#0A0A0A' }}
      >
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-12">
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 36, height: 36, background: '#C9A96E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0A0A0A' }}>SG</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#F0EDE6', letterSpacing: '0.1em', textTransform: 'uppercase' }}>StyleGuru AI</span>
            </Link>
          </div>

          {/* Header */}
          <div style={{ marginBottom: '36px' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A96E', marginBottom: '10px', fontFamily: "'Inter', sans-serif" }}>
              {mode === 'login' ? 'Welcome Back' : 'New Member'}
            </p>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '32px', fontWeight: 300,
                color: '#F0EDE6', marginBottom: '6px', letterSpacing: '-0.01em'
              }}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <p style={{ fontSize: '13px', color: '#6B6B6B' }}>
              {mode === 'login' ? 'Your style journey continues.' : 'Start your style journey today.'}
            </p>
          </div>

          {/* Google Auth */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{
              width: '100%', padding: '13px',
              background: '#FFFFFF', color: '#0A0A0A',
              border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              marginBottom: '28px',
              opacity: googleLoading ? 0.6 : 1,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '28px' }}>
            <div style={{ flex: 1, height: 1, background: '#1C1C1C' }} />
            <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#3A3A3A', textTransform: 'uppercase' }}>or email</span>
            <div style={{ flex: 1, height: 1, background: '#1C1C1C' }} />
          </div>

          {/* Fields */}
          <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {mode === 'register' && (
              <div>
                <label style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#6B6B6B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  name="full_name"
                  placeholder="Enter your name"
                  value={form.full_name}
                  onChange={handle}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderBottomColor = '#C9A96E'}
                  onBlur={e => e.target.style.borderBottomColor = '#2A2A2A'}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#6B6B6B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handle}
                style={inputStyle}
                onFocus={e => e.target.style.borderBottomColor = '#C9A96E'}
                onBlur={e => e.target.style.borderBottomColor = '#2A2A2A'}
              />
            </div>

            <div>
              <label style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#6B6B6B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handle}
                onKeyDown={e => e.key === 'Enter' && submit()}
                style={{ ...inputStyle, letterSpacing: '0.1em' }}
                onFocus={e => e.target.style.borderBottomColor = '#C9A96E'}
                onBlur={e => e.target.style.borderBottomColor = '#2A2A2A'}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '12px 16px', border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)' }}>
                <p style={{ fontSize: '12px', color: '#EF4444' }}>{error}</p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: '100%', padding: '15px',
              background: loading ? '#1C1C1C' : '#C9A96E',
              color: '#0A0A0A', border: 'none',
              fontSize: '11px', fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              fontFamily: "'Inter', sans-serif",
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Switch mode */}
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#6B6B6B' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#C9A96E', cursor: 'pointer', fontSize: '12px', padding: 0, fontFamily: "'Inter', sans-serif" }}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>

          {/* Footer note */}
          <p style={{ textAlign: 'center', fontSize: '10px', color: '#2A2A2A', letterSpacing: '0.08em', marginTop: '32px', textTransform: 'uppercase' }}>
            © 2026 StyleGuru AI · Made in India
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;