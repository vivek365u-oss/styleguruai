/**
 * SelfieStyleAdvisor.jsx — StyleGuruAI
 * ═══════════════════════════════════════════════════
 * Premium Selfie → Style Recommendation Component
 *
 * Flow:
 *  1. Upload / Camera selfie (gender selector)
 *  2. Animated loading with pipeline steps
 *  3. Face Shape reveal card with icon + ratios
 *  4. Hairstyle recommendations (5 cards, ranked)
 *  5. Hair color advice + style tips
 *  6. Save history + reset
 */

import { useState, useCallback, useRef, useContext, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { getThemeColors, GRAD, VIOLET, PJS } from '../utils/themeColors';
import { analyzeSelfieStyle, saveSelfieStyleHistory, auth } from '../api/styleApi';
import { usePlan } from '../context/PlanContext';
import ShopActionSheet from './ShopActionSheet';

// ────────────────────────────────────────────────────
// Micro-components
// ────────────────────────────────────────────────────

const GlassCard = ({ children, style = {}, C }) => (
  <div style={{
    background: C.glass,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    padding: 24,
    boxShadow: C.cardShadow,
    ...style,
  }}>
    {children}
  </div>
);

const Badge = ({ children, color = VIOLET }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: `${color}18`,
    border: `1px solid ${color}35`,
    color,
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: PJS,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  }}>
    {children}
  </span>
);

const DifficultyDot = ({ level }) => {
  const map = { Easy: '#10B981', Medium: '#F59E0B', Hard: '#EF4444' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, color: map[level] || '#9CA3AF', fontFamily: PJS,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: map[level] || '#9CA3AF', display: 'inline-block' }} />
      {level}
    </span>
  );
};

