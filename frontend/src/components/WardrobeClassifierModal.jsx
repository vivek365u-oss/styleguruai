import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { getCategoriesByGender, getCategoryGroup, getCategorySectionMeta } from '../constants/fashionCategories';

function WardrobeClassifierModal({ isOpen, onClose, onSave, initialData = {} }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  // Read DNA Gender from LocalStorage (if not provided directly)
  const [dnaGender, setDnaGender] = useState('male');
  useEffect(() => {
    try {
      const lastAnalysis = JSON.parse(localStorage.getItem('sg_last_analysis') || '{}');
      if (lastAnalysis?.fullData?.gender) {
        setDnaGender(lastAnalysis.fullData.gender.toLowerCase());
      }
    } catch (e) {}
  }, []);

  const [selectedCat, setSelectedCat] = useState('');
  const [selectedTags, setSelectedTags] = useState(initialData.tags || []);
  const [selectedFit, setSelectedFit] = useState(initialData.fit || 'fit_regular');
  const [selectedFabric, setSelectedFabric] = useState(initialData.fabric || 'fabric_cotton');
  const [selectedPattern, setSelectedPattern] = useState(initialData.pattern || 'pattern_solid');
  const [selectedMood, setSelectedMood] = useState(initialData.mood || 'mood_comfort');

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSave = () => {
    onSave({
      ...initialData,
      category: selectedCat,
      tags: selectedTags,
      fit: selectedFit,
      fabric: selectedFabric,
      pattern: selectedPattern,
      mood: selectedMood,
      gender: dnaGender
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex flex-col justify-end md:justify-center items-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-md border rounded-[2rem] p-6 shadow-2xl max-h-[85vh] overflow-y-auto ${isDark ? 'bg-[#12121A] border-white/10' : 'bg-white border-purple-100'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              {!selectedCat ? t('chooseCategory') || 'CHOOSE CATEGORY' : t('chooseVibe') || 'CHOOSE VIBE'}
            </p>
            <button onClick={onClose} className="text-red-400 text-xs">✕</button>
          </div>

          {!selectedCat ? (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {(() => {
                const groupsMap = {};
                const genderSpecificCategories = getCategoriesByGender(dnaGender);
                
                genderSpecificCategories.forEach(cat => {
                  const sectionKey = getCategoryGroup(cat.id);
                  if (sectionKey === 'UNISEX' || sectionKey === 'OTHER') return;
                  
                  if (!groupsMap[sectionKey]) {
                    groupsMap[sectionKey] = {
                      ...getCategorySectionMeta(cat.id),
                      items: []
                    };
                  }
                  
                  if (!groupsMap[sectionKey].items.find(i => i.label === cat.label)) {
                    groupsMap[sectionKey].items.push(cat);
                  }
                });

                const grouped = Object.values(groupsMap).sort((a, b) => a.order - b.order);

                return (
                  <>
                    {grouped.map(group => (
                      <div key={group.label}>
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                          {group.emoji} {group.label}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {group.items.map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => setSelectedCat(cat.id)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition-all hover:scale-[1.02] active:scale-95 ${
                                isDark
                                  ? 'bg-white/8 border-white/10 text-white/70 hover:bg-purple-500/20 hover:border-purple-500/30 hover:text-white'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-purple-400 hover:bg-purple-50'
                              }`}
                            >
                              <span className="text-base leading-none">{cat.emoji || group.emoji}</span>
                              <span>{cat.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-6">
               {/* STEP: Vibe & Occasion */}
               <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Choose Vibes</p>
                  <div className="flex flex-wrap gap-2">
                    {['tag_campus', 'tag_office', 'tag_party', 'tag_weekend', 'tag_traditional', 'tag_gym'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-purple-600 border-transparent text-white shadow-lg'
                            : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        {t(tag) || tag.replace('tag_', '')}
                      </button>
                    ))}
                  </div>
               </div>

               {/* STEP: Physical Details (Fit, Fabric, Pattern) */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Fit Type</p>
                     <select 
                        value={selectedFit} 
                        onChange={(e) => setSelectedFit(e.target.value)}
                        className={`w-full p-3 rounded-xl text-[10px] font-bold border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      >
                        {['fit_slim', 'fit_regular', 'fit_relaxed', 'fit_oversized'].map(f => <option key={f} value={f}>{t(f) || f.replace('fit_', '')}</option>)}
                     </select>
                  </div>
                  <div className="space-y-3">
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Fabric</p>
                     <select 
                        value={selectedFabric} 
                        onChange={(e) => setSelectedFabric(e.target.value)}
                        className={`w-full p-3 rounded-xl text-[10px] font-bold border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      >
                        {['fabric_cotton', 'fabric_denim', 'fabric_linen', 'fabric_silk', 'fabric_wool'].map(f => <option key={f} value={f}>{t(f) || f.replace('fabric_', '')}</option>)}
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Pattern</p>
                     <select 
                        value={selectedPattern} 
                        onChange={(e) => setSelectedPattern(e.target.value)}
                        className={`w-full p-3 rounded-xl text-[10px] font-bold border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      >
                        {['pattern_solid', 'pattern_striped', 'pattern_checked', 'pattern_printed'].map(f => <option key={f} value={f}>{t(f) || f.replace('pattern_', '')}</option>)}
                     </select>
                  </div>
                  <div className="space-y-3">
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Style Mood</p>
                     <select 
                        value={selectedMood} 
                        onChange={(e) => setSelectedMood(e.target.value)}
                        className={`w-full p-3 rounded-xl text-[10px] font-bold border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      >
                        {['mood_comfort', 'mood_confidence', 'mood_minimal', 'mood_attention'].map(f => <option key={f} value={f}>{t(f) || f.replace('mood_', '')}</option>)}
                     </select>
                  </div>
               </div>

               <button
                 onClick={handleSave}
                 className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-black text-xs shadow-lg shadow-purple-900/40 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
               >
                 <span>👗</span> SAVE TO SMART CLOSET
               </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default WardrobeClassifierModal;
