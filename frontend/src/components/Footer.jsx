/**
 * Footer.jsx — StyleGuru AI Shared Public Footer
 * Glassmorphic dark design system with compliant AdSense & trust links
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_EMAIL, APP_NAME } from '../constants/contact';

const BG = '#080C17';
const BORDER = 'rgba(255,255,255,0.06)';
const TEXT = '#F9FAFB';
const MUTED = '#9CA3AF';
const SUBTLE = '#4B5563';
const GOLD = '#C9A96E';
const GRAD = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const publicLinks = [
    { label: 'Home',             to: '/' },
    { label: 'Fashion Blog',     to: '/blog' },
    { label: 'About Us',         to: '/about' },
    { label: 'Contact & Help',   to: '/contact' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy',   to: '/privacy-policy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Disclaimer',       to: '/disclaimer' },
  ];

  return (
    <footer
      style={{
        background: BG,
        borderTop: `1px solid ${BORDER}`,
        padding: '56px 0 32px',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
      className="text-slate-300"
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4 no-underline">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center p-0.5 bg-gradient-to-tr from-violet-600 to-pink-500 shadow-md">
                <img src="/logo.png" alt="StyleGuru AI Logo" className="w-full h-full object-contain rounded-md" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                {APP_NAME}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC' }}>
                Made in India 🇮🇳
              </span>
            </Link>

            <p className="text-xs sm:text-sm leading-relaxed mb-4 max-w-sm" style={{ color: MUTED }}>
              Intelligent skin-tone color analysis and personalized outfit recommendations tailored for Indian complexions, weather, and cultural celebrations.
            </p>

            <p className="text-xs" style={{ color: SUBTLE }}>
              Need support? Email us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-white" style={{ color: GOLD }}>
                {CONTACT_EMAIL}
              </a>
            </p>

            <div style={{ marginTop: 20, height: 2, width: 48, background: GRAD, borderRadius: 1 }} />
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 sm:col-span-6">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: GOLD }}>
              Navigation
            </p>
            <ul className="space-y-2.5 list-none p-0 m-0 text-xs sm:text-sm">
              {publicLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="no-underline transition-colors hover:text-white"
                    style={{ color: MUTED }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Trust */}
          <div className="md:col-span-4 sm:col-span-6">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: GOLD }}>
              Legal & Trust
            </p>
            <ul className="space-y-2.5 list-none p-0 m-0 text-xs sm:text-sm mb-4">
              {legalLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="no-underline transition-colors hover:text-white"
                    style={{ color: MUTED }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-[11px] leading-relaxed" style={{ color: SUBTLE }}>
              Compliant with Google AdSense Publisher Policies and Indian Consumer Protection Guidelines.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: SUBTLE }}>
          <p className="m-0">
            © {currentYear} {APP_NAME}. All rights reserved.
          </p>
          <p className="m-0 flex items-center gap-2">
            <span>Founded by Vivek Kumar</span>
            <span>•</span>
            <span>Built with pride in India 🇮🇳</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
