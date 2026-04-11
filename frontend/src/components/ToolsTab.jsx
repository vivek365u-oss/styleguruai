import { useState, useContext, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { ThemeContext } from '../context/ThemeContext';
import OutfitChecker from './OutfitChecker';
import CommunityFeed from './CommunityFeed';
import HistoryPanel from './HistoryPanel';
import StyleBot from './StyleBot';
import OutfitCalendar from './OutfitCalendar';
import WardrobePanel from './WardrobePanel';
import { getWardrobe, auth } from '../api/styleApi';
import { FashionIcons, IconRenderer } from './Icons';
import { getThemeColors, GRAD, VIOLET, PJS, PDI } from '../utils/themeColors';

// ── Shared Card Helper ──
const cardStyle = (C) => ({
  background: C.glass,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${C.border}`,
  borderRadius: 20,
  boxShadow: C.cardShadow,
  overflow: 'hidden',
  transition: 'all 0.2s ease'
});

// ── Color Contrast Checker ──
function ColorContrastChecker({ C }) {
  const [color1, setColor1] = useState('#8B5CF6');
  const [color2, setColor2] = useState('#F0EDE6');
  const [open, setOpen] = useState(false);

  const { t } = useLanguage();
  
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };
  
  const luminance = ([r, g, b]) => {
    const [rs, gs, bs] = [r, g, b].map(c => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const contrast = () => {
    const l1 = luminance(hexToRgb(color1)), l2 = luminance(hexToRgb(color2));
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return ratio.toFixed(1);
  };
  
  const ratio = parseFloat(contrast());
  const grade = ratio >= 7 ? { label: 'AAA ✓', color: '#10B981' } : ratio >= 4.5 ? { label: 'AA ✓', color: '#10B981' } : ratio >= 3 ? { label: 'AA Large ⚠️', color: '#F59E0B' } : { label: 'Fail ✗', color: C.dangerText };
  const verdict = ratio >= 4.5 ? t('greatCombo') : ratio >= 3 ? t('okayForLarge') : t('poorContrast');

  return (
    <div style={{ ...cardStyle(C), marginBottom: 24 }}>
      <button 
        onClick={() => setOpen(o => !o)} 
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: open ? C.glass2 : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = C.glass2; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = open ? C.glass2 : 'transparent'; }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, color: VIOLET, background: `${VIOLET}15`, borderRadius: 10 }}>
          <IconRenderer icon={FashionIcons.Analysis} />
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: PJS, fontSize: '14px', fontWeight: 700, color: C.text, margin: '0 0 2px' }}>{t('contrastChecker')}</p>
          <p style={{ fontFamily: PJS, fontSize: '11px', color: C.muted, margin: 0 }}>{t('contrastDesc')}</p>
        </div>
        <span style={{ fontSize: '10px', color: C.muted }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, margin: '0 0 6px', fontFamily: PJS }}>{t('color1')}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.glass2, padding: 8, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <input type="color" value={color1} onChange={e => setColor1(e.target.value)} style={{ width: 30, height: 30, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }} />
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: C.text }}>{color1}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, margin: '0 0 6px', fontFamily: PJS }}>{t('color2')}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.glass2, padding: 8, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <input type="color" value={color2} onChange={e => setColor2(e.target.value)} style={{ width: 30, height: 30, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }} />
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: C.text }}>{color2}</span>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '16px', borderRadius: 12, backgroundColor: color1, color: color2, textAlign: 'center', fontSize: '14px', fontWeight: 700, fontFamily: PJS, marginBottom: 16, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
            {t('sampleText')}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.glass2, padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, margin: '0 0 4px', fontFamily: PJS }}>{t('contrastRatio')}</p>
              <p style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0, fontFamily: PJS }}>{ratio}:1</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: grade.color, margin: '0 0 2px', fontFamily: PJS }}>{grade.label}</p>
              <p style={{ fontSize: '11px', color: C.muted, margin: 0, fontFamily: PJS }}>{verdict}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Trending Card ──
function TrendingCard({ item, C, AMAZON_TAG }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const kw = encodeURIComponent(item.category);
  const amzUrl = `https://www.amazon.in/s?k=${kw}&rh=n%3A1968024031&sort=review-rank&tag=${AMAZON_TAG}`;

  const shopOptions = [
    { name: 'Amazon',   url: amzUrl,            icon: FashionIcons.Shopping, color: '#f97316' },
    { name: 'Flipkart', url: item.flipkartUrl,  icon: FashionIcons.Shopping, color: '#3b82f6' },
    { name: 'Myntra',   url: item.myntraUrl,    icon: FashionIcons.Dress,    color: '#ec4899' },
    { name: 'Meesho',   url: `https://meesho.com/search?q=${encodeURIComponent(item.meeshoQ)}`, icon: FashionIcons.Shopping, color: '#a855f7' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px',
          background: open ? `${VIOLET}10` : C.glass,
          border: `1px solid ${open ? `${VIOLET}50` : C.border}`,
          borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: open ? `0 4px 12px ${VIOLET}20` : 'none'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, color: VIOLET }}>
          <IconRenderer icon={item.icon || FashionIcons.Shirt} />
        </span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: C.text, fontFamily: PJS, textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
        <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: item.gender === 'male' ? '#3b82f615' : '#ec489915', color: item.gender === 'male' ? '#3b82f6' : '#ec4899', fontFamily: PJS }}>
          {item.tag}
        </span>
      </button>

      {open && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.95 }}
              style={{ width: '100%', maxWidth: 400, background: C.isDark ? '#0A0F1C' : '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 24, padding: 24, boxShadow: '0 24px 48px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: '20px', fontFamily: PDI, color: C.text, margin: 0 }}>{t('shopOn')}</h3>
                <p style={{ fontSize: '12px', color: C.muted, fontFamily: PJS, margin: '4px 0 0' }}>{item.label}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {shopOptions.map(opt => (
                  <a
                    key={opt.name} href={opt.url} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
                    style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px', borderRadius: 16, border: `1px solid ${opt.color}30`, background: `${opt.color}10`, color: opt.color, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${opt.color}20`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconRenderer icon={opt.icon} /></span>
                    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: PJS }}>{opt.name}</span>
                  </a>
                ))}
              </div>

              <button
                onClick={() => setOpen(false)}
                style={{ width: '100%', marginTop: 24, padding: '12px', background: 'transparent', border: 'none', color: C.muted, fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: PJS }}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ── Main ToolsTab Component ──
