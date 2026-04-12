/**
 * Footer.jsx — StyleGuruAI Premium Footer v2
 * Glassmorphism design system
 */
import { Link } from 'react-router-dom';

const BG = '#080C17';
const BORDER = 'rgba(255,255,255,0.06)';
const TEXT = '#F9FAFB';
const MUTED = '#6B7280';
const SUBTLE = '#374151';
const GRAD = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)';

export default function Footer() {
  const product = [
    { label: 'Analyze',   href: '/' },
    { label: 'History',   href: '/' },
    { label: 'Wardrobe',  href: '/' },
    { label: 'Tools',     href: '/' },
    { label: 'Blog',      href: '/blog' },
  ];

  const company = [
    { label: 'About',    href: '/about' },
    { label: 'Contact',  href: '/contact' },
    { label: 'Privacy',  href: '/privacy' },
    { label: 'Terms',    href: '/terms' },
  ];

  return (
    <footer style={{
      background: BG,
      borderTop: `1px solid ${BORDER}`,
      padding: '56px 0 32px',
      fontFamily: "'Plus Jakarta Sans','Inter','DM Sans',sans-serif",
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Top grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 40, marginBottom: 48 }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 2' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>
                <span style={{ color: TEXT }}>StyleGuruAI </span>
              </span>
            </Link>
            <p style={{ fontSize: '13px', color: MUTED, lineHeight: '1.7', maxWidth: 260, fontWeight: 400 }}>
              AI-powered fashion intelligence for every skin tone. Made in India 🇮🇳
            </p>
            {/* Gradient divider */}
            <div style={{ marginTop: 20, height: 2, width: 48, background: GRAD, borderRadius: 1 }} />
          </div>

          {/* Product */}
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: SUBTLE, marginBottom: 16, fontWeight: 700 }}>
              Product
            </p>
            {product.map(link => (
              <div key={link.label} style={{ marginBottom: 10 }}>
                <Link
                  to={link.href}
                  style={{ color: MUTED, fontSize: '13px', textDecoration: 'none', transition: 'color 0.15s', display: 'inline-block' }}
                  onMouseEnter={e => e.target.style.color = TEXT}
                  onMouseLeave={e => e.target.style.color = MUTED}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>

          {/* Company */}
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: SUBTLE, marginBottom: 16, fontWeight: 700 }}>
              Company
            </p>
            {company.map(link => (
              <div key={link.label} style={{ marginBottom: 10 }}>
                <Link
                  to={link.href}
                  style={{ color: MUTED, fontSize: '13px', textDecoration: 'none', transition: 'color 0.15s', display: 'inline-block' }}
                  onMouseEnter={e => e.target.style.color = TEXT}
                  onMouseLeave={e => e.target.style.color = MUTED}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />

        {/* Bottom bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontSize: '12px', color: SUBTLE }}>
            © 2026 StyleGuruAI. All rights reserved.
          </p>
          <p style={{ fontSize: '11px', color: SUBTLE, letterSpacing: '0.03em' }}>
            Designed for Indian skin tones · Built in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
