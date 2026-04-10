import { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { ThemeContext } from '../context/ThemeContext';
import OutfitChecker from './OutfitChecker';
import CommunityFeed from './CommunityFeed';
import StyleBot from './StyleBot';
import OutfitCalendar from './OutfitCalendar';
import WardrobePanel from './WardrobePanel';
import GuruCollab from './GuruCollab';
import { getWardrobe, auth } from '../api/styleApi';
import { FashionIcons, IconRenderer } from './Icons';

// --- Extracted from Dashboard.jsx ---
function ColorContrastChecker({ isDark }) {
  const [color1, setColor1] = useState('#6d28d9');
  const [color2, setColor2] = useState('#f9a8d4');
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return [r,g,b];
  };
  const luminance = ([r,g,b]) => {
    const [rs,gs,bs] = [r,g,b].map(c => { const s = c/255; return s <= 0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055,2.4); });
    return 0.2126*rs + 0.7152*gs + 0.0722*bs;
  };
  const contrast = () => {
    const l1 = luminance(hexToRgb(color1)), l2 = luminance(hexToRgb(color2));
    return ((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)).toFixed(1);
  };
  const ratio = parseFloat(contrast());
  const grade = ratio >= 7 ? { label: 'AAA ✓', color: 'text-green-400' } : ratio >= 4.5 ? { label: 'AA ✓', color: 'text-green-400' } : ratio >= 3 ? { label: 'AA Large ⚠️', color: 'text-yellow-400' } : { label: 'Fail ✗', color: 'text-red-400' };

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center gap-3 p-4 transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
        <span className="w-8 h-8 flex items-center justify-center text-purple-500"><IconRenderer icon={FashionIcons.Analysis} /></span>
        <div className="flex-1 text-left">
          <p className="font-bold text-sm">{t('contrastChecker')}</p>
          <p className="text-xs opacity-60">{t('contrastDesc')}</p>
        </div>
        <span className="text-xs opacity-40">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-[var(--border-primary)]">
          <div className="flex gap-3 mt-3 mb-3">
            <div className="flex-1">
              <input type="color" value={color1} onChange={e => setColor1(e.target.value)} className="w-10 h-10 rounded-lg" />
              <span className="text-xs font-mono ml-2">{color1}</span>
            </div>
            <div className="flex-1">
              <input type="color" value={color2} onChange={e => setColor2(e.target.value)} className="w-10 h-10 rounded-lg" />
              <span className="text-xs font-mono ml-2">{color2}</span>
            </div>
          </div>
          <div className="rounded-xl p-4 mb-3 text-center font-bold" style={{ backgroundColor: color1, color: color2 }}>{t('sampleText')}</div>
          <div className="flex justify-between items-center">
            <p className="font-black text-lg">{ratio}:1</p>
            <p className={`font-bold text-sm ${grade.color}`}>{grade.label}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TrendingCard({ item, isDark, AMAZON_TAG }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const kw = encodeURIComponent(item.category);
  const amzUrl = `https://www.amazon.in/s?k=${kw}&tag=${AMAZON_TAG}`;

  const shopOptions = [
    { name: 'Amazon', url: amzUrl, icon: FashionIcons.Shopping, bg: 'bg-orange-500/10 text-orange-400' },
    { name: 'Myntra', url: item.myntraUrl, icon: FashionIcons.Dress, bg: 'bg-pink-500/10 text-pink-400' },
    { name: 'Flipkart', url: item.flipkartUrl, icon: FashionIcons.Shopping, bg: 'bg-blue-500/10 text-blue-400' },
  ];

  return (
    <div className="relative">
      <button onClick={() => setOpen(true)} className={`w-full flex flex-col items-center gap-2 border rounded-2xl p-3 bg-[var(--bg-accent)]`}>
        <span className="w-8 h-8 text-purple-500"><IconRenderer icon={item.icon || FashionIcons.Shirt} /></span>
        <span className="text-xs font-semibold leading-tight">{item.label}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60" onClick={() => setOpen(false)}>
          <div className={`w-full max-w-sm rounded-3xl p-6 ${isDark ? 'bg-slate-900 border border-white/10' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
             <h3 className="text-lg font-black mb-4">Shop Best Sellers</h3>
             <div className="grid grid-cols-1 gap-3">
                {shopOptions.map(o => (
                  <a key={o.name} href={o.url} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-4 rounded-xl font-bold ${o.bg}`}>
                    <IconRenderer icon={o.icon} /> {o.name}
                  </a>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolsTab({ onOpenScanner, analysisData, onShowResult }) {
  const { t } = useLanguage();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [activeTool, setActiveTool] = useState(null); 
  const [wardrobe, setWardrobe] = useState([]);

  useEffect(() => {
    if (auth.currentUser) getWardrobe(auth.currentUser.uid).then(setWardrobe);
  }, []);

  const trendingStyles = [
    { icon: FashionIcons.Shirt, label: 'Silk Sherwani', tag: '💍 Groom', category: 'men sherwani', myntraUrl: 'https://www.myntra.com/men-sherwani', flipkartUrl: 'https://www.flipkart.com/search?q=men+sherwani' },
    { icon: FashionIcons.Dress, label: 'Floral Lehenga', tag: '💍 Bride', category: 'bridal lehenga', myntraUrl: 'https://www.myntra.com/women-lehenga', flipkartUrl: 'https://www.flipkart.com/search?q=women+lehenga' },
    { icon: FashionIcons.Formal, label: 'Mod-Kurta', tag: '🔥 Haldi', category: 'men yellow kurta', myntraUrl: 'https://www.myntra.com/men-yellow-kurta', flipkartUrl: 'https://www.flipkart.com/search?q=men+yellow+kurta' },
  ];

  if (activeTool === 'stylebot') return <div className="p-4"><button onClick={() => setActiveTool(null)}>← {t('backTools')}</button><div className="h-[70vh] border rounded-2xl mt-4"><StyleBot inline={true} isDark={isDark} /></div></div>;
  if (activeTool === 'outfit') return <div className="p-4"><button onClick={() => setActiveTool(null)}>← {t('backTools')}</button><OutfitChecker /></div>;
  if (activeTool === 'calendar') return <OutfitCalendar isDark={isDark} onClose={() => setActiveTool(null)} wardrobe={wardrobe} />;
  if (activeTool === 'wardrobe') return <div className="p-4"><button onClick={() => setActiveTool(null)}>← {t('backTools')}</button><WardrobePanel onShowResult={onShowResult} /></div>;

  return (
    <div className="space-y-10 pt-2 pb-10">
      <GuruCollab />
      
      <div className="space-y-8">
        <h2 className="text-2xl font-black">{t('toolsHeader')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setActiveTool('stylebot')} className="p-6 rounded-3xl border border-purple-500/30 bg-purple-500/5 flex flex-col items-center">
            <span className="w-10 h-10 mb-2 text-purple-500"><IconRenderer icon={FashionIcons.AI} /></span>
            <span className="font-bold text-sm">AI StyleBot</span>
          </button>
          <button onClick={() => setActiveTool('outfit')} className="p-6 rounded-3xl border border-blue-500/30 bg-blue-500/5 flex flex-col items-center">
            <span className="w-10 h-10 mb-2 text-blue-500"><IconRenderer icon={FashionIcons.Shirt} /></span>
            <span className="font-bold text-sm">Outfit Check</span>
          </button>
          <button onClick={() => setActiveTool('calendar')} className="p-6 rounded-3xl border border-amber-500/30 bg-amber-500/5 flex flex-col items-center">
            <span className="w-10 h-10 mb-2 text-amber-500"><IconRenderer icon={FashionIcons.Watch} /></span>
            <span className="font-bold text-sm">Calendar</span>
          </button>
          <button onClick={() => setActiveTool('wardrobe')} className="p-6 rounded-3xl border border-pink-500/30 bg-pink-500/5 flex flex-col items-center">
            <span className="w-10 h-10 mb-2 text-pink-500"><IconRenderer icon={FashionIcons.Wardrobe} /></span>
            <span className="font-bold text-sm">Wardrobe</span>
          </button>
        </div>

        <ColorContrastChecker isDark={isDark} />

        <div className="pt-6">
          <h3 className="font-black text-lg mb-4">Trending Collections</h3>
          <div className="grid grid-cols-3 gap-3">
            {trendingStyles.map(s => <TrendingCard key={s.label} item={s} isDark={isDark} AMAZON_TAG="styleguruai-21" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ToolsTab;
