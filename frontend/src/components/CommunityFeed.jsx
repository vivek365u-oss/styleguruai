import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../App';
import { getCommunityFeed } from '../api/styleApi';

function CommunityFeed() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCommunityFeed(30);
      setFeed(data);
    } catch (e) {
      setError('Could not load community feed. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    const intervals = [
      { seconds: 31536000, label: 'y' },
      { seconds: 2592000, label: 'mo' },
      { seconds: 86400, label: 'd' },
      { seconds: 3600, label: 'h' },
      { seconds: 60, label: 'm' },
    ];
    for (const i of intervals) {
      const count = Math.floor(seconds / i.seconds);
      if (count >= 1) return `${count}${i.label} ago`;
    }
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className={`text-sm font-bold animate-pulse ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Loading community colors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
        <button onClick={loadFeed} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="text-center">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 mb-2 border ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>LIVE FEED</span>
        </div>
        <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Community Palettes</h2>
        <p className={`text-xs mt-1 max-w-[250px] mx-auto ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
          Anonymous color palettes from users around the world. Find your twin!
        </p>
      </div>

      <div className="space-y-4 max-w-lg mx-auto">
        {feed.map((post) => (
          <div key={post.id} className={`rounded-3xl p-4 border transition-all hover:scale-[1.01] shadow-sm ${
            isDark ? 'bg-white/5 border-white/10 hover:border-purple-500/30 hover:bg-white/10' : 'bg-white border-gray-200 hover:border-purple-400'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-10 h-10 rounded-full border-2 shadow-inner" 
                  style={{ backgroundColor: post.skinHex || '#C68642', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} 
                />
                <div>
                  <p className={`text-sm font-black capitalize ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {post.skinTone} {post.undertone ? `· ${post.undertone}` : ''}
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    {post.colorSeason || 'Unknown'} Season · {post.gender || 'male'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-medium ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                {getTimeAgo(post.published_at)}
              </span>
            </div>

            {/* Colors Grid */}
            <div className="grid grid-cols-5 gap-2">
              {(post.bestColors || []).slice(0, 5).map((color, i) => (
                <div key={i} className="flex flex-col items-center gap-1 group">
                  <div 
                    className="w-full aspect-square rounded-2xl border shadow-sm transition-transform group-hover:scale-110"
                    style={{ backgroundColor: color.hex, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                  />
                  <span className={`text-[8px] sm:text-[9px] font-bold truncate w-full text-center ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                    {color.name ? color.name.split(' ')[0] : 'Color'}
                  </span>
                </div>
              ))}
            </div>
            
            {(post.bestColors || []).length === 0 && (
               <p className={`text-xs text-center py-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>No colors shared</p>
            )}
            
          </div>
        ))}

        {feed.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🎨</p>
            <p className={`text-sm font-bold ${isDark ? 'text-white/70' : 'text-gray-600'}`}>No palettes yet!</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Be the first to share your color palette.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityFeed;
