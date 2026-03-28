import OutfitChecker from './OutfitChecker';
import { useState, useEffect, useContext } from 'react';
import UploadSection from './UploadSection';
import ResultsDisplay from './ResultsDisplay';
import HistoryPanel from './HistoryPanel';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';

function LoadingScreen() {
  const [step, setStep] = useState(0);
  const steps = [
    { emoji: '🔍', text: 'Scanning photo...', sub: 'Checking quality' },
    { emoji: '👤', text: 'Detecting face...', sub: 'Face detection running' },
    { emoji: '🎨', text: 'Analyzing skin tone...', sub: 'ITA + Lab color space' },
    { emoji: '👔', text: 'Building recommendations...', sub: '25+ fashion rules' },
    { emoji: '✨', text: 'Almost done...', sub: 'Preparing your style guide' },
  ];
  useEffect(() => {
    const interval = setInterval(() => setStep(p => p < steps.length - 1 ? p + 1 : p), 900);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-pink-500/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">{steps[step].emoji}</div>
      </div>
      <p className="text-white font-bold text-lg mb-1">{steps[step].text}</p>
      <p className="text-purple-300/70 text-sm">{steps[step].sub}</p>
      <div className="flex gap-2 mt-5">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-purple-500 w-6' : 'bg-white/20 w-2'}`} />
        ))}
      </div>
    </div>
  );
}

