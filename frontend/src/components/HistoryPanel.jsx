import { useState, useEffect, useContext } from 'react';
import { getHistory } from '../api/styleApi';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';

function HistoryPanel({ onShowResult }) {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useLanguage();
  const historyLimit = 20; // Increased for all users
  const isDark = theme === 'dark';
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load from localStorage first (instant)
    try {
      const local = JSON.parse(localStorage.getItem('sg_analysis_history') || '[]');
      if (local.length > 0) {
        setHistory(local.slice(0, historyLimit));
        setLoading(false);
        return;
      }
    } catch { /* ignore */ }
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await getHistory();
      setHistory(res.data.history || []);
    } catch {
      setError(t('failedHistory'));
    } finally {
      setLoading(false);
    }
  };

  const toneColors = {
    fair: '#F5DEB3', light: '#D2A679', medium: '#C68642',
    olive: '#A0724A', brown: '#7B4F2E', dark: '#4A2C0A',
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

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('yourHistory')}</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Total {history.length} analyses</p>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl px-3 py-2">
          <span className="text-purple-500 text-sm font-medium">{language === 'hi' ? `पिछले ${history.length} परिणाम` : `Last ${history.length} results`}</span>
        </div>
      </div>

      <div className="space-y-3">
        {history.map((item, i) => {
          // Support both localStorage format and backend format
          const skinTone = item.skinTone || item.skin_tone;
          const undertone = item.undertone;
          const season = item.season || item.color_season;
          const dateStr = item.date || (item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-IN') : '');
          const hasFullData = !!item.fullData;

          return (
            <div
              key={item.id || i}
              className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex-shrink-0 border border-white/20 shadow-lg"
                  style={{ backgroundColor: item.skinHex || toneColors[skinTone] || '#C68642' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`font-bold capitalize text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{t(skinTone)} {language === 'hi' ? 'त्वचा' : 'skin'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/20' : 'bg-purple-100 text-purple-700 border-purple-300'}`}>{t(undertone)}</span>
                    {season && <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? 'bg-pink-500/20 text-pink-300 border-pink-500/20' : 'bg-pink-100 text-pink-700 border-pink-300'}`}>🍂 {t(season)}</span>}
                  </div>
                  <p className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{dateStr}</p>
                </div>
                {hasFullData && onShowResult && (
                  <button
                    onClick={() => onShowResult(item.fullData)}
                    className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition"
                  >
                    View →
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {/* Upgrade prompt removed */}
      </div>

      {history.length === 0 && (
        <div className="mt-8 text-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
            <span className="text-4xl">📋</span>
          </div>
          <h3 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('noHistory')}</h3>
          <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{t('noHistoryDesc')}</p>
        </div>
      )}

    </div>
  );
}

export default HistoryPanel;