function ToolsTab({ onOpenScanner, analysisData, onShowResult }) {
  const { t } = useLanguage();
  const { theme } = useContext(ThemeContext);
  const C = useMemo(() => getThemeColors(theme), [theme]);
  
  const [activeTool, setActiveTool] = useState(null);
  const [wardrobe, setWardrobe] = useState([]);

  useEffect(() => {
    if (auth.currentUser) {
      getWardrobe(auth.currentUser.uid).then(setWardrobe);
    }
  }, []);

  const trendingStyles = [
    { icon: FashionIcons.Shirt, label: 'Oversized Tee', tag: '🔥 Male', gender: 'male', category: 'oversized tshirt', myntraUrl: 'https://www.myntra.com/men-oversized-tshirt', flipkartUrl: 'https://www.flipkart.com/search?q=men+oversized+tshirt', meeshoQ: 'men oversized tshirt' },
    { icon: FashionIcons.Trousers, label: 'Cargo Pants', tag: '🔥 Male', gender: 'male', category: 'cargo pants', myntraUrl: 'https://www.myntra.com/men-cargo-pants', flipkartUrl: 'https://www.flipkart.com/search?q=men+cargo+pants', meeshoQ: 'men cargo pants' },
    { icon: FashionIcons.Formal, label: 'Co-ord Set', tag: '🔥 Male', gender: 'male', category: 'men coord set', myntraUrl: 'https://www.myntra.com/men-coord-set', flipkartUrl: 'https://www.flipkart.com/search?q=men+coord+set', meeshoQ: 'men coord set' },
    { icon: FashionIcons.Analysis, label: 'Coord Set', tag: '🔥 Female', gender: 'female', category: 'women coord set', myntraUrl: 'https://www.myntra.com/women-coord-set', flipkartUrl: 'https://www.flipkart.com/search?q=women+coord+set', meeshoQ: 'women coord set' },
    { icon: FashionIcons.Dress, label: 'Maxi Dress', tag: '🔥 Female', gender: 'female', category: 'women maxi dress', myntraUrl: 'https://www.myntra.com/women-maxi-dress', flipkartUrl: 'https://www.flipkart.com/search?q=women+maxi+dress', meeshoQ: 'women maxi dress' },
    { icon: FashionIcons.Shirt, label: 'Kurti Set', tag: '🔥 Female', gender: 'female', category: 'women kurti set', myntraUrl: 'https://www.myntra.com/women-kurti-set', flipkartUrl: 'https://www.flipkart.com/search?q=women+kurti+set', meeshoQ: 'women kurti set' },
  ];

  const primaryTools = [
    { id: 'stylebot', icon: FashionIcons.AI, title: t('aiStyleBot'), desc: t('styleBotDesc'), grad: ['#581c8740', '#312e8140'], border: '#a855f730', color: '#a855f7' },
    { id: 'outfit', icon: FashionIcons.Shirt, title: t('outfitChecker'), desc: t('outfitCheckerDesc'), grad: ['#1e3a8a40', '#164e6340'], border: '#3b82f630', color: '#3b82f6' },
    { id: 'calendar', icon: FashionIcons.Watch, title: t('aiCalendar'), desc: t('calendarDesc'), grad: ['#78350f40', '#7c2d1240'], border: '#f59e0b30', color: '#f59e0b' },
    { id: 'wardrobe', icon: FashionIcons.Wardrobe, title: t('navWardrobe'), desc: t('wardrobeDesc'), grad: ['#88133740', '#88133740'], border: '#ec489930', color: '#ec4899' },
  ];

  const BackBtn = () => (
    <button onClick={() => setActiveTool(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: C.text, fontSize: '13px', fontWeight: 700, fontFamily: PJS, padding: '12px 0 16px', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.8}>
      ← {t('backTools')}
    </button>
  );

  if (activeTool === 'outfit') return ( <div style={{ animation: 'fadeSlideIn 0.3s ease' }}><BackBtn /><OutfitChecker /></div> );
  if (activeTool === 'community') return ( <div style={{ animation: 'fadeSlideIn 0.3s ease' }}><BackBtn /><CommunityFeed /></div> );
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
        const rec = data?.analysis?.recommendations || data?.recommendations || {};
        return [...(rec.best_shirt_colors || rec.best_dress_colors || rec.seasonal_colors || []), ...(rec.best_top_colors || [])].filter((c, i, a) => a.findIndex(x => x.hex === c.hex) === i);
      })()}
      pantColors={(() => {
        const data = analysisData || JSON.parse(localStorage.getItem('sg_last_analysis') || 'null')?.fullData;
        const rec = data?.analysis?.recommendations || data?.recommendations || {};
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
      <WardrobePanel onShowResult={onShowResult} gender={(() => { const data = analysisData || JSON.parse(localStorage.getItem('sg_last_analysis') || 'null')?.fullData; return data?.gender || 'male'; })()} />
    </div>
  );

  return (
    <div style={{ paddingTop: 8, animation: 'fadeSlideIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ width: 32, height: 32, color: VIOLET, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconRenderer icon={FashionIcons.Settings} /></span>
        <h2 style={{ fontFamily: PDI, fontSize: '28px', color: C.text, margin: 0 }}>{t('toolsHeader')}</h2>
      </div>

      {/* Primary Tool Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {primaryTools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px',
              background: C.isDark ? `linear-gradient(135deg, ${tool.grad[0]}, ${tool.grad[1]})` : C.glass,
              border: `1px solid ${C.isDark ? tool.border : C.border}`,
              borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: C.cardShadow
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.border = `1px solid ${tool.color}50`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.border = `1px solid ${C.isDark ? tool.border : C.border}`; }}
          >
            <span style={{ width: 40, height: 40, color: tool.color, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconRenderer icon={tool.icon} />
            </span>
            <span style={{ fontFamily: PJS, fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: 4 }}>{tool.title}</span>
            <span style={{ fontFamily: PJS, fontSize: '10px', color: C.muted, opacity: 0.8, textAlign: 'center' }}>{tool.desc}</span>
          </button>
        ))}

        <button
          onClick={() => onOpenScanner ? onOpenScanner() : null}
          style={{
            gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '24px',
            background: C.isDark ? 'linear-gradient(135deg, #064e3b40, #134e4a40)' : C.glass,
            border: `1px solid ${C.isDark ? '#10b98130' : C.border}`,
            borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: C.cardShadow
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.border = `1px solid #10b98150`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.border = `1px solid ${C.isDark ? '#10b98130' : C.border}`; }}
        >
          <span style={{ width: 48, height: 48, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconRenderer icon={FashionIcons.Camera} />
          </span>
          <div style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontFamily: PJS, fontSize: '18px', fontWeight: 700, color: C.text, marginBottom: 4 }}>{t('colorScanner')}</span>
            <span style={{ display: 'block', fontFamily: PJS, fontSize: '12px', color: C.muted, opacity: 0.8 }}>{t('scannerDesc')}</span>
          </div>
        </button>
      </div>

      <ColorContrastChecker C={C} />

      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '0 4px' }}>
          <span style={{ width: 20, height: 20, color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconRenderer icon={FashionIcons.AI} /></span>
          <h3 style={{ fontFamily: PDI, fontSize: '20px', color: C.text, margin: 0 }}>{t('trendingNow')}</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
          {trendingStyles.map((s) => (
            <TrendingCard key={s.label} item={s} C={C} AMAZON_TAG="styleguruai-21" />
          ))}
        </div>
      </div>

    </div>
  );
}

export default ToolsTab;
