import { useState, useContext, useEffect } from 'react';
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

function ColorContrastChecker({ isDark }) {
  const [color1, setColor1] = useState('#6d28d9');
  const [color2, setColor2] = useState('#f9a8d4');
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
  const grade = ratio >= 7 ? { label: 'AAA ✓', color: 'text-green-400' } : ratio >= 4.5 ? { label: 'AA ✓', color: 'text-green-400' } : ratio >= 3 ? { label: 'AA Large ⚠️', color: 'text-yellow-400' } : { label: 'Fail ✗', color: 'text-red-400' };
  const verdict = ratio >= 4.5 ? t('greatCombo') : ratio >= 3 ? t('okayForLarge') : t('poorContrast');

  return (
    <div className={`rounded-3xl border overflow-hidden glass-card-premium`}>
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center gap-3 p-5 transition hover:bg-white/5`}>
        <span className="w-8 h-8 flex items-center justify-center text-purple-500">
          <IconRenderer icon={FashionIcons.Analysis} />
        </span>
        <div className="flex-1 text-left">
          <p className="font-bold text-sm">{t('contrastChecker')}</p>
          <p className="text-xs opacity-60">{t('contrastDesc')}</p>
        </div>
        <span className="text-xs opacity-40 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 border-t border-[var(--border-primary)] overflow-hidden"
          >
            <div className="flex gap-3 mt-4 mb-4">
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">{t('color1')}</p>
                <div className="flex items-center gap-2">
                  <input type="color" value={color1} onChange={e => setColor1(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent ring-1 ring-white/10" />
                  <span className="text-xs font-mono opacity-60">{color1.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">{t('color2')}</p>
                <div className="flex items-center gap-2">
                  <input type="color" value={color2} onChange={e => setColor2(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent ring-1 ring-white/10" />
                  <span className="text-xs font-mono opacity-60">{color2.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-6 mb-4 flex items-center justify-center text-base font-black shadow-inner border border-white/5" style={{ backgroundColor: color1, color: color2 }}>
              {t('sampleText')}
            </div>
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{t('contrastRatio')}</p>
                <p className="font-black text-2xl">{ratio}:1</p>
              </div>
              <div className="text-right">
                <p className={`font-black text-sm uppercase tracking-widest ${grade.color}`}>{grade.label}</p>
                <p className="text-[10px] font-bold opacity-60">{verdict}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TrendingCard({ item, isDark, AMAZON_TAG }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const kw = encodeURIComponent(item.category);
  const amzUrl = `https://www.amazon.in/s?k=${kw}&rh=n%3A1968024031&sort=review-rank&tag=${AMAZON_TAG}`;

  const shopOptions = [
    { name: 'Amazon', url: amzUrl, icon: FashionIcons.Shopping, bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
    { name: 'Flipkart', url: item.flipkartUrl, icon: FashionIcons.Shopping, bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
    { name: 'Myntra', url: item.myntraUrl, icon: FashionIcons.Dress, bg: 'bg-pink-500/10 border-pink-500/20 text-pink-400' },
    { name: 'Meesho', url: `https://meesho.com/search?q=${encodeURIComponent(item.meeshoQ)}`, icon: FashionIcons.Shopping, bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex flex-col items-center gap-2 rounded-2xl p-4 transition-all active:scale-95 glass-card-premium ${open ? 'ring-2 ring-purple-500/50 bg-purple-500/5' : ''}`}
      >
        <div className="w-10 h-10 flex items-center justify-center text-purple-500 mb-1">
          <IconRenderer icon={item.icon || FashionIcons.Shirt} />
        </div>
        <span className="text-[11px] font-black uppercase tracking-tight leading-tight opacity-90">{item.label}</span>
        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${item.gender === 'male' ? 'text-blue-400 bg-blue-400/10' : 'text-pink-400 bg-pink-400/10'}`}>{item.tag}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.95 }}
              className="w-full max-w-sm glass-card-premium rounded-[3rem] p-8 shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-purple-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 text-purple-500">
                  <IconRenderer icon={item.icon || FashionIcons.Shirt} />
                </div>
                <h3 className="text-2xl font-black">{t('shopOn')}</h3>
                <p className="text-xs opacity-50 mt-1 uppercase tracking-widest font-bold">{item.label}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {shopOptions.map(opt => (
                  <a
                    key={opt.name}
                    href={opt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.05] active:scale-95 ${opt.bg}`}
                  >
                    <span className="w-6 h-6"><IconRenderer icon={opt.icon} /></span>
                    <span>{opt.name}</span>
                  </a>
                ))}
              </div>

              <button
                onClick={() => setOpen(false)}
                className="w-full mt-8 py-2 text-[10px] font-black uppercase tracking-[0.3em] opacity-30 hover:opacity-100 transition-opacity"
              >
                Close Hub
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ToolsTab({ onOpenScanner, analysisData, onShowResult }) {
  const { t } = useLanguage();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
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

  if (activeTool === 'outfit') {
    return (
      <div className="space-y-4 pt-2">
        <button onClick={() => setActiveTool(null)} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-50 hover:opacity-100 transition">
          ← {t('backTools')}
        </button>
        <OutfitChecker />
      </div>
    );
  }

  if (activeTool === 'stylebot') {
    return (
      <div className="space-y-4 pt-2">
        <button onClick={() => setActiveTool(null)} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-50 hover:opacity-100 transition">
          ← {t('backTools')}
        </button>
        <div className="rounded-[2.5rem] h-[75vh] flex flex-col overflow-hidden glass-card-premium">
          <StyleBot isDark={isDark} inline={true} />
        </div>
      </div>
    );
  }

  if (activeTool === 'calendar') {
    return (
      <OutfitCalendar
        isDark={isDark}
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
  }

  if (activeTool === 'wardrobe') {
    return (
      <div className="space-y-4 pt-2 pb-10">
        <button onClick={() => setActiveTool(null)} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-50 hover:opacity-100 transition">
          ← {t('backTools')}
        </button>
        <WardrobePanel onShowResult={onShowResult} gender={ (analysisData || JSON.parse(localStorage.getItem('sg_last_analysis') || 'null')?.fullData)?.gender || 'male' } />
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
             <IconRenderer icon={FashionIcons.Settings} />
          </div>
          <h2 className="text-3xl font-black">{t('toolsHeader')}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { id: 'stylebot', icon: FashionIcons.AI, label: t('aiStyleBot'), desc: t('styleBotDesc'), color: 'from-purple-500/20 to-indigo-500/20', text: 'text-purple-400' },
          { id: 'outfit', icon: FashionIcons.Shirt, label: t('outfitChecker'), desc: t('outfitCheckerDesc'), color: 'from-blue-500/20 to-cyan-500/20', text: 'text-blue-400' },
          { id: 'calendar', icon: FashionIcons.Watch, label: t('aiCalendar'), desc: t('calendarDesc'), color: 'from-amber-500/20 to-orange-500/20', text: 'text-amber-400' },
          { id: 'wardrobe', icon: FashionIcons.Wardrobe, label: t('navWardrobe'), desc: t('wardrobeDesc'), color: 'from-pink-500/20 to-rose-500/20', text: 'text-pink-400' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            className={`flex flex-col items-center justify-center p-6 rounded-[2.5rem] border border-white/10 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl bg-gradient-to-br ${t.color}`}
          >
            <div className={`w-12 h-12 mb-4 ${t.text}`}><IconRenderer icon={t.icon} /></div>
            <span className="font-black text-sm uppercase tracking-wider text-white mb-1">{t.label}</span>
            <span className="text-[9px] opacity-40 font-bold uppercase tracking-widest text-center px-2">{t.desc}</span>
          </button>
        ))}

        <button
          onClick={() => onOpenScanner?.()}
          className="col-span-2 flex items-center gap-6 p-6 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 transition-all hover:scale-[1.02] hover:shadow-2xl"
        >
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
             <IconRenderer icon={FashionIcons.Camera} />
          </div>
          <div className="text-left">
            <span className="font-black text-xl text-white block uppercase tracking-tight">{t('colorScanner')}</span>
            <span className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1 block">{t('scannerDesc')}</span>
          </div>
        </button>
      </div>

      <ColorContrastChecker isDark={isDark} />

      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="font-black text-xl uppercase tracking-tight">{t('trendingNow')}</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {trendingStyles.map((s) => (
            <TrendingCard key={s.label} item={s} isDark={isDark} AMAZON_TAG="styleguruai-21" />
          ))}
        </div>
      </div>
    </div>
  );
}
