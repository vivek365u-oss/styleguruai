/**
 * themeColors.js — StyleGuruAI v5.2
 * ════════════════════════════════════════
 * Centralized Human-Crafted Theme System
 * Genuine, non-AI aesthetic with editorial clarity.
 * High-contrast slate typography + restrained luxury accents.
 */

// ── Dark Theme (Obsidian Slate Navy) ───────────────
export const DARK = {
  isDark: true,
  bg: '#0A0F1D',
  bgSec: '#0F172A',
  glass: '#111827',
  glass2: '#161F33',
  glass3: '#1E293B',
  border: 'rgba(255, 255, 255, 0.08)',
  border2: 'rgba(255, 255, 255, 0.14)',
  text: '#F8FAFC',
  text2: '#E2E8F0',
  muted: '#94A3B8',
  mutedLight: '#64748B',
  navBg: 'rgba(10, 15, 29, 0.95)',
  navBgScroll: 'rgba(10, 15, 29, 0.85)',
  bottomNav: 'rgba(10, 15, 29, 0.97)',
  cardShadow: '0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  cardHoverShadow: '0 8px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  btnShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
  inputBg: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
  divider: 'rgba(255, 255, 255, 0.07)',
  glow1: 'rgba(99, 102, 241, 0.08)',
  glow2: 'rgba(236, 72, 153, 0.06)',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  dangerBorder: 'rgba(239, 68, 68, 0.3)',
  dangerText: '#F87171',
  successBg: 'rgba(16, 185, 129, 0.12)',
  successBorder: 'rgba(16, 185, 129, 0.35)',
  warnText: '#FCA5A5',
};

// ── Light Theme (Crisp Editorial Off-White) ─────────
export const LIGHT = {
  isDark: false,
  bg: '#F8FAFC',
  bgSec: '#F1F5F9',
  glass: '#FFFFFF',
  glass2: '#F8FAFC',
  glass3: '#F1F5F9',
  border: '#E2E8F0',
  border2: '#CBD5E1',
  text: '#0F172A',
  text2: '#334155',
  muted: '#64748B',
  mutedLight: '#94A3B8',
  navBg: 'rgba(255, 255, 255, 0.96)',
  navBgScroll: 'rgba(255, 255, 255, 0.90)',
  bottomNav: 'rgba(255, 255, 255, 0.98)',
  cardShadow: '0 1px 3px rgba(0, 0, 0, 0.03), 0 6px 18px -3px rgba(0, 0, 0, 0.04)',
  cardHoverShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 12px 24px -4px rgba(99, 102, 241, 0.07)',
  btnShadow: '0 4px 14px rgba(99, 102, 241, 0.22)',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  divider: '#E2E8F0',
  glow1: 'rgba(99, 102, 241, 0.04)',
  glow2: 'rgba(236, 72, 153, 0.03)',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  dangerText: '#DC2626',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  warnText: '#DC2626',
};

// ── Shared across both themes ──────────────────────
export const GRAD = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 55%, #EC4899 100%)';
export const GRAD_B = 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)';
export const VIOLET = '#7C3AED';
export const INDIGO = '#4F46E5';
export const PINK = '#EC4899';
export const PJS = "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
export const PDI = "'Playfair Display', Georgia, serif";

/** Returns the current color palette based on theme string */
export function getThemeColors(theme) {
  return theme === 'light' ? LIGHT : DARK;
}