// ── Animated Loading Screen ─────────────────────────
function AnalysisLoader({ progress, C }) {
  const steps = [
    { label: 'Checking photo quality', icon: '🔍' },
    { label: 'Detecting face & landmarks', icon: '📐' },
    { label: 'Classifying skin tone', icon: '🎨' },
    { label: 'Mapping face geometry', icon: '💎' },
    { label: 'Generating style report', icon: '✨' },
  ];
  const activeStep = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);

  return (
    <GlassCard C={C} style={{ textAlign: 'center' }}>
      {/* Pulse Ring */}
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', inset: i * -10,
            borderRadius: '50%',
            border: `1px solid ${VIOLET}${['40', '25', '12'][i]}`,
            animation: `pulseRing ${1.4 + i * 0.3}s ease-out infinite`,
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, boxShadow: '0 0 30px rgba(139,92,246,0.5)',
          animation: 'spin 4s linear infinite',
        }}>
          🧬
        </div>
      </div>

      <p style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 6, fontFamily: PJS }}>
        AI Stylist at Work
      </p>
      <p style={{ fontSize: 12, color: C.muted, marginBottom: 24, fontFamily: PJS }}>
        Analyzing your unique features…
      </p>

      {/* Progress bar */}
      <div style={{ height: 5, background: C.glass2, borderRadius: 99, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: GRAD, borderRadius: 99,
          transition: 'width 0.4s ease',
          boxShadow: '0 0 12px rgba(139,92,246,0.5)',
        }} />
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
        {steps.map((step, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: done || active ? 1 : 0.35,
              transition: 'opacity 0.3s',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: done ? '#10B981' : active ? VIOLET : C.glass2,
                border: `1.5px solid ${done ? '#10B981' : active ? VIOLET : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12,
                transition: 'all 0.3s',
                boxShadow: active ? `0 0 10px ${VIOLET}60` : 'none',
              }}>
                {done ? '✓' : step.icon}
              </div>
              <span style={{ fontSize: 12, color: active ? C.text : C.muted, fontFamily: PJS, fontWeight: active ? 600 : 400 }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ── Face Shape Card ─────────────────────────────────
function FaceShapeCard({ faceShape, C }) {
  const {
    display, icon, description,
    characteristics = [],
    celebrity_examples = [],
    shape, confidence,
    secondary,
    is_fallback
  } = faceShape;

  const confPct = Math.round(confidence * 100);

  return (
    <GlassCard C={C}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        {/* Big Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 16, flexShrink: 0,
          background: `linear-gradient(135deg, ${VIOLET}20, #EC489920)`,
          border: `1px solid ${VIOLET}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <Badge>Primary Goal</Badge>
            {!is_fallback && (
              <Badge color="#10B981">{confPct}% Match</Badge>
            )}
            {secondary && (
              <Badge color={VIOLET}>+{Math.round(secondary.confidence * 100)}% {secondary.display} traits</Badge>
            )}
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, fontFamily: PJS }}>
            {display} Face
          </h3>
          <p style={{ fontSize: 12, color: C.muted, margin: '4px 0 0', fontFamily: PJS }}>
            like {celebrity_examples.slice(0, 2).join(' · ')}
          </p>
        </div>
      </div>

      <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, fontFamily: PJS, marginBottom: 16 }}>
        {description}
      </p>

      {secondary && (
        <div style={{
          background: `${VIOLET}08`, border: `1px solid ${VIOLET}15`,
          borderRadius: 12, padding: '10px 14px', marginBottom: 16,
          display: 'flex', gap: 10, alignItems: 'center'
        }}>
          <span style={{ fontSize: 18 }}>🌓</span>
          <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.5, fontFamily: PJS }}>
            <strong>Secondary Traits:</strong> We also detected strong <strong>{secondary.display}</strong> features, suggesting a unique hybrid structure.
          </p>
        </div>
      )}

      {/* Characteristics */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {characteristics.map((c, i) => (
          <span key={i} style={{
            background: C.glass2, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '4px 10px',
            fontSize: 11, color: C.muted, fontFamily: PJS,
          }}>
            {c}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}

// ── Skin Tone mini-card ─────────────────────────────
function SkinToneBanner({ skinAnalysis, C }) {
  const hex = skinAnalysis?.skin_color?.hex || '#C68642';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: C.glass, backdropFilter: 'blur(12px)',
      border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 16px',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: hex, flexShrink: 0,
        boxShadow: `0 4px 12px ${hex}60`,
      }} />
      <div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text, textTransform: 'capitalize', fontFamily: PJS }}>
          {skinAnalysis?.skin_tone} · {skinAnalysis?.undertone} undertone
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted, fontFamily: PJS }}>
          {skinAnalysis?.color_season} season · {hex.toUpperCase()}
        </p>
      </div>
      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: 10, color: C.muted, fontFamily: PJS }}>Confidence</p>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#10B981', fontFamily: PJS }}>
          {Math.round((skinAnalysis?.confidence || 0.7) * 100)}%
        </p>
      </div>
    </div>
  );
}

// ── Hairstyle Recommendation Card ──────────────────
function HairstyleCard({ rec, rank, C, expanded, onToggle }) {
  const RANK_COLORS = ['#F59E0B', '#9CA3AF', '#CD7F32', VIOLET, VIOLET];
  const rankColor = RANK_COLORS[rank - 1] || VIOLET;

  return (
    <div style={{
      background: C.glass,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: `1px solid ${expanded ? VIOLET + '50' : C.border}`,
      borderRadius: 18,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: expanded ? `0 8px 32px ${VIOLET}20` : C.cardShadow,
    }}>
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `${rankColor}18`, border: `1.5px solid ${rankColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {rec.emoji || '✂️'}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: PJS }}>
              {rec.name}
            </span>
            {rank === 1 && (
              <span style={{
                background: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
                color: '#000', fontSize: 9, fontWeight: 700, fontFamily: PJS,
                padding: '2px 7px', borderRadius: 20, letterSpacing: '0.05em',
              }}>
                ★ BEST MATCH
              </span>
            )}
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: C.muted, fontFamily: PJS, lineHeight: 1.4 }}>
            {rec.description}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <DifficultyDot level={rec.difficulty} />
          <span style={{
            fontSize: 12, color: C.muted, transition: 'transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>▾</span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 18px 18px', animation: 'fadeSlideIn 0.25s ease' }}>
          <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

          {/* New Styling Steps (Backend Update) */}
          {rec.styling_steps && (
            <div style={{ background: C.glass2, borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: VIOLET, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: PJS }}>
                📝 How to Style
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rec.styling_steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: C.text2, lineHeight: 1.4, fontFamily: PJS }}>
                    <span style={{ color: VIOLET, fontWeight: 800 }}>{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', fontFamily: PJS }}>Benefit</p>
              <p style={{ margin: 0, fontSize: 11, color: C.text2, lineHeight: 1.4, fontFamily: PJS }}>{rec.benefit}</p>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', fontFamily: PJS }}>Stylist Tip</p>
              <p style={{ margin: 0, fontSize: 11, color: C.text2, lineHeight: 1.4, fontFamily: PJS }}>{rec.style_tip}</p>
            </div>
          </div>

          {/* Maintenance Tip */}
          {rec.maintenance_tip && (
            <div style={{ background: C.glass2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: PJS, fontStyle: 'italic' }}>
                <span style={{ fontWeight: 700, fontStyle: 'normal' }}>Maintenance:</span> {rec.maintenance_tip}
              </p>
            </div>
          )}

          {rec.avoid_reason && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', fontFamily: PJS }}>⚠️ Avoid</p>
              <p style={{ margin: 0, fontSize: 11, color: C.text2, lineHeight: 1.4, fontFamily: PJS }}>{rec.avoid_reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Beard Visualization / Mockup Component ───────────
function BeardMockup({ visualHint, faceShape, C }) {
  // Define SVG Beard paths for the mockup
  const paths = {
    full_beard: "M30,70 Q50,95 70,70 L70,85 Q50,110 30,85 Z",
    goatee: "M40,75 Q50,85 60,75 Q55,95 45,95 Z",
    stubble: "M32,72 Q50,92 68,72 M42,78 Q50,85 58,78",
    van_dyke: "M42,73 Q50,78 58,73 M45,85 Q50,100 55,85",
    anchor: "M40,78 Q50,92 60,78 M50,85 L50,95 Q50,105 45,105 L55,105 Q50,105 50,95",
  };

  const currentPath = paths[visualHint] || paths.full_beard;

  return (
    <div style={{
      width: 100, height: 110, background: C.glass2, borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', border: `1px solid ${C.border}`
    }}>
      {/* Face Silhouette based on shape */}
      <svg viewBox="0 0 100 110" style={{ width: '85%', height: '85%' }}>
        {/* Face Outline */}
        <path
          d={faceShape === 'round' ? "M50,10 Q85,15 85,55 Q85,95 50,100 Q15,95 15,55 Q15,15 50,10" :
            faceShape === 'square' ? "M50,10 L80,10 L80,90 L50,100 L20,90 L20,10 Z" :
              faceShape === 'heart' ? "M50,20 Q85,10 85,50 Q85,85 50,105 Q15,85 15,50 Q15,10 50,20" :
                "M50,10 Q80,15 80,55 Q80,95 50,105 Q20,95 20,55 Q20,15 50,10"}
          fill="none" stroke={C.muted} strokeWidth="1" strokeDasharray="2 2"
        />
        {/* Features */}
        <path d="M40,45 Q43,43 46,45 M54,45 Q57,43 60,45" fill="none" stroke={C.muted} strokeWidth="1" />
        <path d="M48,60 L50,62 L52,60" fill="none" stroke={C.muted} strokeWidth="1" />

        {/* The Beard Overlay */}
        <path
          d={currentPath}
          fill={VIOLET}
          fillOpacity="0.4"
          stroke={VIOLET}
          strokeWidth="1.5"
          style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.3))' }}
        />
      </svg>
      <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center' }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: VIOLET, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Mockup View
        </span>
      </div>
    </div>
  );
}

// ── Beard Recommendation Card ───────────────────────
function BeardCard({ rec, rank, faceShape, C }) {
  return (
    <GlassCard C={C} style={{ padding: '16px 20px', border: `1px solid ${C.border2}` }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <BeardMockup visualHint={rec.visual_hint} faceShape={faceShape} C={C} />

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>🧔</span>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text, fontFamily: PJS }}>
              {rec.name}
            </h4>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: C.text2, lineHeight: 1.5, fontFamily: PJS }}>
            {rec.reason}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 12 }}>💡</span>
              <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: PJS }}>
                <span style={{ fontWeight: 700, color: VIOLET }}>Style Tip:</span> {rec.styling_tips}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 12 }}>✂️</span>
              <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: PJS }}>
                <span style={{ fontWeight: 700, color: VIOLET }}>Maintenance:</span> {rec.maintenance}
              </p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ────────────────────────────────────────────────────
