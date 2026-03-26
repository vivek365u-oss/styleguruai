import { useState, useEffect, useContext } from 'react';
import { getHistory, testTone } from '../api/styleApi';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';

function HistoryPanel() {
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await getHistory();
      setHistory(res.data.history || []);
    } catch (err) {
      setError(t('failedHistory'));
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (item) => {
    setDetailLoading(true);
    try {
      const res = await testTone(item.skin_tone, item.undertone);
      setSelectedItem({ ...item, recommendations: res.data });
    } catch (err) {
      setError(t('failedDetails'));
    } finally {
      setDetailLoading(false);
    }
  };

  const toneColors = {
    fair: '#F5DEB3', light: '#D2A679', medium: '#C68642',
    olive: '#A0724A', brown: '#7B4F2E', dark: '#4A2C0A',
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="mt-8 text-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('loadingHistory')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`mt-8 rounded-2xl p-6 text-center border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
        <p className={isDark ? 'text-red-300' : 'text-red-600'}>{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="mt-8 text-center">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
          <span className="text-4xl">📋</span>
        </div>
        <h3 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('noHistory')}</h3>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{t('noHistoryDesc')}</p>
      </div>
    );
  }

  if (selectedItem) {
    const rec = selectedItem.recommendations;
    return (
      <div className="mt-4 space-y-6">
        <button
          onClick={() => setSelectedItem(null)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm border ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-white/10' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200'}`}
        >
          {t('backToHistory')}
        </button>

        <div className={`bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-3xl p-6`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border-2 border-white/20 shadow-lg" style={{ backgroundColor: toneColors[selectedItem.skin_tone] }} />
            <div>
              <p className={`text-xs uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-purple-400'}`}>Style Profile</p>
              <h2 className={`text-2xl font-black capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedItem.skin_tone} Skin</h2>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-500/20 capitalize">{selectedItem.undertone} undertone</span>
                <span className="bg-pink-500/20 text-pink-300 text-xs px-2 py-1 rounded-full border border-pink-500/20">{selectedItem.color_season}</span>
                <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full border border-green-500/20">{selectedItem.quality_score}% quality</span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{formatDate(selectedItem.date)}</p>
            </div>
          </div>
          <div className={`mt-4 rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-white/40'}`}>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{rec?.summary}</p>
          </div>
        </div>

        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`font-black text-lg mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <span>👔</span> Best Shirt Colors
          </h3>
          <div className="space-y-3">
            {(rec?.best_shirt_colors || []).map((color, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl p-3 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className="w-10 h-10 rounded-lg border border-white/20 flex-shrink-0" style={{ backgroundColor: color.hex }} />
                <div>
                  <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{color.name}</p>
                  <p className={`text-xs font-mono ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{color.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`font-black text-lg mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <span>🧥</span> Outfit Ideas
          </h3>
          <div className="space-y-3">
            {(rec?.outfit_combinations || []).map((combo, i) => (
              <div key={i} className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{combo.shirt}</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>👖 {combo.pant} • 👟 {combo.shoes}</p>
                <span className="text-purple-500 text-xs">{combo.occasion}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-3xl p-6 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className={`font-black text-lg mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <span>💡</span> Style Tips
          </h3>
          <div className="space-y-2">
            {(rec?.style_tips || []).map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-purple-400">✦</span>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('yourHistory')}</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Total {history.length} analyses</p>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl px-3 py-2">
          <span className="text-purple-500 text-sm font-medium">Last 10 results</span>
        </div>
      </div>

      <div className="space-y-3">
        {[...history].reverse().map((item, i) => (
          <div
            key={i}
            onClick={() => viewDetails(item)}
            className={`rounded-2xl p-4 transition-all cursor-pointer group border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30' : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md shadow-sm'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex-shrink-0 border border-white/20 shadow-lg" style={{ backgroundColor: toneColors[item.skin_tone] || '#C68642' }} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`font-semibold capitalize text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{item.skin_tone} skin</span>
                  <span className="bg-purple-500/20 text-purple-500 text-xs px-2 py-0.5 rounded-full border border-purple-500/20 capitalize">{item.undertone} undertone</span>
                  <span className="bg-pink-500/20 text-pink-500 text-xs px-2 py-0.5 rounded-full border border-pink-500/20">{item.color_season}</span>
                  {item.gender === 'female' && <span className="bg-rose-500/20 text-rose-500 text-xs px-2 py-0.5 rounded-full border border-rose-500/20">👩 Female</span>}
                </div>
                <p className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{formatDate(item.date)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-bold ${item.quality_score >= 80 ? 'text-green-500' : item.quality_score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {item.quality_score}%
                </div>
                <p className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>quality</p>
                <p className="text-purple-500 text-xs mt-1 group-hover:text-purple-600">Details →</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {detailLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-2xl p-8 text-center ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className={isDark ? 'text-white' : 'text-gray-800'}>{t('loadingDetails')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryPanel;