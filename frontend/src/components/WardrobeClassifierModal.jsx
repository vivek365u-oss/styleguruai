import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { FashionIcons, IconRenderer } from './Icons';

function WardrobeClassifierModal({ isOpen, onClose, onSave, initialData = {} }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const [category, setCategory] = useState(initialData.category || 'top'); // default to top
  const [fit, setFit] = useState(initialData.fit || 'fit_regular');
  const [fabric, setFabric] = useState(initialData.fabric || 'fabric_cotton');
  const [pattern, setPattern] = useState(initialData.pattern || 'pattern_solid');
  const [selectedTags, setSelectedTags] = useState(initialData.tags || []);

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSave = () => {
    const organizedData = {
      ...initialData,
      category,
      fit,
      fabric,
      pattern,
      tags: selectedTags,
    };
    onSave(organizedData);
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
          className="relative w-full max-w-md bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[2.5rem] p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="w-14 h-14 rounded-2xl shadow-inner border border-white/20 flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: initialData.hex || '#8B5CF6' }}
            >
              {initialData.hex ? '' : <IconRenderer icon={FashionIcons.Wardrobe} className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h3 className="font-black text-xl leading-tight">Organize Item</h3>
              <p className="text-xs opacity-60 uppercase font-black tracking-widest">{initialData.color_name || 'New Addition'}</p>
            </div>
            <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs opacity-60 hover:opacity-100">✕</button>
          </div>

          <div className="space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Item Type</p>
              <div className="flex gap-2">
                {['top', 'bottom', 'dress', 'shoe', 'accessory'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                      category === cat 
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' 
                        : isDark ? 'bg-white/5 border-white/10 opacity-60 hover:opacity-100' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-purple-50'
                    }`}
                  >
                    {t(cat) || cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags / Occasion */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Best For (Vibe/Occasion)</p>
              <div className="flex flex-wrap gap-2">
                {['tag_casual', 'tag_office', 'tag_party', 'tag_weekend', 'tag_traditional', 'tag_gym', 'tag_winter', 'tag_summer'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : isDark ? 'bg-white/5 border-white/10 opacity-60' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {t(tag) || tag.replace('tag_', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Properties */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Fit</p>
                 <select 
                    value={fit} 
                    onChange={(e) => setFit(e.target.value)}
                    className={`w-full p-3 rounded-xl text-[11px] font-bold border outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  >
                    {['fit_slim', 'fit_regular', 'fit_relaxed', 'fit_oversized'].map(f => <option key={f} value={f}>{t(f) || f}</option>)}
                 </select>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Fabric</p>
                 <select 
                    value={fabric} 
                    onChange={(e) => setFabric(e.target.value)}
                    className={`w-full p-3 rounded-xl text-[11px] font-bold border outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  >
                    {['fabric_cotton', 'fabric_denim', 'fabric_linen', 'fabric_silk', 'fabric_wool', 'fabric_synthetic'].map(f => <option key={f} value={f}>{t(f) || f}</option>)}
                 </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full mt-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-purple-500/20 active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            <span>👗</span> Save to Wardrobe
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default WardrobeClassifierModal;
