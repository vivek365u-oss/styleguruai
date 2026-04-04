import { useState, useContext } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ThemeContext } from '../App';
import OutfitChecker from './OutfitChecker';
import CommunityFeed from './CommunityFeed';
import HistoryPanel from './HistoryPanel';
import StyleBot from './StyleBot';
import OutfitCalendar from './OutfitCalendar';

// --- Extracted from Dashboard.jsx ---
function ColorContrastChecker({ isDark }) {
  const [color1, setColor1] = useState('#6d28d9');
  const [color2, setColor2] = useState('#f9a8d4');
  const [open, setOpen] = useState(false);

  const { t, language } = useLanguage();
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
    const ratio = (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
    return ratio.toFixed(1);
  };
  const ratio = parseFloat(contrast());
  const grade = ratio >= 7 ? { label: 'AAA ✓', color: 'text-green-400' } : ratio >= 4.5 ? { label: 'AA ✓', color: 'text-green-400' } : ratio >= 3 ? { label: 'AA Large ⚠️', color: 'text-yellow-400' } : { label: 'Fail ✗', color: 'text-red-400' };
  const verdict = ratio >= 4.5 ? t('greatCombo') : ratio >= 3 ? t('okayForLarge') : t('poorContrast');

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 transition hover:bg-white/5">
        <span className="text-2xl">🎨</span>
        <div className="flex-1 text-left">
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('contrastChecker')}</p>
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('contrastDesc')}</p>
        </div>
        <span className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className={`px-4 pb-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
          <div className="flex gap-3 mt-3 mb-3">
            <div className="flex-1">
              <p className={`text-xs mb-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('color1')}</p>
              <div className="flex items-center gap-2">
                <input type="color" value={color1} onChange={e => setColor1(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                <span className={`text-xs font-mono ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{color1}</span>
              </div>
            </div>
            <div className="flex-1">
              <p className={`text-xs mb-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('color2')}</p>
              <div className="flex items-center gap-2">
                <input type="color" value={color2} onChange={e => setColor2(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                <span className={`text-xs font-mono ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{color2}</span>
              </div>
            </div>
          </div>
          {/* Preview */}
          <div className="rounded-xl p-4 mb-3 flex items-center justify-center text-sm font-bold" style={{ backgroundColor: color1, color: color2 }}>
            {t('sampleText')}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('contrastRatio')}</p>
              <p className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{ratio}:1</p>
            </div>
            <div className="text-right">
              <p className={`font-bold text-sm ${grade.color}`}>{grade.label}</p>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{verdict}</p>
            </div>
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
  const amzUrl = `https://www.amazon.in/s?k=${kw}&rh=n%3A1968024031&sort=review-rank&tag=${AMAZON_TAG}`;

  const shopOptions = [
    { name: '🛒 Amazon',   url: amzUrl, bg: isDark ? 'bg-orange-500/20 border-orange-500/30 text-orange-300 hover:bg-orange-500/40' : 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100' },
    { name: '🏪 Flipkart', url: item.flipkartUrl, bg: isDark ? 'bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/40' : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100' },
    { name: '👗 Myntra',   url: item.myntraUrl, bg: isDark ? 'bg-pink-500/20 border-pink-500/30 text-pink-300 hover:bg-pink-500/40' : 'bg-pink-50 border-pink-300 text-pink-700 hover:bg-pink-100' },
    { name: '🛍️ Meesho',  url: `https://meesho.com/search?q=${encodeURIComponent(item.meeshoQ)}`, bg: isDark ? 'bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/40' : 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex flex-col items-center gap-2 border rounded-2xl p-3 transition-all active:scale-95 ${
          open
            ? 'border-purple-500/60 bg-purple-500/10'
            : isDark ? 'bg-white/5 border-white/10 hover:border-purple-500/40 hover:bg-white/10' : 'bg-white border-purple-100 hover:border-purple-400 shadow-sm'
        }`}
      >
        <span className="text-3xl">{item.emoji}</span>
        <span className={`text-xs font-semibold text-center leading-tight ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{item.label}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.gender === 'male' ? isDark ? 'text-blue-400 bg-blue-500/10' : 'text-blue-700 bg-blue-100' : isDark ? 'text-pink-400 bg-pink-500/10' : 'text-pink-700 bg-pink-100'}`}>{item.tag}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`fixed bottom-20 left-3 right-3 z-50 rounded-2xl border p-4 shadow-2xl md:absolute md:bottom-auto md:top-full md:left-auto md:right-auto md:rounded-2xl md:border md:mt-1 md:w-56 md:p-3 ${isDark ? 'bg-slate-900 border-white/20' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-bold ${isDark ? 'text-white/60' : 'text-gray-500'}`}>{t('shopOn')}</p>
              <button onClick={() => setOpen(false)} className={`text-xs font-bold px-2 py-1 rounded-lg ${isDark ? 'text-white/40 hover:text-white bg-white/5' : 'text-gray-400 hover:text-gray-700 bg-gray-100'}`}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {shopOptions.map(opt => (
                <a key={opt.name} href={opt.url} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all hover:scale-[1.02] ${opt.bg}`}>
                  {opt.name}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
// ------------------------------------------

function ToolsTab({ onShowResult, onOpenScanner, uploadedImage, analysisData }) {
  const { t } = useLanguage();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [activeTool, setActiveTool] = useState(null); // 'outfit', 'community', 'stylebot', 'tryon'

  const trendingStyles = [
    { emoji: '👕', label: 'Oversized Tee', tag: '🔥 Male', gender: 'male', category: 'oversized tshirt streetwear', myntraUrl: 'https://www.myntra.com/tshirts?rawQuery=oversized%20tshirt%20men', flipkartUrl: 'https://www.flipkart.com/search?q=men+oversized+tshirt&sort=popularity_desc', meeshoQ: 'men oversized tshirt' },
    { emoji: '🪖', label: 'Cargo Pants', tag: '🔥 Male', gender: 'male', category: 'cargo pants men streetwear', myntraUrl: 'https://www.myntra.com/cargos?rawQuery=cargo%20pants%20men', flipkartUrl: 'https://www.flipkart.com/search?q=men+cargo+pants&sort=popularity_desc', meeshoQ: 'men cargo pants' },
    { emoji: '🎽', label: 'Co-ord Set', tag: '🔥 Male', gender: 'male', category: 'men coord set matching', myntraUrl: 'https://www.myntra.com/co-ords?rawQuery=men%20coord%20set', flipkartUrl: 'https://www.flipkart.com/search?q=men+coord+set&sort=popularity_desc', meeshoQ: 'men coord set' },
    { emoji: '✨', label: 'Coord Set', tag: '🔥 Female', gender: 'female', category: 'women coord set two piece', myntraUrl: 'https://www.myntra.com/co-ords?rawQuery=women%20coord%20set', flipkartUrl: 'https://www.flipkart.com/search?q=women+coord+set&sort=popularity_desc', meeshoQ: 'women coord set' },
    { emoji: '👗', label: 'Maxi Dress', tag: '🔥 Female', gender: 'female', category: 'women maxi dress trending', myntraUrl: 'https://www.myntra.com/dresses?rawQuery=women%20maxi%20dress', flipkartUrl: 'https://www.flipkart.com/search?q=women+maxi+dress&sort=popularity_desc', meeshoQ: 'women maxi dress' },
    { emoji: '🥻', label: 'Kurti Set', tag: '🔥 Female', gender: 'female', category: 'women kurti set with pants', myntraUrl: 'https://www.myntra.com/kurta-sets?rawQuery=kurti%20set%20women', flipkartUrl: 'https://www.flipkart.com/search?q=women+kurti+set&sort=popularity_desc', meeshoQ: 'women kurti set' },
  ];

  if (activeTool === 'outfit') {
    return (
      <div className="space-y-4 pt-2">
        <button onClick={() => setActiveTool(null)} className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
          ← {t('backTools')}
        </button>
        <OutfitChecker />
      </div>
    );
  }

  if (activeTool === 'community') {
    return (
      <div className="space-y-4 pt-2">
        <button onClick={() => setActiveTool(null)} className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
          ← {t('backTools')}
        </button>
        <CommunityFeed />
      </div>
    );
  }

  if (activeTool === 'stylebot') {
    return (
      <div className="space-y-4 pt-2">
        <button onClick={() => setActiveTool(null)} className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
          ← {t('backTools')}
        </button>
        <div className={`rounded-2xl border h-[70vh] flex flex-col overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
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
      />
    );
  }




  return (
    <div className="space-y-6 pt-2">
      <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>🛠️ {t('toolsHeader')}</h2>
      
      {/* Primary Tool Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button 
          onClick={() => setActiveTool('stylebot')}
          className={`flex flex-col items-center justify-center p-5 rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-500/30' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-sm'}`}>
          <span className="text-4xl mb-2">💬</span>
          <span className={`font-bold text-sm ${isDark ? 'text-purple-100' : 'text-purple-900'}`}>{t('aiStyleBot')}</span>
          <span className={`text-[10px] ${isDark ? 'text-purple-300/60' : 'text-purple-600/60'}`}>{t('styleBotDesc')}</span>
        </button>

        <button 
          onClick={() => setActiveTool('outfit')}
          className={`flex flex-col items-center justify-center p-5 rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-blue-500/30' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-sm'}`}>
          <span className="text-3xl mb-1 mt-1">👔</span>
          <span className={`font-bold text-sm mt-1 ${isDark ? 'text-blue-100' : 'text-blue-900'}`}>{t('outfitChecker')}</span>
          <span className={`text-[10px] ${isDark ? 'text-blue-300/60' : 'text-blue-600/60'}`}>{t('outfitCheckerDesc')}</span>
        </button>

        <button 
          onClick={() => setActiveTool('calendar')}
          className={`flex flex-col items-center justify-center p-5 rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-amber-500/30' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm'}`}>
          <span className="text-3xl mb-1 mt-1">📅</span>
          <span className={`font-bold text-sm mt-1 ${isDark ? 'text-amber-100' : 'text-amber-900'}`}>{t('aiCalendar')}</span>
          <span className={`text-[10px] ${isDark ? 'text-amber-300/60' : 'text-amber-600/60'}`}>{t('calendarDesc')}</span>
        </button>

        <button 
          onClick={() => onOpenScanner ? onOpenScanner() : null}
          className={`col-span-2 flex flex-col items-center justify-center p-5 rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border-emerald-500/30' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-sm'}`}>
          <span className="flex items-center gap-3">
            <span className="text-4xl">📸</span>
            <div className="flex flex-col items-start text-left">
              <span className={`font-bold text-lg leading-none ${isDark ? 'text-emerald-100' : 'text-emerald-900'}`}>{t('colorScanner')}</span>
              <span className={`text-xs mt-1 ${isDark ? 'text-emerald-300/60' : 'text-emerald-600/60'}`}>{t('scannerDesc')}</span>
            </div>
          </span>
        </button>
      </div>

      <ColorContrastChecker isDark={isDark} />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🔥</span>
          <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('trendingNow')}</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(() => {
            const data = analysisData || JSON.parse(localStorage.getItem('sg_last_analysis') || 'null')?.fullData;
            const prefGender = localStorage.getItem('sg_gender_pref') || 'male';
            const userGender = data?.gender || prefGender;
            return trendingStyles
              .filter(s => s.gender === userGender)
              .map((s) => (
                <TrendingCard key={s.label} item={s} isDark={isDark} AMAZON_TAG="styleguruai-21" />
              ));
          })()}
        </div>
      </div>

    </div>
  );
}

export default ToolsTab;
