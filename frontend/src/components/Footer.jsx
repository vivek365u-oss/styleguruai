/**
 * Footer.jsx — StyleGuru AI Premium Footer
 * Used by LandingPage, PublicLayout (About, Blog, Contact, Privacy, Terms)
 */
import { Link } from 'react-router-dom';

const C = {
  bg:     '#0A0A0A',
  border: '#1C1C1C',
  text:   '#F0EDE6',
  muted:  '#6B6B6B',
  subtle: '#2A2A2A',
  gold:   '#C9A96E',
};

export default function Footer() {
  const product = [
    { label: 'Analyze',  href: '/' },
    { label: 'History',  href: '/' },
    { label: 'Wardrobe', href: '/' },
    { label: 'Tools',    href: '/' },
    { label: 'Blog',     href: '/blog' },
  ];

  const company = [
    { label: 'About',   href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms',   href: '/terms' },
  ];

  return (
    <footer style={{ background: C.bg, borderTop: `1px solid ${C.border}`, padding: '56px 0 32px', fontFamily: "'Inter','DM Sans',sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Top grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 48 }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 2' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, background: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#0A0A0A', letterSpacing: '0.05em' }}>SG</span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: C.text, letterSpacing: '0.06em', textTransform: 'uppercase' }}>StyleGuru AI</span>
            </Link>
            <p style={{ fontSize: '13px', color: C.muted, lineHeight: '1.7', maxWidth: 280 }}>
              AI-powered fashion intelligence for every skin tone. Made in India 🇮🇳
            </p>
          </div>

          {/* Product */}
          <div>
            <p style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.subtle, marginBottom: 16, fontWeight: 600 }}>
              Product
            </p>
            {product.map(link => (
              <div key={link.label} style={{ marginBottom: 10 }}>
                <Link
                  to={link.href}
                  style={{ color: C.muted, fontSize: '13px', textDecoration: 'none', transition: 'color 0.15s', display: 'inline-block' }}
                  onMouseEnter={e => e.target.style.color = C.text}
                  onMouseLeave={e => e.target.style.color = C.muted}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>

          {/* Company */}
          <div>
            <p style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.subtle, marginBottom: 16, fontWeight: 600 }}>
              Company
            </p>
            {company.map(link => (
              <div key={link.label} style={{ marginBottom: 10 }}>
                <Link
                  to={link.href}
                  style={{ color: C.muted, fontSize: '13px', textDecoration: 'none', transition: 'color 0.15s', display: 'inline-block' }}
                  onMouseEnter={e => e.target.style.color = C.text}
                  onMouseLeave={e => e.target.style.color = C.muted}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: C.border, marginBottom: 24 }} />

        {/* Bottom bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontSize: '11px', color: '#2A2A2A', letterSpacing: '0.05em' }}>
            © 2026 StyleGuru AI. All rights reserved.
          </p>
          <p style={{ fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2A2A2A' }}>
            Designed for Indian skin tones · Built in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
