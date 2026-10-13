import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col items-center justify-center p-6 text-center">
      <SEOHead title="Page Not Found (404) — StyleGuru AI" description="The requested page could not be found on StyleGuru AI." />
      
      <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl bg-violet-900/30 border border-violet-500/30">
        🔍
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2">Error 404</span>
      <h1 className="text-4xl sm:text-5xl font-black font-serif mb-3 tracking-tight">Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
        The styling guide or page you are looking for may have moved or no longer exists. Explore our homepage or read our fashion articles.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="px-6 py-3 rounded-xl text-white font-semibold text-xs transition-all shadow-lg shadow-violet-500/25 no-underline hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)' }}
        >
          &larr; Return to Homepage
        </Link>
        <Link
          to="/blog"
          className="px-6 py-3 rounded-xl text-slate-200 bg-white/5 border border-white/10 font-semibold text-xs transition-all no-underline hover:text-white hover:bg-white/10"
        >
          Browse Fashion Blog &rarr;
        </Link>
      </div>
    </div>
  );
}
