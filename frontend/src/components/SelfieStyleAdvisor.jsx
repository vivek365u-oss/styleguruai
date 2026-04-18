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
  const { display, icon, description, characteristics = [], celebrity_examples = [], shape, confidence, is_fallback } = faceShape;
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
            <Badge>Face Shape</Badge>
            {!is_fallback && (
              <Badge color="#10B981">{confPct}% match</Badge>
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
        {/* Rank badge */}
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
            <span style={{
              fontSize: 14, fontWeight: 700, color: C.text, fontFamily: PJS,
            }}>
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

      {/* Expanded body */}
      {expanded && (
        <div style={{
          padding: '0 18px 18px',
          animation: 'fadeSlideIn 0.25s ease',
        }}>
          <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

          {/* Why this style */}
          <div style={{
            background: C.glass2, borderRadius: 12, padding: '12px 14px', marginBottom: 14,
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: VIOLET, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: PJS }}>
              Why This Works For You
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.6, fontFamily: PJS }}>
              {rec.reason}
            </p>
          </div>

          {/* Benefit */}
          <div style={{
            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 12, padding: '12px 14px', marginBottom: 14,
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: PJS }}>
              The Benefit
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.6, fontFamily: PJS }}>
              {rec.benefit}
            </p>
          </div>

          {/* Style Tip */}
          <div style={{
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 12, padding: '12px 14px', marginBottom: rec.avoid_reason ? 14 : 0,
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: PJS }}>
              💡 Stylist Tip
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.6, fontFamily: PJS }}>
              {rec.style_tip}
            </p>
          </div>

          {/* Avoid */}
          {rec.avoid_reason && (
            <div style={{
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12, padding: '12px 14px', marginTop: 14,
            }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: PJS }}>
                ⚠️ Avoid
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.6, fontFamily: PJS }}>
                {rec.avoid_reason}
              </p>
            </div>
          )}

          {/* Hair Color */}
          {rec.hair_color && (
            <div style={{
              marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 10,
              background: C.glass2, borderRadius: 12, padding: '12px 14px',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🎨</span>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, color: C.text, fontFamily: PJS }}>Hair Color Advice</p>
                <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.5, fontFamily: PJS }}>{rec.hair_color}</p>
                {rec.hair_color_avoid && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444', fontFamily: PJS }}>Avoid: {rec.hair_color_avoid}</p>
                )}
              </div>
            </div>
          )}

          {/* Occasions */}
          {rec.occasion?.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {rec.occasion.map(o => (
                <span key={o} style={{
                  background: C.glass2, border: `1px solid ${C.border}`,
                  borderRadius: 20, padding: '3px 10px',
                  fontSize: 11, color: C.muted, fontFamily: PJS, textTransform: 'capitalize',
                }}>
                  {o}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────
// Upload Section
// ────────────────────────────────────────────────────
function UploadArea({ gender, setGender, onFileSelect, C }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);

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
              {g === 'male' ? '👨 Male' : '👩 Female'}
            </button>
          );
        })}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${dragging ? VIOLET : C.border2}`,
          borderRadius: 16,
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
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
        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 6px', fontFamily: PJS }}>
          Upload Your Selfie
        </p>
        <p style={{ fontSize: 12, color: C.muted, margin: '0 0 16px', lineHeight: 1.6, fontFamily: PJS }}>
          Face front-facing, good lighting<br />
          JPG · PNG · WebP · max 10MB
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 22px', borderRadius: 10,
          background: GRAD, color: '#fff',
          fontSize: 13, fontWeight: 600, fontFamily: PJS,
          boxShadow: '0 4px 16px rgba(139,92,246,0.4)',
        }}>
          📂 Browse File
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
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

// ────────────────────────────────────────────────────
// Results View
// ────────────────────────────────────────────────────
function StyleResults({ data, previewUrl, gender, onReset, C }) {
  const [expandedIdx, setExpandedIdx] = useState(0);
  const { face_shape, skin_analysis, hairstyle_recommendations = [], style_tips } = data;

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
    </div>
  );
}

// ────────────────────────────────────────────────────
// ERROR block
// ────────────────────────────────────────────────────
function ErrorBlock({ message, onRetry, C }) {
  return (
    <GlassCard C={C} style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 36, margin: '0 0 12px' }}>😕</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8, fontFamily: PJS }}>Analysis Failed</p>
      <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 24, fontFamily: PJS }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          background: GRAD, border: 'none', color: '#fff',
          borderRadius: 12, padding: '12px 32px',
          fontSize: 14, fontWeight: 600, fontFamily: PJS, cursor: 'pointer',
        }}
      >
        Try Again
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
                </div >
              ))}
            </div >

  <button onClick={handleReset} style={{ width: '100%', padding: 16, borderRadius: 14, background: GRAD, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Scan New Photo</button>
          </div >
        )}

{
  showAdModal && (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <GlassCard C={C} style={{ maxWidth: 360, textAlign: 'center' }}>
        <span style={{ fontSize: 48, marginBottom: 16, display: 'block' }}>🎬</span>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8, fontFamily: PJS }}>Unlock More Styles</h3>
        <p style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.6, fontFamily: PJS }}>
          You've used your 2 free monthly analyses. Watch a 15-second ad to unlock your pro report!
        </p>
        <button onClick={handleWatchAd} style={{ width: '100%', padding: 16, borderRadius: 12, background: GRAD, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
          Watch 15s Ad to Continue
        </button>
        <button onClick={() => setShowAdModal(false)} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer' }}>
          Cancel
        </button>
      </GlassCard>
    </div>
  )
}

{
  loading && progress > 0 && progress < 100 && !results && (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <GlassCard C={C} style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📺</div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8, fontFamily: PJS }}>
          Ad Playing...
        </h3>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, fontFamily: PJS }}>
          Please wait {Math.ceil((100 - progress) * 0.15)} seconds
        </p>
        <div style={{ height: 8, background: C.glass2, borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: GRAD, borderRadius: 99,
            transition: 'width 0.1s linear',
            boxShadow: '0 0 12px rgba(139,92,246,0.5)',
          }} />
        </div>
        <p style={{ fontSize: 11, color: C.muted, fontFamily: PJS }}>
          Your analysis will start automatically after the ad
        </p>
      </GlassCard>
    </div>
  )
}
      </div >
    </>
  );
}
