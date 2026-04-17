import { useState, useCallback, useRef, useContext, useEffect } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { getThemeColors, GRAD, VIOLET, PJS } from '../utils/themeColors';
import { analyzeSelfieStyle, getSelfieAnalysisUsage, saveSelfieStyleHistory, auth } from '../api/styleApi';

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

// ── Geometric Face Overlay ──────────────────────────
function GeometricOverlay({ landmarks, width, height, C }) {
  if (!landmarks || Object.keys(landmarks).length === 0) return null;

  const points = Object.entries(landmarks).map(([id, [x, y]]) => ({ id, x, y }));
  
  // Define connections for the "high-tech" look
  const connections = [
    [10, 54], [54, 234], [234, 172], [172, 152], // Right half
    [10, 284], [284, 454], [454, 397], [397, 152], // Left half
    [33, 263], // Eyes line
    [61, 291], // Mouth line
    [1, 10], [1, 152], [1, 54], [1, 284], // Radial connections from nose
  ];

  return (
    <svg 
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Mesh Connections */}
      {connections.map(([p1, p2], i) => {
        const pt1 = landmarks[p1];
        const pt2 = landmarks[p2];
        if (!pt1 || !pt2) return null;
        return (
          <line
            key={i}
            x1={pt1[0]} y1={pt1[1]}
            x2={pt2[0]} y2={pt2[1]}
            stroke={VIOLET}
            strokeWidth="0.8"
            strokeOpacity="0.4"
            style={{ animation: 'meshPulse 2s infinite alternate' }}
          />
        );
      })}

      {/* landmark Points */}
      {points.map(p => (
        <circle
          key={p.id}
          cx={p.x} cy={p.y}
          r="2"
          fill={VIOLET}
          fillOpacity="0.8"
          style={{ animation: 'pointPulse 1.5s infinite alternate' }}
        />
      ))}
    </svg>
  );
}

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
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            position: 'absolute', inset: i * -10,
            borderRadius: '50%',
            border: `1px solid ${VIOLET}${['40','25','12'][i]}`,
            animation: `pulseRing ${1.4 + i * 0.3}s ease-out infinite`,
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: GRAD,
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

      <div style={{ height: 5, background: C.glass2, borderRadius: 99, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: GRAD, borderRadius: 99,
          transition: 'width 0.4s ease',
          boxShadow: '0 0 12px rgba(139,92,246,0.5)',
        }} />
      </div>

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

