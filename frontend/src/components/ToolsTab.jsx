import { useState, useContext, useEffect, useMemo } from 'react';
import { useLanguage }    from '../i18n/LanguageContext';
import { ThemeContext }   from '../context/ThemeContext';
import OutfitChecker      from './OutfitChecker';
import StyleBot           from './StyleBot';
import OutfitCalendar     from './OutfitCalendar';
import WardrobePanel      from './WardrobePanel';
import SelfieStyleAdvisor from './SelfieStyleAdvisor';
import { getWardrobe, auth } from '../api/styleApi';
import { FashionIcons, IconRenderer } from './Icons';
import { getThemeColors, GRAD, VIOLET, PJS, PDI } from '../utils/themeColors';

// ── Shared Card Helper ──────────────────────────────
const cardStyle = (C) => ({
  background: C.glass,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${C.border}`,
  borderRadius: 20,
  boxShadow: C.cardShadow,
  overflow: 'hidden',
  transition: 'all 0.2s ease',
});

function ColorContrastChecker({ C }) {
  const [color1, setColor1] = useState('#8B5CF6');
  const [color2, setColor2] = useState('#F0EDE6');
  const { t } = useLanguage();

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16),
          g = parseInt(hex.slice(3, 5), 16),
          b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const luminance = ([r, g, b]) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const contrast = () => {
    const l1 = luminance(hexToRgb(color1)), l2 = luminance(hexToRgb(color2));
    return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(1);
  };

  const ratio   = parseFloat(contrast());
  const grade   = ratio >= 7   ? { label: 'AAA ✓',       color: '#10B981' }
                : ratio >= 4.5 ? { label: 'AA ✓',        color: '#10B981' }
                : ratio >= 3   ? { label: 'AA Large ⚠️', color: '#F59E0B' }
                :                { label: 'Fail ✗',       color: C.dangerText };
  const verdict = ratio >= 4.5 ? t('greatCombo')
                : ratio >= 3   ? t('okayForLarge')
                :                t('poorContrast');

  return (
    <div style={{ ...cardStyle(C), padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, color: '#64748b', background: '#64748b15', borderRadius: 12 }}>
          <IconRenderer icon={FashionIcons.Analysis} />
        </span>
        <div>
          <h3 style={{ margin: 0, fontFamily: PDI, fontSize: '20px', color: C.text }}>{t('contrastChecker')}</h3>
          <p style={{ margin: '4px 0 0', fontFamily: PJS, fontSize: '12px', color: C.muted }}>{t('contrastDesc')}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        {[[color1, setColor1, t('color1')], [color2, setColor2, t('color2')]].map(([val, setter, lbl]) => (
          <div key={lbl} style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, margin: '0 0 6px', fontFamily: PJS }}>{lbl}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.glass2, padding: 8, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <input type="color" value={val} onChange={e => setter(e.target.value)} style={{ width: 30, height: 30, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }} />
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: C.text }}>{val}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px', borderRadius: 12, backgroundColor: color1, color: color2, textAlign: 'center', fontSize: '16px', fontWeight: 700, fontFamily: PJS, marginBottom: 24, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
        {t('sampleText')}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.glass2, padding: '16px 20px', borderRadius: 12, border: `1px solid ${C.border}` }}>
        <div>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, margin: '0 0 4px', fontFamily: PJS }}>{t('contrastRatio')}</p>
          <p style={{ fontSize: '22px', fontWeight: 800, color: C.text, margin: 0, fontFamily: PJS }}>{ratio}:1</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: grade.color, margin: '0 0 2px', fontFamily: PJS }}>{grade.label}</p>
          <p style={{ fontSize: '12px', color: C.muted, margin: 0, fontFamily: PJS }}>{verdict}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main ToolsTab Component ─────────────────────────
function ToolsTab({ onOpenScanner, analysisData, onShowResult }) {
  const { t }   = useLanguage();
  const { theme } = useContext(ThemeContext);
  const C         = useMemo(() => getThemeColors(theme), [theme]);

  const [activeTool, setActiveTool] = useState(null);
  const [wardrobe,   setWardrobe]   = useState([]);

  useEffect(() => {
    if (auth.currentUser) getWardrobe(auth.currentUser.uid).then(setWardrobe);
  }, []);

  const primaryTools = [
    { id: 'stylist',  icon: FashionIcons.Star,      title: 'AI Stylist',          desc: 'Face shape & hairstyle recs',    grad: ['#7c3aed40','#5b21b640'], border: '#8b5cf630', color: '#8b5cf6' },
    { id: 'stylebot', icon: FashionIcons.AI,        title: t('aiStyleBot'),       desc: t('styleBotDesc'),                grad: ['#581c8740','#312e8140'], border: '#a855f730', color: '#a855f7' },
    { id: 'outfit',   icon: FashionIcons.Shirt,     title: t('outfitChecker'),    desc: t('outfitCheckerDesc'),           grad: ['#1e3a8a40','#164e6340'], border: '#3b82f630', color: '#3b82f6' },
    { id: 'calendar', icon: FashionIcons.Watch,     title: t('aiCalendar'),       desc: t('calendarDesc'),                grad: ['#78350f40','#7c2d1240'], border: '#f59e0b30', color: '#f59e0b' },
    { id: 'wardrobe', icon: FashionIcons.Wardrobe,  title: t('navWardrobe'),      desc: t('wardrobeDesc'),                grad: ['#88133740','#88133740'], border: '#ec489930', color: '#ec4899' },
    { id: 'scanner',  icon: FashionIcons.Camera,    title: t('colorScanner'),     desc: t('scannerDesc'),                 grad: ['#064e3b40','#134e4a40'], border: '#10b98130', color: '#10b981' },
    { id: 'contrast', icon: FashionIcons.Analysis,  title: t('contrastChecker'),  desc: t('contrastDesc'),                grad: ['#0f172a40','#1e293b40'], border: '#64748b30', color: '#64748b' },
  ];

  const BackBtn = () => (
    <button
      onClick={() => setActiveTool(null)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: C.text, fontSize: '13px', fontWeight: 700, fontFamily: PJS, padding: '12px 0 16px', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = 1}
      onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
    >
      ← {t('backTools')}
    </button>
  );

  // ── Active tool views ───────────────
  if (activeTool === 'stylist')  return (
    <div style={{ animation: 'fadeSlideIn 0.3s ease' }}>
      <BackBtn />
      <SelfieStyleAdvisor />
    </div>
  );
  if (activeTool === 'outfit')   return ( <div style={{ animation: 'fadeSlideIn 0.3s ease' }}><BackBtn /><OutfitChecker /></div> );
  if (activeTool === 'stylebot') return (
    <div style={{ animation: 'fadeSlideIn 0.3s ease', display: 'flex', flexDirection: 'column', height: '80vh' }}>
      <BackBtn />
      <div style={{ ...cardStyle(C), flex: 1, display: 'flex', flexDirection: 'column' }}>
        <StyleBot isDark={C.isDark} inline={true} />
      </div>
    </div>
  );
  if (activeTool === 'calendar') return (
    <OutfitCalendar
      isDark={C.isDark}
      onClose={() => setActiveTool(null)}
      bestColors={(() => {
        const data = analysisData || JSON.parse(localStorage.getItem('sg_last_analysis') || 'null')?.fullData;
        const rec  = data?.analysis?.recommendations || data?.recommendations || {};
        return [...(rec.best_shirt_colors || rec.best_dress_colors || rec.seasonal_colors || []), ...(rec.best_top_colors || [])].filter((c, i, a) => a.findIndex(x => x.hex === c.hex) === i);
      })()}
      pantColors={(() => {
        const data = analysisData || JSON.parse(localStorage.getItem('sg_last_analysis') || 'null')?.fullData;
        const rec  = data?.analysis?.recommendations || data?.recommendations || {};
        return rec.best_pant_colors || rec.best_bottom_colors || [];
      })()}
      gender={(() => {
        const data = analysisData || JSON.parse(localStorage.getItem('sg_last_analysis') || 'null')?.fullData;
        return data?.gender || 'male';
      })()}
      wardrobe={wardrobe}
    />
  );
  if (activeTool === 'wardrobe') return (
    <div style={{ animation: 'fadeSlideIn 0.3s ease', paddingBottom: 40 }}>
      <BackBtn />
      <WardrobePanel
        onShowResult={onShowResult}
        gender={(() => {
          const data = analysisData || JSON.parse(localStorage.getItem('sg_last_analysis') || 'null')?.fullData;
          return data?.gender || 'male';
        })()}
      />
    </div>
  );
  if (activeTool === 'contrast') return (
    <div style={{ animation: 'fadeSlideIn 0.3s ease', paddingBottom: 40 }}>
      <BackBtn />
      <ColorContrastChecker C={C} />
    </div>
  );

  // ── Main Tools Grid ─────────────────
  return (
    <div style={{ paddingTop: 8, animation: 'fadeSlideIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ width: 32, height: 32, color: VIOLET, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconRenderer icon={FashionIcons.Settings} />
        </span>
        <h2 style={{ fontFamily: PDI, fontSize: '28px', color: C.text, margin: 0 }}>{t('toolsHeader')}</h2>
      </div>

      {/* Primary Tool Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {primaryTools.map(tool => (
          <button
            key={tool.id}
            onClick={() => {
              if (tool.id === 'scanner') {
                onOpenScanner?.();
              } else {
                setActiveTool(tool.id);
              }
            }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px',
              background: C.isDark ? `linear-gradient(135deg, ${tool.grad[0]}, ${tool.grad[1]})` : C.glass,
              border: `1px solid ${C.isDark ? tool.border : C.border}`,
              borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: C.cardShadow,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.border = `1px solid ${tool.color}50`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.border = `1px solid ${C.isDark ? tool.border : C.border}`; }}
          >
            <span style={{ width: 40, height: 40, color: tool.color, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconRenderer icon={tool.icon} />
            </span>
            <span style={{ fontFamily: PJS, fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: 4 }}>{tool.title}</span>
            <span style={{ fontFamily: PJS, fontSize: '10px', color: C.muted, opacity: 0.8, textAlign: 'center' }}>{tool.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ToolsTab;
