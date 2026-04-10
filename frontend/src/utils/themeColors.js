/**
 * themeColors.js — StyleGuru AI v5.0
 * ════════════════════════════════════════
 * Centralized Theme Color System
 * Two complete palettes: DARK + LIGHT
 * Used by AppShell and all glass components
 */

// ── Dark Theme (Navy Glassmorphism) ───────────────
export const DARK = {
  isDark: true,
  bg: '#0B0F1A',
  bgSec: '#0F1628',
  glass: 'rgba(255,255,255,0.05)',
  glass2: 'rgba(255,255,255,0.08)',
  glass3: 'rgba(255,255,255,0.12)',
  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.12)',
  text: '#F9FAFB',
  text2: '#E5E7EB',
  muted: '#9CA3AF',
  mutedLight: '#6B7280',
  navBg: 'rgba(11,15,26,0.95)',
  navBgScroll: 'rgba(11,15,26,0.75)',
  bottomNav: 'rgba(11,15,26,0.97)',
  cardShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
  cardHoverShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  btnShadow: '0 4px 20px rgba(139,92,246,0.35)',
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.12)',
  divider: 'rgba(255,255,255,0.06)',
  glow1: 'rgba(99,102,241,0.08)',
  glow2: 'rgba(236,72,153,0.06)',
  dangerBg: 'rgba(239,68,68,0.08)',
  dangerBorder: 'rgba(239,68,68,0.25)',
  dangerText: '#EF4444',
  successBg: 'rgba(16,185,129,0.12)',
  successBorder: 'rgba(16,185,129,0.35)',
  warnText: '#EF9090',
};

// ── Light Theme (Clean White) ──────────────────────
export const LIGHT = {
  isDark: false,
  bg: '#F0F2F8',
  bgSec: '#E8EAF2',
  glass: 'rgba(255,255,255,0.85)',
  glass2: 'rgba(255,255,255,0.95)',
  glass3: 'rgba(255,255,255,1)',
  border: 'rgba(0,0,0,0.07)',
  border2: 'rgba(0,0,0,0.12)',
  text: '#111827',
  text2: '#1F2937',
  muted: '#6B7280',
  mutedLight: '#9CA3AF',
  navBg: 'rgba(255,255,255,0.97)',
  navBgScroll: 'rgba(255,255,255,0.85)',
  bottomNav: 'rgba(255,255,255,0.98)',
  cardShadow: '0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
  cardHoverShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(139,92,246,0.08)',
  btnShadow: '0 4px 16px rgba(139,92,246,0.25)',
  inputBg: 'rgba(0,0,0,0.04)',
  inputBorder: 'rgba(0,0,0,0.12)',
  divider: 'rgba(0,0,0,0.06)',
  glow1: 'rgba(99,102,241,0.06)',
  glow2: 'rgba(236,72,153,0.04)',
  dangerBg: 'rgba(239,68,68,0.06)',
  dangerBorder: 'rgba(239,68,68,0.2)',
  dangerText: '#DC2626',
  successBg: 'rgba(16,185,129,0.08)',
  successBorder: 'rgba(16,185,129,0.25)',
  warnText: '#DC2626',
};

// ── Shared across both themes ──────────────────────
export const GRAD = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)';
export const GRAD_B = 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)';
export const VIOLET = '#8B5CF6';
export const INDIGO = '#6366F1';
export const PINK = '#EC4899';
export const PJS = "'Plus Jakarta Sans','Inter',sans-serif";
export const PDI = "'Playfair Display',Georgia,serif";

/** Returns the current color palette based on theme string */
export function getThemeColors(theme) {
  return theme === 'light' ? LIGHT : DARK;
}
