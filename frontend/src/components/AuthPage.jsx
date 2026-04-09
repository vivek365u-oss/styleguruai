import { useState } from 'react';
import { registerUser, loginUser, saveAuth, googleLogin } from '../api/styleApi';
import { useLanguage } from '../i18n/LanguageContext';
import { Link } from 'react-router-dom';

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
    if (!form.email || !form.password) return setError('Please enter both email and password.');
    if (mode === 'register' && !form.full_name) return setError('Please enter your full name.');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await loginUser({ email: form.email, password: form.password })
        : await registerUser({ email: form.email, password: form.password, full_name: form.full_name });
      saveAuth(res.data);
      onLoginSuccess({ name: res.data.user_name, email: res.data.email });
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' ? t('noAccount')
        : err.code === 'auth/wrong-password' ? t('wrongPassword')
        : err.code === 'auth/email-already-in-use' ? t('emailInUse')
        : err.code === 'auth/weak-password' ? t('weakPassword')
        : err.response?.data?.detail || t('somethingWrong');
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

  const fashionImages = [
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=2187&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2040&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop"
  ];

  return (
    <div className="min-h-screen bg-[#050816] flex flex-col lg:flex-row overflow-hidden relative" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-pink-600/10 blur-[120px] pointer-events-none" />

      {/* LEFT: Premium Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between overflow-hidden">
        {/* Image Grid Overlay */}
        <div className="absolute inset-0 grid grid-cols-2 gap-4 p-8 opacity-40 rotate-12 scale-125 pointer-events-none">
          {fashionImages.map((img, i) => (
            <div key={i} className="rounded-3xl overflow-hidden h-[300px] shadow-2xl skew-y-3">
              <img src={img} alt="Fashion" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">SG</div>
            <span className="text-2xl font-black tracking-tighter text-white">StyleGuru AI</span>
          </Link>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-md">
          <div className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-black tracking-[0.3em] uppercase py-1.5 px-4 rounded-full inline-block mb-6">
            Elite Style Intelligence
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white leading-[0.9] mb-8">
            READY TO <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">ELEVATE</span> <br />
            YOUR STYLE?
          </h1>
          <p className="text-white/50 text-lg leading-relaxed font-medium">
            Join thousands of users discovering their perfect colors and outfits through AI-powered visual engineering.
          </p>
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 flex gap-6 text-[10px] font-black tracking-widest text-white/30 uppercase">
          <span>INSTANT ANALYSIS</span>
          <span>●</span>
          <span>98% ACCURACY</span>
          <span>●</span>
          <span>MADE FOR INDIA</span>
        </div>
      </div>

      {/* RIGHT: Auth Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-20">
        <div className="w-full max-w-sm">
          
          {/* Mobile Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-purple-500/20 mb-4">SG</div>
            <h1 className="text-3xl font-black tracking-tighter text-white">StyleGuru AI</h1>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-3xl overflow-hidden relative">
            {/* Header */}
            <div className="mb-10 text-center">
               <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">
                {mode === 'login' ? 'Welcome Back' : 'Create Profile'}
               </h2>
               <p className="text-white/40 text-xs font-medium italic">
                {mode === 'login' ? 'Your style journey continues here.' : 'Start your journey to perfect style.'}
               </p>
            </div>

            {/* Google Social Auth */}
            <button
               onClick={handleGoogle}
               disabled={googleLoading}
               className="w-full py-4 bg-white text-gray-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-4 mb-8 disabled:opacity-50"
            >
               <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
               </svg>
               {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-8 text-[10px] font-black tracking-widest text-white/20 uppercase">
              <div className="flex-1 h-px bg-white/5"></div>
              <span>Secure Email Access</span>
              <div className="flex-1 h-px bg-white/5"></div>
            </div>

            {/* Fields */}
            <div className="space-y-5 mb-8">
               {mode === 'register' && (
                <div className="space-y-2">
                   <label className="text-white/30 text-[10px] uppercase font-black tracking-widest pl-1">Identification</label>
                   <input
                    name="full_name"
                    placeholder="ENTER FULL NAME"
                    value={form.full_name}
                    onChange={handle}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition text-sm font-bold uppercase tracking-wide"
                  />
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-white/30 text-[10px] uppercase font-black tracking-widest pl-1">Email Coordinates</label>
                 <input
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handle}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition text-sm font-bold tracking-wide"
                />
              </div>

              <div className="space-y-2">
                 <label className="text-white/30 text-[10px] uppercase font-black tracking-widest pl-1">Security Key</label>
                 <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handle}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition text-sm tracking-widest"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-xs font-bold animate-shake">
                  {error}
                </div>
              )}
            </div>

            {/* Core Action */}
            <button
               onClick={submit}
               disabled={loading}
               className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
               {loading ? 'Processing...' : mode === 'login' ? 'GET STARTED' : 'CREATE ACCOUNT'}
            </button>

            {/* Switch Mode */}
            <div className="mt-8 text-center text-[11px] font-bold tracking-widest uppercase">
               <span className="text-white/30">
                {mode === 'login' ? "New Perspective?" : "Known Entity?"}
               </span>
               <button 
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="ml-2 text-purple-400 hover:text-purple-300 transition"
               >
                {mode === 'login' ? 'Join the Elite' : 'Access Profile'}
               </button>
            </div>
          </div>
          
          <p className="text-center text-white/20 text-[9px] mt-8 font-black tracking-widest uppercase">
            Designed for 2026 Style Intelligence · All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;