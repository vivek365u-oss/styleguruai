/**
 * PublicLayout.jsx — Shared layout for all public static pages
 *
 * Structure:
 *   ┌──────────────────────────────┐
 *   │ Premium Navbar               │ (same black/gold style)
 *   ├──────────────────────────────┤
 *   │ <Outlet /> (page content)    │
 *   ├──────────────────────────────┤
 *   │ Premium Footer               │
 *   └──────────────────────────────┘
 *
 * Used for: /blog, /about, /contact, /privacy, /terms
 * Pages render ONLY their own content — no header/footer duplication.
 */

import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';

const BG = '#0B0F1A';
const GLASS = 'rgba(255,255,255,0.05)';
const GLASS2 = 'rgba(255,255,255,0.08)';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const GRAD = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)';

function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { label: 'Home',    to: '/' },
    { label: 'Blog',    to: '/blog' },
    { label: 'About',   to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 60,
      background: scrolled ? 'rgba(11,15,26,0.92)' : 'rgba(11,15,26,0.55)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderBottom: scrolled ? `1px solid ${BORDER}` : '1px solid transparent',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16,
      fontFamily: "'Plus Jakarta Sans','Inter','DM Sans',sans-serif",
      transition: 'all 0.3s ease',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(139,92,246,0.4)' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'white' }}>SG</span>
        </div>
        <span className="hidden sm:inline" style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          <span style={{ color: TEXT }}>StyleGuru </span>
          <span style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
        </span>
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex" style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
        {navLinks.map(l => {
          const active = location.pathname === l.to || (l.to !== '/' && location.pathname.startsWith(l.to));
          return (
            <Link
              key={l.to}
              to={l.to}
              style={{
                padding: '6px 16px', borderRadius: 8,
                fontSize: '13px', fontWeight: active ? 600 : 400,
                color: active ? TEXT : MUTED, textDecoration: 'none',
                background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                display: 'inline-block', transition: 'all 0.2s',
                fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color=TEXT; e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color=MUTED; e.currentTarget.style.background='transparent'; }}}
            >
              {l.label}
            </Link>
          );
        })}
      </div>

      {/* Right CTA */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link
          to="/auth"
          style={{
            padding: '8px 16px', borderRadius: 8,
            background: GLASS2, border: `1px solid ${BORDER}`,
            color: MUTED, fontSize: '12px', fontWeight: 500,
            textDecoration: 'none', transition: 'all 0.2s',
            fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
            display: 'inline-block',
          }}
          onMouseEnter={e => { e.currentTarget.style.color=TEXT; e.currentTarget.style.borderColor='rgba(139,92,246,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.color=MUTED; e.currentTarget.style.borderColor=BORDER; }}
        >
          Login
        </Link>
        <Link
          to="/auth"
          style={{
            padding: '8px 18px', borderRadius: 8,
            background: GRAD, color: 'white',
            fontSize: '12px', fontWeight: 600,
            textDecoration: 'none', transition: 'opacity 0.2s, transform 0.15s',
            fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
            boxShadow: '0 4px 16px rgba(139,92,246,0.35)',
            display: 'inline-block',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity='0.88'; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)'; }}
        >
          Get Started →
        </Link>
      </div>
    </nav>
  );
}

export default function PublicLayout() {
  return (
    <div style={{ background: BG, color: TEXT, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Plus Jakarta Sans','Inter','DM Sans',sans-serif" }}>
      <PublicNav />
      <main style={{ flex: 1, paddingTop: 60 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
