/**
 * PublicHeader.jsx — Shared Header for all public pages
 * Features: Home, Blog, About, Contact, Sign In / Get Started, and mobile menu
 */
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME } from '../constants/contact';

const BG_SCROLLED = 'rgba(11, 15, 26, 0.95)';
const BG_INITIAL = 'rgba(11, 15, 26, 0.75)';
const BORDER = 'rgba(255, 255, 255, 0.08)';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const GRAD = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)';

export default function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Home',    to: '/' },
    { label: 'Blog',    to: '/blog' },
    { label: 'About',   to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  return (
    <header
      style={{
        background: scrolled ? BG_SCROLLED : BG_INITIAL,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${BORDER}`,
      }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center p-0.5 bg-gradient-to-tr from-violet-600 to-pink-500 shadow-md group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="StyleGuru AI Logo" className="w-full h-full object-contain rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white tracking-tight font-sans">
              {APP_NAME}
            </span>
            <span className="hidden sm:inline-block text-[9px] font-bold tracking-widest text-violet-300 uppercase px-1.5 py-0.5 rounded bg-violet-900/40 border border-violet-700/30">
              India 🇮🇳
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all no-underline ${
                  isActive
                    ? 'text-white bg-violet-600/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          <Link
            to="/login?mode=login"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors no-underline"
          >
            Sign In
          </Link>
          <Link
            to="/login?mode=register"
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md shadow-purple-500/20 hover:opacity-90 transition-all no-underline"
            style={{ background: GRAD }}
          >
            Get Started Free →
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 focus:outline-none cursor-pointer"
          aria-label="Toggle mobile menu"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 pt-2 pb-6 border-b space-y-3"
          style={{ background: 'rgba(11, 15, 26, 0.98)', borderColor: BORDER }}
        >
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors no-underline ${
                    isActive ? 'text-white bg-violet-600/25 font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t flex flex-col gap-2" style={{ borderColor: BORDER }}>
            <Link
              to="/login?mode=login"
              className="w-full text-center py-2.5 rounded-lg text-xs font-medium text-slate-200 bg-white/5 border border-white/10 no-underline"
            >
              Sign In
            </Link>
            <Link
              to="/login?mode=register"
              className="w-full text-center py-2.5 rounded-lg text-xs font-semibold text-white no-underline shadow-md"
              style={{ background: GRAD }}
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
