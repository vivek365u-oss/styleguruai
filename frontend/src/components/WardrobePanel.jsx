import { useState, useEffect, useContext } from 'react';
import { getWardrobe, deleteWardrobeItem, getWardrobeCount } from '../api/styleApi';
import { auth } from '../api/styleApi';
import { ThemeContext } from '../App';

function SkeletonCard({ isDark }) {
  return (
    <div className={`rounded-2xl p-4 border animate-pulse ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-3 rounded-full w-3/4 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className={`h-3 rounded-full w-1/2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
        </div>
      </div>
    </div>
  );
}

function WardrobePanel({ user }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [capWarning, setCapWarning] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!auth.currentUser) { setLoading(false); return; }
    const timeout = setTimeout(() => {
      if (loading) { setError('Could not load wardrobe. Please try again.'); setLoading(false); }
    }, 3000);

    getWardrobe(auth.currentUser.uid)
      .then(data => {
        clearTimeout(timeout);
        setItems(data);
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setError('Could not load wardrobe. Please try again.');
        setLoading(false);
      });

    getWardrobeCount(auth.currentUser.uid).then(count => {
      if (count >= 50) setCapWarning(true);
    });

    return () => clearTimeout(timeout);
  }, []);

  const handleDelete = async (item) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setDeletingId(item.id);
    // Optimistic removal
    setItems(prev => prev.filter(i => i.id !== item.id));
    try {
      await deleteWardrobeItem(uid, item.id);
      showToast('Outfit removed from wardrobe');
    } catch {
      // Restore on failure
      setItems(prev => [item, ...prev].sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at)));
      showToast('Delete failed — please try again');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  if (!auth.currentUser) {
    return (
      <div className="mt-8 text-center">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
          <span className="text-4xl">👗</span>
        </div>
        <h3 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Your Wardrobe</h3>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Login to save and view your outfits</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-4 space-y-3">
        <h2 className={`font-black text-2xl mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>👗 My Wardrobe</h2>
        {[1, 2, 3].map(i => <SkeletonCard key={i} isDark={isDark} />)}
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

  return (
    <div className="mt-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>👗 My Wardrobe</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{items.length} saved outfit{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={`rounded-xl px-3 py-2 border ${isDark ? 'bg-purple-500/20 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
          <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>{items.length}/50</span>
        </div>
      </div>

      {capWarning && (
        <div className={`rounded-2xl p-3 mb-4 border flex items-center gap-3 ${isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'}`}>
          <span className="text-xl">⚠️</span>
          <p className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>Wardrobe is full (50/50). Delete older outfits to save new ones.</p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-8 text-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
            <span className="text-4xl">👗</span>
          </div>
          <h3 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>No outfits saved yet</h3>
          <p className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Analyze your style and save outfits you love</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
              {/* Card header */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div
                  className="w-12 h-12 rounded-xl flex-shrink-0 border border-white/20 shadow"
                  style={{ backgroundColor: item.skin_hex || '#C68642' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`font-bold text-sm capitalize ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {item.outfit_data?.shirt || item.outfit_data?.dress || 'Outfit'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.source === 'outfit_checker'
                        ? isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/20' : 'bg-blue-100 text-blue-700 border-blue-300'
                        : isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/20' : 'bg-purple-100 text-purple-700 border-purple-300'
                    }`}>
                      {item.source === 'outfit_checker' ? '🔍 Checked' : '✨ Analyzed'}
                    </span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{formatDate(item.saved_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{expandedId === item.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === item.id && (
                <div className={`px-4 pb-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                  <div className="pt-3 space-y-2">
                    {item.outfit_data?.shirt && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👕</span>
                        <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{item.outfit_data.shirt}</p>
                      </div>
                    )}
                    {item.outfit_data?.dress && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👗</span>
                        <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{item.outfit_data.dress}</p>
                      </div>
                    )}
                    {item.outfit_data?.pant && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👖</span>
                        <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{item.outfit_data.pant}</p>
                      </div>
                    )}
                    {item.outfit_data?.shoes && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👟</span>
                        <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{item.outfit_data.shoes}</p>
                      </div>
                    )}
                    {item.outfit_data?.occasion && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📅</span>
                        <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{item.outfit_data.occasion}</p>
                      </div>
                    )}
                    {item.compatibility_score !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🎯</span>
                        <p className={`text-xs font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{item.compatibility_score}% compatible</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    className={`mt-3 w-full py-2 rounded-xl text-xs font-bold border transition-all ${
                      isDark
                        ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                        : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                    } disabled:opacity-50`}
                  >
                    {deletingId === item.id ? 'Deleting...' : '🗑️ Remove from Wardrobe'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-white/10">
          {toast}
        </div>
      )}
    </div>
  );
}

export default WardrobePanel;
