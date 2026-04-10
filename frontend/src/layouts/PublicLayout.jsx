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

const C = {
  bg:         '#0A0A0A',
  border:     '#242424',
  borderSoft: '#1C1C1C',
  text:       '#F0EDE6',
  muted:      '#6B6B6B',
  gold:       '#C9A96E',
};

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
      borderBottom: scrolled ? `1px solid ${C.borderSoft}` : '1px solid transparent',
      background: scrolled ? 'rgba(10,10,10,0.96)' : 'rgba(10,10,10,0.6)',
      backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16,
      fontFamily: "'Inter','DM Sans',sans-serif",
      transition: 'all 0.3s ease',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#0A0A0A', letterSpacing: '0.05em' }}>SG</span>
        </div>
        <span className="hidden sm:inline" style={{ fontSize: '12px', fontWeight: 500, color: C.text, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          StyleGuru AI
        </span>
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex" style={{ flex: 1, justifyContent: 'center', gap: 28 }}>
        {navLinks.map(l => {
          const active = location.pathname === l.to || (l.to !== '/' && location.pathname.startsWith(l.to));
          return (
            <Link
              key={l.to}
              to={l.to}
              style={{
                fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em',
                textTransform: 'uppercase', textDecoration: 'none',
                color: active ? C.gold : C.muted,
                borderBottom: active ? `1px solid ${C.gold}` : '1px solid transparent',
                paddingBottom: 2,
                transition: 'color 0.2s',
                fontFamily: "'Inter',sans-serif",
              }}
              onMouseEnter={e => { if (!active) e.target.style.color = C.text; }}
              onMouseLeave={e => { if (!active) e.target.style.color = C.muted; }}
            >
              {l.label}
            </Link>
          );
        })}
      </div>

      {/* Right CTA */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
        <Link
          to="/auth"
          style={{
            padding: '8px 16px',
            background: 'none', border: `1px solid ${C.border}`,
            color: C.muted, fontSize: '10px', letterSpacing: '0.12em',
            textTransform: 'uppercase', textDecoration: 'none',
            transition: 'all 0.2s', fontFamily: "'Inter',sans-serif",
            display: 'inline-block',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
        >
          Login
        </Link>
        <Link
          to="/auth"
          style={{
            padding: '8px 16px',
            background: C.gold, color: '#0A0A0A',
            fontSize: '10px', letterSpacing: '0.12em',
            textTransform: 'uppercase', textDecoration: 'none',
            transition: 'opacity 0.2s', fontFamily: "'Inter',sans-serif",
            display: 'inline-block',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}

export default function PublicLayout() {
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter','DM Sans',sans-serif" }}>
      <PublicNav />
      {/* Page content fills flex space, footer always at bottom */}
      <main style={{ flex: 1, paddingTop: 60 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