function ColorContrastChecker({ isDark }) {
  const [color1, setColor1] = useState('#6d28d9');
  const [color2, setColor2] = useState('#f9a8d4');
  const [open, setOpen] = useState(false);

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
  const verdict = ratio >= 4.5 ? '✅ Great combo!' : ratio >= 3 ? '⚠️ Okay for large text' : '❌ Poor contrast';

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4">
        <span className="text-2xl">🎨</span>
        <div className="flex-1 text-left">
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>Color Contrast Checker</p>
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Check if 2 colors look good together</p>
        </div>
        <span className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className={`px-4 pb-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
          <div className="flex gap-3 mt-3 mb-3">
            <div className="flex-1">
              <p className={`text-xs mb-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Color 1</p>
              <div className="flex items-center gap-2">
                <input type="color" value={color1} onChange={e => setColor1(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                <span className={`text-xs font-mono ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{color1}</span>
              </div>
            </div>
            <div className="flex-1">
              <p className={`text-xs mb-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Color 2</p>
              <div className="flex items-center gap-2">
                <input type="color" value={color2} onChange={e => setColor2(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                <span className={`text-xs font-mono ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{color2}</span>
              </div>
            </div>
          </div>
          {/* Preview */}
          <div className="rounded-xl p-4 mb-3 flex items-center justify-center text-sm font-bold" style={{ backgroundColor: color1, color: color2 }}>
            Sample Text Preview
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Contrast Ratio</p>
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

// ── Trending Card with Shop Modal ───────────────────────────
function TrendingCard({ item, isDark, AMAZON_TAG }) {
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

      {/* Shop options — full width overlay panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Panel — fixed bottom sheet on mobile, dropdown on desktop */}
          <div className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t p-5 shadow-2xl md:absolute md:bottom-auto md:top-full md:left-auto md:right-auto md:rounded-2xl md:border md:mt-1 md:w-56 ${isDark ? 'bg-slate-900 border-white/20' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-bold ${isDark ? 'text-white/60' : 'text-gray-500'}`}>🛍️ Shop on:</p>
              <button onClick={() => setOpen(false)} className={`text-xs font-bold px-2 py-1 rounded-lg ${isDark ? 'text-white/40 hover:text-white bg-white/5' : 'text-gray-400 hover:text-gray-700 bg-gray-100'}`}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {shopOptions.map(opt => (
                <a
                  key={opt.name}
                  href={opt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all hover:scale-[1.02] ${opt.bg}`}
                >
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

function HomeScreen({ user, onAnalyze, onTabChange, onShowResult }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const lastAnalysis = (() => { try { return JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch { return null; } })();
  const analysisCount = parseInt(localStorage.getItem('sg_analysis_count') || '0');
  const savedCount = (() => { try { return JSON.parse(localStorage.getItem('sg_saved_colors') || '[]').length; } catch { return 0; } })();
  const toneColors = { fair: "#F5DEB3", light: "#D2A679", medium: "#C68642", olive: "#A0724A", brown: "#7B4F2E", dark: "#4A2C0A" };
  const quickCards = [
    { icon: '🎨', label: 'Best Colors', tab: 'analyze' },
    { icon: '👔', label: 'Outfit Ideas', tab: 'analyze' },
    { icon: '✨', label: 'Accessories', tab: 'analyze' },
    { icon: '🌍', label: 'Seasonal', tab: 'analyze' },
  ];
  const trendingStyles = [
    // Men trending 2025
    { emoji: '👕', label: 'Oversized Tee', tag: '🔥 Male', gender: 'male', category: 'oversized tshirt streetwear', myntraUrl: 'https://www.myntra.com/tshirts?rawQuery=oversized%20tshirt%20men', flipkartUrl: 'https://www.flipkart.com/search?q=men+oversized+tshirt&sort=popularity_desc', meeshoQ: 'men oversized tshirt' },
    { emoji: '🪖', label: 'Cargo Pants', tag: '🔥 Male', gender: 'male', category: 'cargo pants men streetwear', myntraUrl: 'https://www.myntra.com/cargos?rawQuery=cargo%20pants%20men', flipkartUrl: 'https://www.flipkart.com/search?q=men+cargo+pants&sort=popularity_desc', meeshoQ: 'men cargo pants' },
    { emoji: '🎽', label: 'Co-ord Set', tag: '🔥 Male', gender: 'male', category: 'men coord set matching', myntraUrl: 'https://www.myntra.com/co-ords?rawQuery=men%20coord%20set', flipkartUrl: 'https://www.flipkart.com/search?q=men+coord+set&sort=popularity_desc', meeshoQ: 'men coord set' },
    // Women trending 2025
    { emoji: '✨', label: 'Coord Set', tag: '🔥 Female', gender: 'female', category: 'women coord set two piece', myntraUrl: 'https://www.myntra.com/co-ords?rawQuery=women%20coord%20set', flipkartUrl: 'https://www.flipkart.com/search?q=women+coord+set&sort=popularity_desc', meeshoQ: 'women coord set' },
    { emoji: '👗', label: 'Maxi Dress', tag: '🔥 Female', gender: 'female', category: 'women maxi dress trending', myntraUrl: 'https://www.myntra.com/dresses?rawQuery=women%20maxi%20dress', flipkartUrl: 'https://www.flipkart.com/search?q=women+maxi+dress&sort=popularity_desc', meeshoQ: 'women maxi dress' },
    { emoji: '🥻', label: 'Kurti Set', tag: '🔥 Female', gender: 'female', category: 'women kurti set with pants', myntraUrl: 'https://www.myntra.com/kurta-sets?rawQuery=kurti%20set%20women', flipkartUrl: 'https://www.flipkart.com/search?q=women+kurti+set&sort=popularity_desc', meeshoQ: 'women kurti set' },
  ];
  const DAILY_TIPS = [
    { emoji: '🎨', tip: 'Navy blue suits warm undertones perfectly — try it for your next outfit!' },
    { emoji: '👗', tip: 'Coord sets are trending — pick a color that matches your skin tone for max impact.' },
    { emoji: '✨', tip: 'Gold jewellery enhances medium and dark skin tones beautifully.' },
    { emoji: '🌿', tip: 'Earthy tones like terracotta and olive are perfect for medium skin tones.' },
    { emoji: '💡', tip: 'Wear your best color near your face — it draws attention to your features.' },
    { emoji: '👔', tip: 'Oversized fits look best when you balance with fitted bottoms.' },
    { emoji: '🪷', tip: 'For ethnic wear, jewel tones like deep red and emerald are universally flattering.' },
    { emoji: '☀️', tip: 'In summer, light pastels keep you cool and stylish at the same time.' },
    { emoji: '🧣', tip: 'A dupatta in a contrasting color can completely transform a simple outfit.' },
    { emoji: '💄', tip: 'Match your lip color to your undertone — warm tones suit coral, cool tones suit berry.' },
    { emoji: '👟', tip: 'White sneakers go with everything — the most versatile footwear you can own.' },
    { emoji: '🎉', tip: 'For festive occasions, always go one shade bolder than your usual choice.' },
    { emoji: '🌙', tip: 'Dark skin tones glow in bright whites and vivid colors — embrace the boldness!' },
    { emoji: '🌸', tip: 'Fair skin tones look stunning in jewel tones like sapphire and emerald.' },
  ];
  const todayTip = DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length];
  const firstName = user?.name?.split(' ')[0] || 'there';
  return (
    <div className="pb-4 space-y-6">
      <div className="pt-2">
        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Good day,</p>
        <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Hey {firstName} 👋</h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Discover your perfect style with AI</p>
      </div>

      <button
        onClick={onAnalyze}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-white font-black text-base shadow-lg shadow-purple-900/50 transition-all hover:scale-[1.02] active:scale-[0.98] pulse-glow"
      >
        ✨ Analyze Your Style
      </button>

      {/* Stats Row */}
      {analysisCount > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Analyses', value: analysisCount, emoji: '📸' },
            { label: 'Saved Colors', value: savedCount, emoji: '❤️' },
            { label: 'Style Score', value: '92', emoji: '💯' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-2xl p-3 border text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
              <p className="text-xl mb-1">{stat.emoji}</p>
              <p className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{stat.value}</p>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Daily Style Tip */}
      <div className={`rounded-2xl p-4 border flex items-start gap-3 ${isDark ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-700/30' : 'bg-purple-50 border-purple-200'}`}>
        <span className="text-2xl flex-shrink-0">{todayTip.emoji}</span>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>💡 Style Tip of the Day</p>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{todayTip.tip}</p>
        </div>
      </div>

      {/* Recent Analysis */}
      {lastAnalysis && (
        <div
          onClick={() => {
            if (lastAnalysis.fullData) {
              onShowResult(lastAnalysis.fullData);
            } else {
              onAnalyze();
            }
          }}
          className={`cursor-pointer rounded-2xl p-4 border flex items-center gap-4 transition-all hover:border-purple-500/50 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}
        >
          <div className="w-12 h-12 rounded-xl flex-shrink-0 border border-white/20" style={{ backgroundColor: toneColors[lastAnalysis.skinTone] || '#C68642' }} />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Last Analysis</p>
            <p className={`font-black text-sm capitalize ${isDark ? 'text-white' : 'text-gray-800'}`}>{lastAnalysis.skinTone} Skin · {lastAnalysis.undertone}</p>
            <p className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{lastAnalysis.date} · {lastAnalysis.season}</p>
          </div>
          <span className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-500'}`}>→</span>
        </div>
      )}

      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Explore</p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {quickCards.map((c) => (
            <button
              key={c.label}
              onClick={() => onTabChange(c.tab)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 border rounded-2xl px-5 py-4 transition-all min-w-[90px] ${isDark ? 'bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/10' : 'bg-white border-purple-100 hover:border-purple-400 shadow-sm'}`}
            >
              <span className="text-2xl">{c.icon}</span>
              <span className={`text-xs font-medium text-center ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Trending Now 🔥</p>
        <div className="grid grid-cols-3 gap-3">
          {trendingStyles.map((s) => (
            <TrendingCard key={s.label} item={s} isDark={isDark} AMAZON_TAG="styleguruai-21" />
          ))}
        </div>
      </div>

      {/* Color Contrast Checker */}
      <ColorContrastChecker isDark={isDark} />
    </div>
  );
}

function SettingsScreen({ user, onLogout }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t, language, changeLanguage } = useLanguage();
  const isDark = theme === 'dark';
  const [notifStatus, setNotifStatus] = useState(() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  });

  const requestNotification = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const permission = await Notification.requestPermission();
      setNotifStatus(permission);
      if (permission === 'granted') {
        // Register service worker
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.register('/sw.js');
          // Show welcome notification
          reg.showNotification('StyleGuru AI 🎨', {
            body: 'Notifications enabled! We\'ll send you daily style tips.',
            icon: '/favicon.svg',
            badge: '/favicon.svg',
          });
        }
        localStorage.setItem('sg_notif', 'granted');
      }
    } catch (e) {
      console.log('Notification error:', e);
    }
  };
  return (
    <div className="space-y-4 pt-2">
      <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>⚙️ Settings</h2>

      {/* User card */}
      <div className={`rounded-2xl p-4 flex items-center gap-4 border ${isDark ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-700/30' : 'bg-white border-purple-100 shadow-sm'}`}>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{user?.email}</p>
        </div>
      </div>

      {/* Language */}
      <div className={`rounded-2xl p-4 flex items-center justify-between border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
        <div>
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>🌐 Language</p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>App language</p>
        </div>
        <div className={`flex rounded-xl p-1 gap-1 ${isDark ? 'bg-white/10' : 'bg-gray-100 border border-gray-200'}`}>
          <button onClick={() => changeLanguage('hinglish')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'hinglish' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>🇮🇳</button>
          <button onClick={() => changeLanguage('en')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow' : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>🇬🇧</button>
        </div>
      </div>

      {/* Theme */}
      <div className={`rounded-2xl p-4 flex items-center justify-between border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
        <div>
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>Switch theme</p>
        </div>
        <button onClick={toggleTheme} className="relative w-14 h-7 rounded-full bg-purple-500 transition-all">
          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${isDark ? 'left-8' : 'left-1'}`} />
        </button>
      </div>

      {/* Push Notifications */}
      <div className={`rounded-2xl p-4 flex items-center justify-between border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
        <div>
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>🔔 Notifications</p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
            {notifStatus === 'granted' ? 'Enabled ✓' : notifStatus === 'denied' ? 'Blocked in browser' : 'Daily style tips'}
          </p>
        </div>
        {notifStatus === 'granted' ? (
          <span className="text-green-400 text-xs font-bold bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">✓ On</span>
        ) : notifStatus === 'denied' ? (
          <span className="text-red-400 text-xs font-bold">Blocked</span>
        ) : (
          <button
            onClick={requestNotification}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:from-purple-500 hover:to-pink-500 transition"
          >
            Enable
          </button>
        )}
      </div>

      {/* Logout */}
      <button onClick={onLogout} className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-2xl border border-red-500/20 transition">
        🚪 Logout
      </button>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [currentGender, setCurrentGender] = useState('male');

  const handleReset = () => { setResults(null); setError(null); setUploadedImage(null); };
  const handleAnalysisComplete = (data) => {
    const enriched = { ...data, gender: data.gender || currentGender };
    setResults(enriched);
    setLoading(false);
    // Save last analysis + increment count
    try {
      const count = parseInt(localStorage.getItem('sg_analysis_count') || '0') + 1;
      localStorage.setItem('sg_analysis_count', count.toString());
      localStorage.setItem('sg_last_analysis', JSON.stringify({
        skinTone: enriched.analysis?.skin_tone?.category,
        undertone: enriched.analysis?.skin_tone?.undertone,
        season: enriched.analysis?.skin_tone?.color_season,
        date: new Date().toLocaleDateString('en-IN'),
        fullData: enriched,
      }));
    } catch {}
  };

  const navItems = [
    { id: 'home',     emoji: '🏠', label: 'Home' },
    { id: 'analyze',  emoji: '📸', label: 'Analyze' },
    { id: 'outfit',   emoji: '👔', label: 'Outfit' },
    { id: 'history',  emoji: '📋', label: 'History' },
    { id: 'settings', emoji: '⚙️', label: 'Profile' },
  ];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'analyze') handleReset();
  };

  return (
    <div className={`min-h-screen text-white ${theme === 'dark' ? 'bg-[#050816]' : 'bg-gradient-to-br from-slate-200 via-purple-100/50 to-slate-200'}`} style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <div className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-purple-700/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-pink-700/20 blur-[120px] pointer-events-none z-0" />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <header className={`relative z-10 flex items-center justify-between px-4 py-4 border-b backdrop-blur-xl sticky top-0 ${theme === 'dark' ? 'border-white/10 bg-[#050816]/80' : 'border-purple-200 bg-slate-100/90 shadow-sm'}`}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-black text-white">SG</div>
          <span className={`font-black text-base bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent`}>StyleGuru AI</span>
        </div>
        <div className="flex items-center gap-2">
          {results && activeTab === 'analyze' && (
            <button onClick={handleReset} className="text-xs text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-full hover:bg-purple-500/10 transition">
              ← New
            </button>
          )}
          <button onClick={toggleTheme} className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pt-4 pb-24">
        <div className="tab-content" key={activeTab}>
        {activeTab === 'home' && (
          <HomeScreen
            user={user}
            onAnalyze={() => setActiveTab('analyze')}
            onTabChange={handleTabChange}
            onShowResult={(data) => {
              setResults(data);
              setActiveTab('analyze');
            }}
          />
        )}
        {activeTab === 'analyze' && (
          <>
            {!results && !loading && (
              <UploadSection
                onLoadingStart={() => { setLoading(true); setError(null); }}
                onAnalysisComplete={handleAnalysisComplete}
                onError={(msg) => { setError(msg); setLoading(false); }}
                onImageSelected={setUploadedImage}
                onGenderChange={setCurrentGender}
              />
            )}
            {loading && <LoadingScreen />}
            {error && (
              <div className="mt-8 rounded-2xl p-6 text-center border bg-red-500/10 border-red-500/30">
                <div className="text-4xl mb-3">😕</div>
                <p className="text-red-300 font-medium mb-1">Oops!</p>
                <p className="text-red-400/80 text-sm whitespace-pre-line">{error}</p>
                <button onClick={handleReset} className="mt-4 px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/20 text-sm font-medium transition">
                  {t('tryAgain')}
                </button>
              </div>
            )}
            {results && <ResultsDisplay data={results} uploadedImage={uploadedImage} onReset={handleReset} />}
          </>
        )}
        {activeTab === 'outfit' && <OutfitChecker />}
        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'settings' && <SettingsScreen user={user} onLogout={onLogout} />}
        </div>
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t ${theme === 'dark' ? 'bg-[#050816]/95 border-white/10' : 'bg-slate-100/95 border-purple-200 shadow-lg'}`}>
        <div className="max-w-lg mx-auto flex justify-around px-2 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${activeTab === item.id ? 'text-purple-500' : theme === 'dark' ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-700'}`}
            >
              <span className={`text-xl transition-transform ${activeTab === item.id ? 'scale-110' : ''}`}>{item.emoji}</span>
              <span className={`text-[10px] font-semibold ${activeTab === item.id ? 'text-purple-400' : 'text-white/30'}`}>{item.label}</span>
              {activeTab === item.id && <div className="w-1 h-1 rounded-full bg-purple-400 nav-dot" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default Dashboard;
