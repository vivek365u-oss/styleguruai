import { useState, useEffect } from 'react';
import { getHistory } from '../api/styleApi';

function HistoryPanel() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await getHistory();
      setHistory(res.data.history || []);
    } catch (err) {
      setError('History load nahi hui. Dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  const toneColors = {
    fair: '#F5DEB3', light: '#D2A679', medium: '#C68642',
    olive: '#A0724A', brown: '#7B4F2E', dark: '#4A2C0A',
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="mt-8 text-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-white/40 text-sm">History load ho rahi hai...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="mt-8 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/10">
          <span className="text-4xl">📋</span>
        </div>
        <h3 className="text-white font-bold text-xl mb-2">Abhi Koi History Nahi</h3>
        <p className="text-white/40 text-sm">Pehli selfie analyze karo — phir history yahan dikhegi!</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-black text-2xl">Tumhari History</h2>
          <p className="text-white/40 text-sm mt-1">Total {history.length} analyses</p>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl px-3 py-2">
          <span className="text-purple-300 text-sm font-medium">Last 10 results</span>
        </div>
      </div>

      <div className="space-y-3">
        {[...history].reverse().map((item, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-purple-500/30 transition-all"
          >
            <div className="flex items-center gap-4">
              {/* Skin tone circle */}
              <div
                className="w-12 h-12 rounded-xl flex-shrink-0 border border-white/20 shadow-lg"
                style={{ backgroundColor: toneColors[item.skin_tone] || '#C68642' }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-white font-semibold capitalize text-sm">
                    {item.skin_tone} skin
                  </span>
                  <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full border border-purple-500/20 capitalize">
                    {item.undertone} undertone
                  </span>
                  <span className="bg-pink-500/20 text-pink-300 text-xs px-2 py-0.5 rounded-full border border-pink-500/20">
                    {item.color_season}
                  </span>
                </div>
                <p className="text-white/30 text-xs">{formatDate(item.date)}</p>
              </div>

              {/* Quality score */}
              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-bold ${
                  item.quality_score >= 80 ? 'text-green-400' :
                  item.quality_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {item.quality_score}%
                </div>
                <p className="text-white/30 text-xs">quality</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HistoryPanel;