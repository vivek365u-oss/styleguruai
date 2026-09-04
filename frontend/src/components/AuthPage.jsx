import React, { useState } from 'react';
import { registerUser, loginUser, saveAuth, googleLogin } from '../api/styleApi';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { trackSignUp, trackLogin } from '../utils/analytics';

export default function AuthPage({ onLoginSuccess }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  const GRAD = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)';

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError('');
    if (!form.email || !form.password) {
      return setError('Please enter your email and password.');
    }
    if (mode === 'register' && !form.full_name) {
      return setError('Please enter your full name.');
    }
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await loginUser({ email: form.email, password: form.password })
        : await registerUser({ email: form.email, password: form.password, full_name: form.full_name });
      
      saveAuth(res.data);
      if (mode === 'login') trackLogin('email');
      else trackSignUp('email');
      
      onLoginSuccess({ name: res.data.user_name, email: res.data.email });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err.code === 'auth/user-not-found'      ? (t('noAccount') || 'No account found with this email.') :
        err.code === 'auth/wrong-password'       ? (t('wrongPassword') || 'Incorrect password. Please try again.') :
        err.code === 'auth/email-already-in-use' ? (t('emailInUse') || 'Email is already registered. Please sign in.') :
        err.code === 'auth/weak-password'        ? (t('weakPassword') || 'Password should be at least 6 characters.') :
        err.code === 'auth/invalid-credential'   ? 'Invalid email or password. Please verify your credentials.' :
        err.response?.data?.detail || err.message || (t('somethingWrong') || 'Something went wrong. Please try again.');
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
      trackLogin('google');
      onLoginSuccess({ name: user.name, email: user.email });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err?.code === 'auth/popup-blocked') {
        setError('Popup blocked by browser. Please allow popups for this site and try again.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // user clicked twice
      } else {
        setError(t('googleFailed') || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotMessage('Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    setForgotMessage('');
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setResetSent(true);
      setForgotMessage('Password reset link sent to your inbox! Check your spam folder too.');
    } catch (err) {
      setForgotMessage(err.message || 'Failed to send reset link. Please check email address.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col font-sans text-slate-900 antialiased relative selection:bg-violet-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-violet-300/25 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-pink-200/20 rounded-full blur-[130px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[140px]" />
      </div>

      {/* Top Floating Navigation Header */}
      <header className="relative z-20 px-6 sm:px-12 py-5 max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2.5 text-slate-700 hover:text-violet-600 transition-colors group font-semibold text-xs sm:text-sm no-underline"
        >
          <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 group-hover:border-violet-300 group-hover:bg-violet-50 transition-all">
            ←
          </span>
          <span>Back to Home</span>
        </Link>

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center p-0.5 bg-gradient-to-tr from-violet-600 to-pink-500 shadow-sm shadow-violet-500/20">
            <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="StyleGuru AI" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <span className="font-serif font-black text-base sm:text-lg tracking-tight text-slate-900">
            StyleGuru <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent font-sans text-xs sm:text-sm uppercase tracking-widest font-bold ml-0.5">AI</span>
          </span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 py-6 sm:py-10 max-w-7xl w-full mx-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ══════════════════════════════════════════════════
              LEFT SIDE: Brand Story, Visual Intelligence, Social Proof
              ══════════════════════════════════════════════════ */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-7 pr-4">
            
            {/* Mission Badge */}
            <div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-100/80 text-violet-700 border border-violet-200/70 shadow-sm">
                <span>🇮🇳</span> Made in India • Calibrated for Indian Skin Tones
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl xl:text-5xl font-black font-serif tracking-tight text-slate-900 leading-[1.15]">
                Discover Colors That Make You Look <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 bg-clip-text text-transparent italic">Unforgettable.</span>
              </h1>
              <p className="text-slate-600 text-base leading-relaxed max-w-md">
                No guesswork. No generic Western charts. Upload a selfie and get AI fashion advice tailored specifically to your unique skin undertone.
              </p>
            </div>

            {/* Live Visual Intelligence Preview Cards */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Indian Skin Tone Color Calibration</span>
                <span className="text-violet-600 font-semibold lowercase">98% precision</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { tone: 'Fair Warm', under: 'Golden Peach', colors: ['#E11D48', '#0D9488', '#D97706'], label: 'Jewel & Coral' },
                  { tone: 'Wheatish Neutral', under: 'Olive Honey', colors: ['#4F46E5', '#059669', '#BE185D'], label: 'Royal Navy & Emerald' },
                  { tone: 'Dusky Warm', under: 'Rich Bronze', colors: ['#7C2D12', '#9333EA', '#CA8A04'], label: 'Mustard & Royal Purple' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-2">
                    <div>
                      <p className="font-bold text-xs text-slate-800 leading-tight">{item.tone}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">{item.under}</p>
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      {item.colors.map((c, idx) => (
                        <div key={idx} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Core Trust Guarantees */}
            <div className="grid grid-cols-3 gap-4 pt-1">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">✓</span>
                <span>Zero Photo Storage (100% Private)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs flex-shrink-0">✓</span>
                <span>100% Free Forever</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs flex-shrink-0">✓</span>
                <span>Created by Vivek Kumar</span>
              </div>
            </div>

            {/* Founder Note / Quote */}
            <div className="flex items-center gap-3.5 pt-2 text-xs text-slate-500 border-t border-slate-200/70">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 p-0.5 flex-shrink-0 shadow-sm">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-violet-700 text-xs">
                  V
                </div>
              </div>
              <p className="italic leading-snug text-slate-600">
                “Built to give every Indian citizen access to world-class personal styling without spending thousands on stylists.”
                <span className="block not-italic font-bold text-slate-800 pt-0.5">— Vivek Kumar, Founder & Creator</span>
              </p>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              RIGHT SIDE: Modern Elevated Auth Form
              ══════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-10 border border-slate-200/90 shadow-2xl shadow-slate-300/40 relative overflow-hidden">
              
              {/* Subtle top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: GRAD }} />

              {/* Mode Toggle Tabs */}
              <div className="flex rounded-2xl bg-slate-100/90 p-1 mb-8 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border-none ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'bg-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border-none ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'bg-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Free Account
                </button>
              </div>

              {/* Header Title */}
              <div className="mb-6 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {mode === 'login' ? 'Welcome back! 👋' : 'Join StyleGuru AI ✨'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {mode === 'login'
                    ? 'Sign in to access your saved style analysis and outfits.'
                    : 'Start your personal color and outfit journey in seconds.'}
                </p>
              </div>

              {/* 1-Tap Google Sign-In */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 cursor-pointer mb-6"
              >
                {googleLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Or Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">or with email</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Form Fields */}
              <div className="space-y-4 mb-6">
                {/* Full Name for Register */}
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">👤</span>
                      <input
                        name="full_name"
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={form.full_name}
                        onChange={handle}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">✉️</span>
                    <input
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={handle}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Password Field with Eye Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setShowForgotModal(true); setForgotEmail(form.email); setForgotMessage(''); }}
                        className="text-xs font-semibold text-violet-600 hover:text-violet-700 cursor-pointer bg-transparent border-none p-0"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔒</span>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handle}
                      onKeyDown={(e) => e.key === 'Enter' && submit()}
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer bg-transparent border-none text-sm"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message Box */}
              {error && (
                <div className="p-3.5 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                  <span className="text-sm">⚠️</span>
                  <p className="flex-1 m-0 leading-relaxed">{error}</p>
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="w-full py-4 rounded-2xl text-white font-bold text-sm shadow-lg shadow-violet-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-none flex items-center justify-center gap-2 mb-5"
                style={{ background: GRAD }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : mode === 'login' ? (
                  <span>⚡ Sign In to StyleGuru AI →</span>
                ) : (
                  <span>⚡ Create Free Account →</span>
                )}
              </button>

              {/* Bottom Switch Note */}
              <div className="text-center text-xs text-slate-500">
                {mode === 'login' ? (
                  <p className="m-0">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('register'); setError(''); }}
                      className="font-bold text-violet-600 hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      Sign Up Free
                    </button>
                  </p>
                ) : (
                  <p className="m-0">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); }}
                      className="font-bold text-violet-600 hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      Sign In here
                    </button>
                  </p>
                )}
              </div>

              {/* Privacy Footer */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>🔒 256-Bit Encrypted Auth</span>
                <span>🇮🇳 Made in India</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ══════════════════════════════════════════════════
          FORGOT PASSWORD MODAL
          ══════════════════════════════════════════════════ */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => { setShowForgotModal(false); setForgotMessage(''); setResetSent(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 text-base cursor-pointer bg-transparent border-none"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center text-xl mb-4">
              🔑
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Reset Password</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Enter the email address registered with StyleGuru AI. We'll email you a secure link to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="email"
                placeholder="name@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
              />

              {forgotMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${resetSent ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {forgotMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={forgotLoading || resetSent}
                className="w-full py-3.5 rounded-xl text-white font-bold text-xs shadow-md shadow-violet-500/20 cursor-pointer border-none flex items-center justify-center gap-2"
                style={{ background: GRAD }}
              >
                {forgotLoading ? 'Sending link...' : resetSent ? 'Email Sent! Check Inbox' : 'Send Password Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