// ── Beard Styling Section ───────────────────────────
function BeardStylist({ recommendations, C }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 1, background: C.divider }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: PJS, whiteSpace: 'nowrap' }}>
          🧔 Beard Stylist (For Men)
        </span>
        <div style={{ flex: 1, height: 1, background: C.divider }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {recommendations.map((rec, i) => (
          <div key={i} style={{
            background: C.glass, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: PJS }}>{rec.name}</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: C.text2, lineHeight: 1.5, fontFamily: PJS }}>{rec.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────
// Main UI Logic
// ────────────────────────────────────────────────────

export default function SelfieStyleAdvisor() {
  const { theme } = useContext(ThemeContext);
  const C = getThemeColors(theme);

  const [gender, setGender] = useState(localStorage.getItem('sg_gender_pref') || 'male');
  const [texture, setTexture] = useState('straight');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [usageInfo, setUsageInfo] = useState(null);

  // Persist gender preference
  useEffect(() => {
    localStorage.setItem('sg_gender_pref', gender);
  }, [gender]);

  // Fetch usage info on mount
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await getSelfieAnalysisUsage();
        setUsageInfo(res.data);
      } catch (err) {
        console.warn('Could not fetch usage info:', err);
      }
    };
    fetchUsage();
  }, []);

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    runAnalysis(selectedFile, gender, texture, false);
  }, [gender, texture]);

  const runAnalysis = async (imageFile, g, t, watched) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setResults(null);

    const itv = setInterval(() => {
      setProgress(p => (p >= 90 ? p : p + Math.random() * 10));
    }, 400);

    try {
      const res = await analyzeSelfieStyle(imageFile, g, t, watched);
      clearInterval(itv);
      setProgress(100);
      setTimeout(() => {
        setResults(res.data);
        setLoading(false);
        
        // Refresh usage info after successful analysis
        getSelfieAnalysisUsage().then(usageRes => {
          setUsageInfo(usageRes.data);
        }).catch(err => console.warn('Could not refresh usage info:', err));
      }, 600);
    } catch (err) {
      clearInterval(itv);
      setLoading(false);
      if (err.response?.status === 403 && err.response?.data?.error === 'usage_limit_reached') {
        setShowAdModal(true);
      } else {
        setError(err.response?.data?.detail?.message || 'Analysis failed. Please check lighting.');
      }
    }
  };

  const handleWatchAd = () => {
    setShowAdModal(false);
    setLoading(true);
    
    // Show ad loading message
    setProgress(0);
    
    // Simulate ad watching with progress (15 seconds max)
    const adDuration = 15000; // 15 seconds
    const adStartTime = Date.now();
    
    const adInterval = setInterval(() => {
      const elapsed = Date.now() - adStartTime;
      const adProgress = Math.min((elapsed / adDuration) * 100, 100);
      setProgress(adProgress);
      
      if (elapsed >= adDuration) {
        clearInterval(adInterval);
        // After ad completes, run analysis with watched=true
        runAnalysis(file, gender, texture, true);
      }
    }, 100);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResults(null);
    setError(null);
    setProgress(0);
  };

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseRing { 0% { transform:scale(1); opacity:0.6; } 100% { transform:scale(1.5); opacity:0; } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes meshPulse { from { stroke-opacity:0.2; } to { stroke-opacity:0.5; } }
        @keyframes pointPulse { from { r:2; fill-opacity:0.6; } to { r:3; fill-opacity:1; } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!loading && !results && !error && (
          <GlassCard C={C}>
            {/* Usage Info Banner */}
            {usageInfo && usageInfo.usage_tracking_enabled && (
              <div style={{ 
                background: usageInfo.limit_reached ? `${VIOLET}15` : `linear-gradient(135deg, ${VIOLET}10, ${VIOLET}05)`,
                border: `1px solid ${usageInfo.limit_reached ? VIOLET : C.border}`,
                borderRadius: 12, 
                padding: 12, 
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <span style={{ fontSize: 20 }}>{usageInfo.limit_reached ? '🎬' : '✨'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text, fontFamily: PJS }}>
                    {usageInfo.limit_reached 
                      ? 'Free limit reached this month' 
                      : `${usageInfo.remaining} free analysis remaining`}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: C.muted, fontFamily: PJS }}>
                    {usageInfo.limit_reached 
                      ? 'Watch a 15s ad to unlock more analyses' 
                      : `${usageInfo.usage_count}/${usageInfo.limit} used this month`}
                  </p>
                </div>
              </div>
            )}

            {/* Gender & Texture Selectors */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['male', 'female'].map(g => (
                <button key={g} onClick={() => setGender(g)} style={{
                  flex: 1, padding: 10, borderRadius: 12, background: gender === g ? GRAD : C.glass2, color: gender === g ? '#fff' : C.muted, fontWeight: 600, border: 'none', cursor: 'pointer', transition: '0.2s'
                }}>{g === 'male' ? '👨 Male' : '👩 Female'}</button>
              ))}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 20 }}>
              {['straight', 'wavy', 'curly', 'coily'].map(t => (
                <button key={t} onClick={() => setTexture(t)} style={{
                  padding: '8px 0', borderRadius: 10, background: texture === t ? VIOLET + '40' : C.glass2, border: `1px solid ${texture === t ? VIOLET : 'transparent'}`, color: texture === t ? VIOLET : C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer'
                }}>{t}</button>
              ))}
            </div>

            <div onClick={() => document.getElementById('selfie-up').click()} style={{ border: `2px dashed ${C.border}`, borderRadius: 16, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: C.glass2 }}>
              <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: 16, background: `${VIOLET}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📸</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 4px', fontFamily: PJS }}>Analyze My Face</p>
              <p style={{ fontSize: 12, color: C.muted, margin: 0, fontFamily: PJS }}>Tap to take or upload selfie</p>
            </div>
            <input id="selfie-up" type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
          </GlassCard>
        )}

        {loading && <AnalysisLoader progress={Math.round(progress)} C={C} />}

        {error && !loading && (
          <GlassCard C={C} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8, fontFamily: PJS }}>Analysis Failed</p>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 24, fontFamily: PJS }}>{error}</p>
            <button onClick={handleReset} style={{ padding: '12px 24px', borderRadius: 12, background: GRAD, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Try Again</button>
          </GlassCard>
        )}

        {results && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeSlideIn 0.4s ease' }}>
            {/* Mesh visualization */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', borderRadius: 24, overflow: 'hidden', border: `3px solid ${C.border2}` }}>
              <img src={previewUrl} alt="Analysis" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <GeometricOverlay landmarks={results.face_shape?.landmarks} width={800} height={1000} C={C} />
              <div style={{ position: 'absolute', top: 16, right: 16 }}>
                <Badge color={VIOLET}>High-Tech Scan OK</Badge>
              </div>
            </div>

            <GlassCard C={C}>
               <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 32 }}>{results.face_shape?.icon}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text, fontFamily: PJS }}>{results.face_shape?.display} Shape</h3>
                    <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: PJS }}>{Math.round((results.face_shape?.confidence || 0) * 100)}% Accuracy</p>
                  </div>
               </div>
               <p style={{ margin: 0, fontSize: 13, color: C.text2, lineHeight: 1.6, fontFamily: PJS }}>{results.face_shape?.description}</p>
            </GlassCard>

            <BeardStylist recommendations={results.beard_recommendations} C={C} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {results.hairstyle_recommendations?.map((rec, i) => (
                <div key={i} style={{ background: C.glass, borderRadius: 18, border: `1px solid ${C.border}`, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Badge>{rec.name}</Badge>
                    <DifficultyDot level="Medium" />
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: C.text2, lineHeight: 1.5, fontFamily: PJS }}>{rec.reason}</p>
                </div>
              ))}
            </div>

            <button onClick={handleReset} style={{ width: '100%', padding: 16, borderRadius: 14, background: GRAD, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Scan New Photo</button>
          </div>
        )}

        {showAdModal && (
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
        )}

        {loading && progress > 0 && progress < 100 && !results && (
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
        )}
      </div>
    </>
  );
}