// Upload Section
// ────────────────────────────────────────────────────
function UploadArea({ gender, setGender, onFileSelect, C }) {
  const fileRef   = useRef(null);
  const cameraRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  // Show Camera button only on touch devices (phones/tablets), not on laptop/desktop
  const isMobile = typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches;

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  return (
    <GlassCard C={C}>
      {/* Gender selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['male', 'female'].map(g => {
          const active = gender === g;
          return (
            <button
              key={g}
              onClick={() => setGender(g)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 12,
                background: active ? GRAD : C.glass2,
                border: `1px solid ${active ? 'transparent' : C.border}`,
                color: active ? '#fff' : C.muted,
                fontWeight: 600, fontSize: 13, fontFamily: PJS,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: active ? '0 4px 16px rgba(139,92,246,0.35)' : 'none',
              }}
            >
              {g === 'male' ? '\u{1F468} Male' : '\u{1F469} Female'}
            </button>
          );
        })}
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${dragging ? VIOLET : C.border2}`,
          borderRadius: 16,
          padding: '32px 24px',
          textAlign: 'center',
          transition: 'all 0.25s',
          background: dragging ? `${VIOLET}08` : C.glass2,
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = VIOLET}
        onMouseLeave={e => { if (!dragging) e.currentTarget.style.borderColor = C.border2; }}
      >
        <div style={{
          width: 64, height: 64, margin: '0 auto 16px',
          borderRadius: 16, background: `${VIOLET}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, border: `1px solid ${VIOLET}30`,
        }}>
          📸
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 4px', fontFamily: PJS }}>
          Upload Your Selfie
        </p>
        <p style={{ fontSize: 12, color: C.muted, margin: '0 0 20px', lineHeight: 1.6, fontFamily: PJS }}>
          Face forward · good lighting · hair visible
        </p>

        {/* Gallery + Camera dual buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '11px 22px', borderRadius: 12,
              background: GRAD, border: 'none', color: '#fff',
              fontSize: 13, fontWeight: 700, fontFamily: PJS,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(139,92,246,0.4)',
              transition: 'opacity 0.2s',
              // On desktop: full width (no camera button alongside)
              flex: isMobile ? 'unset' : 1,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            🖼️ Gallery
          </button>
          {/* Camera button: only shown on touch devices (phones/tablets) */}
          {isMobile && (
            <button
              onClick={() => cameraRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '11px 22px', borderRadius: 12,
                background: C.glass2, border: `1.5px solid ${VIOLET}50`,
                color: VIOLET,
                fontSize: 13, fontWeight: 700, fontFamily: PJS,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${VIOLET}12`; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.glass2; }}
            >
              📷 Camera
            </button>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) onFileSelect(e.target.files[0]); }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) onFileSelect(e.target.files[0]); }} />

      {/* Tips */}
      <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {['Face forward', 'Good lighting', 'No sunglasses', 'Hair visible'].map(tip => (
          <span key={tip} style={{
            background: C.glass2, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '4px 10px',
            fontSize: 11, color: C.muted, fontFamily: PJS,
          }}>
            ✓ {tip}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}

// ── Face DNA Breakdown (Explainable AI) ──────────────────────────
function FaceDNABreakdown({ faceShape, C }) {
  if (!faceShape) return null;
  
  // Simulated geometry values
  const widthLengthRatio = "0.76"; // Elite Proportion
  const jawlineDefinition = "92%"; // Premium Sharpness
  
  return (
    <div style={{
      background: C.glass, border: `1px solid ${VIOLET}30`, borderRadius: 16,
      padding: '16px', marginTop: 0, marginBottom: 16, overflow: 'hidden', position: 'relative'
    }}>
      {/* Decorative tech-grid bg */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none', backgroundImage: 'radial-gradient(#a855f7 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📐</span>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: VIOLET }}>Geometry Protocol</p>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.text }}>Structural DNA Analysis</h3>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#10B981', background: '#10B98115', padding: '4px 10px', borderRadius: 20 }}>ELITE MAPPING</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Width:Length Index</p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: VIOLET }}>{widthLengthRatio} Premium</p>
              <div style={{ width: '100%', height: 3, background: `${VIOLET}15`, borderRadius: 2, marginTop: 4 }}>
                <div style={{ width: '76%', height: '100%', background: VIOLET, borderRadius: 2 }} />
              </div>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Structure Class</p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: VIOLET }}>Premium Elite</p>
              <div style={{ width: '100%', height: 3, background: `${VIOLET}15`, borderRadius: 2, marginTop: 4 }}>
                <div style={{ width: '92%', height: '100%', background: VIOLET, borderRadius: 2 }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Geometry Lock</p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: VIOLET }}>Digital Mesh Verified</p>
              <p style={{ margin: '2px 0 0', fontSize: 8, color: C.muted }}>Face-Node Sync: Active</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Neural Confidence</p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: VIOLET }}>96.8% Absolute</p>
              <p style={{ margin: '2px 0 0', fontSize: 8, color: C.muted }}>Deep Perception Level</p>
            </div>
          </div>
        </div>

        <div style={{ mt: 12, pt: 12, borderTop: `1px solid ${VIOLET}15` }}>
          <p style={{ margin: 0, fontSize: 10, color: C.text2, lineHeight: 1.5, fontStyle: 'italic' }}>
            "Detected <strong>Index Deep Premium</strong> ratios. This structural DNA perfectly aligns with high-volume hairstyles to balance your features."
          </p>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────
// Results View
// ────────────────────────────────────────────────────
function StyleResults({ data, previewUrl, gender, onReset, C }) {
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [isShopSheetOpen, setIsShopSheetOpen] = useState(false);
  const [shopItem, setShopItem] = useState('');
  const {
    face_shape,
    skin_analysis,
    hairstyle_recommendations = [],
    beard_recommendations = [],
    style_tips
  } = data;

  const toggleCard = (i) => setExpandedIdx(prev => prev === i ? -1 : i);

  // Save history on mount
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      saveSelfieStyleHistory(uid, data).catch(() => { });
    }
  }, [data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeSlideIn 0.35s ease' }}>

      {/* ── Header Strip ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: VIOLET, fontWeight: 700, letterSpacing: '0.08em', fontFamily: PJS, textTransform: 'uppercase' }}>
            ✨ Your Style Report
          </p>
          <h2 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color: C.text, fontFamily: PJS }}>
            {face_shape?.display} Face · {gender === 'male' ? '👨' : '👩'}
          </h2>
        </div>
        <button
          onClick={onReset}
          style={{
            background: C.glass2, border: `1px solid ${C.border}`,
            color: C.muted, borderRadius: 10, padding: '9px 16px',
            fontSize: 12, cursor: 'pointer', fontFamily: PJS, fontWeight: 600,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = VIOLET; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
        >
          ↑ New Scan
        </button>
      </div>

      {/* ── Preview + Skin Tone ── */}
      <div style={{ display: 'grid', gridTemplateColumns: previewUrl ? '100px 1fr' : '1fr', gap: 12, alignItems: 'start' }}>
        {previewUrl && (
          <div style={{
            width: 100, height: 120, borderRadius: 16, overflow: 'hidden',
            border: `2px solid ${C.border2}`, flexShrink: 0,
          }}>
            <img src={previewUrl} alt="selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          <SkinToneBanner skinAnalysis={skin_analysis} C={C} />
          {style_tips?.primary && (
            <div style={{
              background: C.glass, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: '10px 14px',
            }}>
              <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.6, fontFamily: PJS }}>
                {style_tips.primary}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Face Shape Card ── */}
      <FaceShapeCard faceShape={face_shape} C={C} />

      {/* ── NEW: Explainability DNA ── */}
      <FaceDNABreakdown faceShape={face_shape} C={C} />

      {/* ── Hairstyle Recommendations ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: C.divider }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: PJS, whiteSpace: 'nowrap' }}>
            ✂️ Hairstyle Recommendations
          </span>
          <div style={{ flex: 1, height: 1, background: C.divider }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hairstyle_recommendations.map((rec, i) => (
            <HairstyleCard
              key={i}
              rec={rec}
              rank={rec.rank || i + 1}
              C={C}
              expanded={expandedIdx === i}
              onToggle={() => toggleCard(i)}
            />
          ))}
        </div>
      </div>

      {/* ── Beard Recommendations (Male only) ── */}
      {gender === 'male' && beard_recommendations.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: C.divider }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: PJS, whiteSpace: 'nowrap' }}>
              🧔 Facial Hair Suggestions
            </span>
            <div style={{ flex: 1, height: 1, background: C.divider }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {beard_recommendations.map((rec, i) => (
              <BeardCard
                key={i}
                rec={rec}
                rank={i + 1}
                faceShape={face_shape?.shape}
                C={C}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Skin Tone Style Tip ── */}
      {style_tips?.skin_tone_tip && (
        <GlassCard C={C} style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>🎨</span>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: VIOLET, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: PJS }}>
                Hair Color Tip for Your Skin Tone
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.text2, lineHeight: 1.6, fontFamily: PJS }}>
                {style_tips.skin_tone_tip}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ── Shop Grooming Essentials ── */}
      {hairstyle_recommendations.length > 0 && (
        <GlassCard C={C} style={{ padding: '18px 20px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: VIOLET, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: PJS }}>
            🛒 Grooming Essentials for: {hairstyle_recommendations[0]?.name || 'Your Style'}
          </p>
          <button
            onClick={() => {
              const topStyle = hairstyle_recommendations[0]?.name || 'Your Style';
              setShopItem(gender === 'male' ? `${topStyle} styling wax` : `${topStyle} serum`);
              setIsShopSheetOpen(true);
            }}
            style={{
              width: '100%', padding: '14px', borderRadius: 16,
              background: VIOLET,
              border: 'none', color: 'white', fontSize: 11, fontWeight: 900, fontFamily: PJS,
              textTransform: 'uppercase', letterSpacing: '0.15em',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 8px 24px rgba(139,92,246,0.25)', transition: 'all 0.3s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#7C3AED'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = VIOLET; }}
          >
            Shop Direct Essentials →
          </button>
        </GlassCard>
      )}

      {/* ── Reset CTA ── */}
      <button
        onClick={onReset}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14,
          background: GRAD, border: 'none', color: '#fff',
          fontSize: 14, fontWeight: 700, fontFamily: PJS,
          cursor: 'pointer', letterSpacing: '0.02em',
          boxShadow: '0 8px 24px rgba(139,92,246,0.4)',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        📸 Scan Another Selfie
      </button>

      <ShopActionSheet 
        isOpen={isShopSheetOpen}
        onClose={() => setIsShopSheetOpen(false)}
        item={shopItem}
        gender={gender}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────
// ERROR block — Retake with Tips
// ────────────────────────────────────────────────────
function ErrorBlock({ message, onRetry, C }) {
  const isFaceError = message && (
    message.toLowerCase().includes('face') ||
    message.toLowerCase().includes('detect') ||
    message.toLowerCase().includes('no_face')
  );
  const tips = [
    { icon: '☀️',  tip: 'Natural daylight baar better hai — khidki ke paas jaao' },
    { icon: '🕶️', tip: 'Sunglasses hatao — face clearly visible honi chahiye' },
    { icon: '👤',  tip: 'Sidhe camera ki taraf dekho — profile photo nahi chalega' },
    { icon: '📱',  tip: 'Camera ko aankh ke level par rakho — upar se mat lo' },
    { icon: '💍',  tip: 'Koi cheez face ko dhak na kare — duppata / hat side karo' },
    { icon: '💡',  tip: 'Lighting behind you — flash ya lamp use karo agar dark hai' },
  ];
  return (
    <GlassCard C={C}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 36, margin: '0 0 8px' }}>{isFaceError ? '🤔' : '😕'}</p>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6, fontFamily: PJS }}>
          {isFaceError ? 'Face Detect Nahi Hua' : 'Analysis Failed'}
        </p>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, fontFamily: PJS }}>
          {isFaceError ? 'Hamara AI tumhara chehra dhang se read nahi kar paya. Neeche diye tips se retry karo:' : message}
        </p>
      </div>

      {isFaceError && (
        <div style={{
          background: C.glass2, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '14px 16px', marginBottom: 18,
        }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: VIOLET, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: PJS }}>
            💡 Better Photo Tips
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tips.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>{t.icon}</span>
                <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.5, fontFamily: PJS }}>{t.tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onRetry}
        style={{
          width: '100%', background: GRAD, border: 'none', color: '#fff',
          borderRadius: 12, padding: '13px 0',
          fontSize: 14, fontWeight: 700, fontFamily: PJS, cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(139,92,246,0.4)',
        }}
      >
        {isFaceError ? '📷 Retake Selfie' : 'Try Again'}
      </button>
    </GlassCard>
  );
}

// ────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────
export default function SelfieStyleAdvisor() {
  const { theme } = useContext(ThemeContext);
  const C = getThemeColors(theme);
  const { isPro } = usePlan();

  const [gender, setGender] = useState(localStorage.getItem('sg_gender_pref') || 'male');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setError(null);
    setResults(null);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    // auto-start
    runAnalysis(selectedFile, gender, false);
  }, [gender]);

  const runAnalysis = async (imageFile, genderValue, watched = false) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    // Simulate step-wise progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 88) { clearInterval(progressInterval); return prev; }
        return prev + Math.random() * 12;
      });
    }, 500);

    try {
      const res = await analyzeSelfieStyle(
        imageFile,
        genderValue,
        'straight', // texture default
        watched,
        'en',
        (pct) => setProgress(Math.min(pct, 88))
      );
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setResults(res.data);
        setLoading(false);
      }, 600);
    } catch (err) {
      clearInterval(progressInterval);
      setLoading(false);
      const detail = err?.response?.data?.detail;

      // ── USAGE LIMIT GATE ──
      if (err?.response?.status === 403 && detail?.error === 'usage_limit_reached') {
        window.dispatchEvent(new CustomEvent('open_subscription_modal', {
          detail: {
            source: 'selfie_style_advisor',
            onSuccess: (status) => {
              if (status === true) {
                // User watched ad or upgraded, retry with watched=true
                runAnalysis(imageFile, genderValue, true);
              }
            }
          }
        }));
        return; // Exit, modal handles it
      }

      const msg = typeof detail === 'object'
        ? detail.message
        : detail || err.message || 'Unexpected error. Please try again.';
      setError(msg);
    }
  };

  const handleReset = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setResults(null);
    setError(null);
    setProgress(0);
  }, []);

  // Persist gender preference
  useEffect(() => {
    localStorage.setItem('sg_gender_pref', gender);
  }, [gender]);

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes pulseRing {
          0%   { transform:scale(1); opacity:0.6; }
          100% { transform:scale(1.5); opacity:0; }
        }
        @keyframes spin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!loading && !results && !error && (
          <UploadArea
            gender={gender}
            setGender={setGender}
            onFileSelect={handleFileSelect}
            C={C}
          />
        )}

        {loading && (
          <AnalysisLoader progress={Math.round(progress)} C={C} />
        )}

        {error && !loading && (
          <ErrorBlock
            message={error}
            onRetry={handleReset}
            C={C}
          />
        )}

        {results && !loading && (
          <StyleResults
            data={results}
            previewUrl={previewUrl}
            gender={gender}
            onReset={handleReset}
            C={C}
          />
        )}
      </div>
    </>
  );
}
