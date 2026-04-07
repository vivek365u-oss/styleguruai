// ============================================================
// StyleGuru — Outfit of the Day (OOTD)
// Daily outfit suggestion based on skin tone + gender
// ============================================================
import { useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { auth, saveWardrobeItem } from '../api/styleApi';
import { useLanguage } from '../i18n/LanguageContext';
import { getLocalizedOOTD } from '../data/ootdOutfits';

const OCCASION_EMOJIS = {
  Casual: '😎', Date: '❤️', Office: '💼', Weekend: '🌴', Party: '🎉',
  Wedding: '💍', Festive: '🪔', Outdoor: '🏕️', Streetwear: '🔥',
  College: '🎓', Brunch: '☕', Beach: '🏖️', Formal: '👔',
};

function OOTDCard({ skinTone, gender, isDark }) {
  const { language, t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);
  const [indexOffset, setIndexOffset] = useState(0);
  const [animating, setAnimating] = useState("");

  const handleNext = () => { setAnimating("-translate-x-full opacity-0"); setTimeout(() => { setIndexOffset(i => i + 1); setSaved(false); setAnimating("translate-x-full opacity-0"); requestAnimationFrame(() => setAnimating("")); }, 150); };
  const handlePrev = () => { setAnimating("translate-x-full opacity-0"); setTimeout(() => { setIndexOffset(i => i - 1); setSaved(false); setAnimating("-translate-x-full opacity-0"); requestAnimationFrame(() => setAnimating("")); }, 150); };

  // Get today's outfit
  const genderKey = gender === 'female' ? 'female' : 'male';
  let toneKey = (typeof skinTone === 'string' ? skinTone : skinTone?.category || 'medium')?.toLowerCase();
  const outfit = getLocalizedOOTD(genderKey, toneKey, language, indexOffset);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { showToast(t('Login to save')); return; }
    try {
      await saveWardrobeItem(uid, {
        skin_tone: toneKey,
        skin_hex: outfit.shirtHex,
        source: 'ootd',
        outfit_data: { shirt: outfit.shirt, pant: outfit.pant, shoes: outfit.shoes, occasion: outfit.occasion },
      });
      setSaved(true);
      showToast(t('✅ Saved to wardrobe!'));
    } catch { 
      showToast(t('❌ Could not save')); 
    }
  };

  const handleShare = () => {
    const isFemale = gender === 'female';
    const titleIcon = isFemale ? '💃' : '👔';
    const topIcon = isFemale ? '👗' : '👕';
    const botIcon = isFemale ? '✨' : '👖';
    
    const msg = `${titleIcon} My Outfit of the Day from StyleGuru AI!\n\n${topIcon} ${outfit.shirt}\n${outfit.pant ? botIcon + ' ' + outfit.pant + '\n' : ''}👟 ${outfit.shoes}\n📅 ${outfit.occasion}\n\n💡 ${outfit.tip}\n\nGet yours free 👇\nhttps://www.styleguruai.in`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-700/30' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={handlePrev} className={`p-1.5 rounded-full ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-purple-100 hover:bg-purple-200'}`}>⬅️</button>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              {gender === 'female' ? '💃' : '👔'} {t('OUTFIT OF THE DAY')}
            </p>
            <p className={`text-[10px] mt-0.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
              {t('Swipe for more')} 🔥
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isDark ? 'bg-pink-500/20 border-pink-500/30 text-pink-300' : 'bg-pink-100 border-pink-300 text-pink-700'}`}>
            {OCCASION_EMOJIS[outfit.occasion] || '✨'} {t(outfit.occasion)}
          </span>
          <button onClick={handleNext} className={`p-1.5 rounded-full ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-pink-100 hover:bg-pink-200'}`}>➡️</button>
        </div>
      </div>

      {/* Outfit visual */}
      <div 
        className={`px-4 py-3 flex items-center gap-3 transition-all duration-300 ${animating}`}
        onTouchStart={(e) => { window._ootdTouchStart = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = window._ootdTouchStart - e.changedTouches[0].clientX;
          if (diff > 40) handleNext();
          if (diff < -40) handlePrev();
        }}
      >
        {/* Color blocks */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-12 rounded-xl border border-white/20 shadow-lg relative overflow-hidden"
            style={{ backgroundColor: outfit.shirtHex }}>
            <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)' }} />
            <span className="absolute inset-0 flex items-center justify-center text-sm">{gender === 'female' ? '👗' : '👕'}</span>
          </div>
          {outfit.pant && (
            <div className="w-11 h-14 rounded-xl border border-white/20 shadow-lg relative overflow-hidden"
              style={{ backgroundColor: outfit.pantHex }}>
              <span className="absolute inset-0 flex items-center justify-center text-sm">{gender === 'female' ? '✨' : '👖'}</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t(outfit.shirt)}</p>
          {outfit.pant && <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>+ {t(outfit.pant)}</p>}
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>👟 {t(outfit.shoes)}</p>
          <p className={`text-[11px] mt-2 leading-relaxed italic ${isDark ? 'text-purple-300/70' : 'text-purple-600/70'}`}>
            💡 {t(outfit.tip)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={handleSave} disabled={saved}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${saved
              ? 'bg-green-500/20 border-green-500/30 text-green-400'
              : isDark ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-purple-500/40' : 'bg-white border-gray-200 text-gray-600 hover:border-purple-400'
            }`}>
          {saved ? `✅ ${t('Saved')}` : `👗 ${t('Save')}`}
        </button>
        <button onClick={handleShare}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all ${isDark ? 'bg-green-500/15 border-green-500/20 text-green-400 hover:bg-green-500/25' : 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
            }`}>
          📱 {t('Share')}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg border border-white/10">
          {toast}
        </div>
      )}
    </div>
  );
}

export default OOTDCard;
