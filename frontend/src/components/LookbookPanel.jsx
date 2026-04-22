import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { auth, getLookbook, removeFromLookbook } from '../api/styleApi';
import { MISSIONS } from '../utils/stylingEngine';
import ShopActionSheet from './ShopActionSheet';

function LookbookPanel() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');

  const handleShopClick = (itemName) => {
    setSelectedItem(itemName);
    setIsSheetOpen(true);
  };

  useEffect(() => {
    async function fetchData() {
      if (!auth.currentUser) return;
      setLoading(true);
      const data = await getLookbook(auth.currentUser.uid);
      setItems(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    const success = await removeFromLookbook(auth.currentUser.uid, id);
    if (success) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const bgCls = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const cardBgCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const textCls = isDark ? 'text-white' : 'text-gray-800';
  const softTextCls = isDark ? 'text-white/50' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${bgCls} pb-24`}>
      <header className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📖</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">Curated Style</p>
            <h1 className={`text-2xl font-black ${textCls}`}>Digital Lookbook</h1>
          </div>
        </div>
        <p className={`${softTextCls} text-sm`}>Your personal gallery of mission-perfect outfits.</p>
      </header>

      <main className="px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className={`${softTextCls} text-sm font-medium animate-pulse`}>Accessing Style Archive...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl opacity-50">✨</span>
            </div>
            <h3 className={`font-bold ${textCls}`}>Your Lookbook is Empty</h3>
            <p className={`${softTextCls} text-sm mt-1 max-w-[250px]`}>Save your favorite looks from the analysis results to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {items.map((item, idx) => {
                const mission = Object.values(MISSIONS).find(m => m.id === item.missionId);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`${cardBgCls} rounded-3xl p-5 relative overflow-hidden`}
                  >
                    {/* Mission Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{mission?.emoji || '👔'}</span>
                        <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                          {mission?.label || 'Custom Mission'}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Premium Outfit Display with Shopping Links */}
                    {item.outfit && (
                      <div className="mb-6 mt-2">
                        {item.outfit.occasion && (
                          <div className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'bg-white/10 text-white/90' : 'bg-black/5 text-gray-800'}`}>
                            {item.outfit.occasion}
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-3">
                          {/* TOP ITEM */}
                          <div>
                            <div 
                              onClick={() => handleShopClick(item.outfit.top)}
                              className={`group cursor-pointer flex items-start justify-between gap-2 mb-2 transition-colors ${isDark ? 'hover:text-purple-400' : 'hover:text-purple-600'}`}
                            >
                              <h2 className={`text-xl sm:text-2xl font-black leading-tight ${isDark ? 'text-white group-hover:text-purple-300' : 'text-gray-900 group-hover:text-purple-700'}`}>
                                {item.outfit.top}
                              </h2>
                              <span className={`text-[10px] flex-shrink-0 mt-1 px-2 py-1 rounded-md font-bold uppercase tracking-wide transition-colors ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                                🛒 Shop
                              </span>
                            </div>
                            {item.subjectName && (
                              <div className={`mb-3 text-[10px] font-bold uppercase tracking-widest ${item.subjectName.toLowerCase() === 'myself' ? 'text-purple-500' : 'text-blue-500'}`}>
                                👤 For: {item.subjectName}
                              </div>
                            )}
                          </div>

                          {/* BOTTOM, SHOES, DUPATTA */}
                          <div className="flex flex-col gap-2">
                            {['bottom', 'shoes', 'dupatta'].map(key => {
                              if (!item.outfit[key] || item.outfit[key] === "-") return null;
                              const name = item.outfit[key];
                              const emoji = key === 'bottom' ? '👖' : key === 'shoes' ? '👟' : '🧣';
                              
                              return (
                                <div key={key}>
                                  <div 
                                    onClick={() => handleShopClick(name)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${isDark ? 'bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/10' : 'bg-white border-gray-200 shadow-sm hover:border-purple-300 hover:bg-purple-50/50'}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-base">{emoji}</span>
                                      <span className={`text-sm font-bold ${isDark ? 'text-white/90' : 'text-gray-800'}`}>{name}</span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wide ${isDark ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-600'}`}>
                                      Buy
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expert Advice */}
                    {item.expertAdvice && (
                      <div className={`relative p-4 rounded-2xl mb-4 border-l-4 ${isDark ? 'bg-purple-900/10 border-purple-500' : 'bg-purple-50 border-purple-400'}`}>
                        <div className="absolute top-2 right-4 text-purple-500/20 text-4xl font-serif">"</div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Stylist Note</p>
                        <p className={`text-xs italic leading-relaxed pr-6 ${isDark ? 'text-white/80' : 'text-gray-800'}`}>
                          {item.expertAdvice}
                        </p>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-purple-400">💯</span>
                        </div>
                        <span className={`text-[10px] font-bold ${softTextCls}`}>Score: {item.score}/100</span>
                      </div>
                      <span className={`text-[10px] font-medium ${softTextCls}`}>
                        {new Date(item.saved_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <ShopActionSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        item={selectedItem}
      />
    </div>
  );
}

export default LookbookPanel;
