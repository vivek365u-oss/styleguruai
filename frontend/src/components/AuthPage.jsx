import { useState } from 'react';
import { registerUser, loginUser, saveAuth } from '../api/styleApi';

function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError('');
    if (!form.email || !form.password) return setError('Email aur password dono bharо.');
    if (mode === 'register' && !form.full_name) return setError('Apna naam bhi dalo.');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await loginUser({ email: form.email, password: form.password })
        : await registerUser({ email: form.email, password: form.password, full_name: form.full_name });
      saveAuth(res.data);
      onLoginSuccess({ name: res.data.user_name, email: res.data.email });
    } catch (err) {
      setError(err.response?.data?.detail || 'Kuch galat hua. Dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        
        {/* Logo */}
        <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-3xl mb-4 shadow-2xl shadow-purple-500/30">
        <span className="text-white font-black text-2xl tracking-tight">SG</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">StyleGuru</h1>
        <p className="text-purple-300 mt-1 text-sm">AI-Powered Fashion for Indian Skin Tones</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          
          {/* Tabs */}
          <div className="flex bg-white/10 rounded-2xl p-1 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  mode === m
                    ? 'bg-white text-purple-900 shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {m === 'login' ? '🔑 Login' : '✨ Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-white/70 text-xs font-medium mb-1.5 block">Full Name</label>
                <input
                  name="full_name"
                  placeholder="Apna naam likho"
                  value={form.full_name}
                  onChange={handle}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition"
                />
              </div>
            )}

            <div>
              <label className="text-white/70 text-xs font-medium mb-1.5 block">Email</label>
              <input
                name="email"
                type="email"
                placeholder="tumhari@email.com"
                value={form.email}
                onChange={handle}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition"
              />
            </div>

            <div>
              <label className="text-white/70 text-xs font-medium mb-1.5 block">Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handle}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-300 text-sm">⚠️ {error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Processing...
                </span>
              ) : mode === 'login' ? '🚀 Login Karo' : '✨ Account Banao'}
            </button>
          </div>

          {/* Demo credentials */}
          {mode === 'login' && (
            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/40 text-xs text-center">Demo: demo@styleguru.com / secret</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          Made with 💜 for India • Your photos are never stored
        </p>
      </div>
    </div>
  );
}

export default AuthPage;