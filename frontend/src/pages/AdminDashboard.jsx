// ============================================================
// StyleGuru — Admin Analytics Dashboard
// Protected: Only accessible by admin UID
// ============================================================
import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { auth } from '../api/styleApi';
import { getFirestore, collection, query, orderBy, limit, getDocs, getCountFromServer } from 'firebase/firestore';

const ADMIN_UID = 'RFZW5MFDdLbelxskQpmhq2iTc6A3';

function AdminDashboard() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = auth.currentUser?.uid === ADMIN_UID;

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    fetchStats();
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const db = getFirestore();

      // Total users
      const usersSnap = await getCountFromServer(collection(db, 'users'));
      const totalUsers = usersSnap.data().count;

      // Total wardrobe items
      let wardrobeCount = 0;
      try {
        const usersQuery = query(collection(db, 'users'), limit(100));
        const usersDocs = await getDocs(usersQuery);
        for (const userDoc of usersDocs.docs) {
          try {
            const wSnap = await getCountFromServer(collection(db, `users/${userDoc.id}/wardrobe`));
            wardrobeCount += wSnap.data().count;
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }

      // Recent profiles (last 20)
      const profilesQuery = query(collection(db, 'users'), orderBy('profile.analyzed_at', 'desc'), limit(20));
      let recentProfiles = [];
      try {
        const profilesDocs = await getDocs(profilesQuery);
        recentProfiles = profilesDocs.docs.map(d => ({ id: d.id, ...d.data().profile }));
      } catch {
        // Fallback: just get users
        const usersQuery2 = query(collection(db, 'users'), limit(20));
        const usersDocs2 = await getDocs(usersQuery2);
        recentProfiles = usersDocs2.docs.map(d => ({ id: d.id, ...d.data().profile })).filter(p => p.skin_tone);
      }

      // Skin tone distribution
      const toneDist = {};
      recentProfiles.forEach(p => {
        if (p?.skin_tone) toneDist[p.skin_tone] = (toneDist[p.skin_tone] || 0) + 1;
      });

      // Pro subscribers
      let proCount = 0;
      try {
        const subQuery = query(collection(db, 'users'), limit(500));
        const subDocs = await getDocs(subQuery);
        for (const doc of subDocs.docs) {
          const sub = doc.data().subscription;
          if (sub?.plan === 'pro' && sub?.valid_until) {
            const validDate = new Date(sub.valid_until);
            if (validDate > new Date()) proCount++;
          }
        }
      } catch { /* ignore */ }

      setStats({
        totalUsers,
        wardrobeCount,
        proCount,
        recentProfiles,
        toneDist,
      });
    } catch (err) {
      console.error('Admin fetch error:', err);
      setError('Failed to load stats: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔒</p>
        <p className={`text-sm font-bold ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Admin Access Required</p>
        <p className={`text-xs mt-1 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>This page is restricted.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className={`text-sm text-red-400`}>{error}</p>
        <button onClick={fetchStats} className="mt-3 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold">Retry</button>
      </div>
    );
  }

  const cardBg = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const headingCls = isDark ? 'text-white' : 'text-gray-800';
  const labelCls = isDark ? 'text-white/40' : 'text-gray-500';

  const TONE_COLORS = { fair: '#F5DEB3', light: '#D2A679', medium: '#C68642', olive: '#A0724A', brown: '#7B4F2E', dark: '#4A2C0A' };
  const maxToneCount = Math.max(1, ...Object.values(stats?.toneDist || { x: 1 }));

  return (
    <div className="space-y-4 pb-8">
      <div className="text-center">
        <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
          📊 Admin Dashboard
        </p>
        <p className={`text-[10px] mt-1 ${labelCls}`}>Real-time analytics from Firestore</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Users', value: stats.totalUsers, emoji: '👥', color: 'text-purple-400' },
          { label: 'Pro Subs', value: stats.proCount, emoji: '💳', color: 'text-green-400' },
          { label: 'Wardrobe Items', value: stats.wardrobeCount, emoji: '👗', color: 'text-pink-400' },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-2xl p-3 text-center ${cardBg}`}>
            <p className="text-xl mb-1">{kpi.emoji}</p>
            <p className={`font-black text-xl ${kpi.color}`}>{kpi.value.toLocaleString()}</p>
            <p className={`text-[10px] ${labelCls}`}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue estimate */}
      <div className={`rounded-2xl p-4 border ${isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>💰 Est. Monthly Revenue</p>
            <p className={`text-[10px] ${labelCls}`}>Pro subs × ₹31/mo</p>
          </div>
          <p className={`text-2xl font-black ${isDark ? 'text-green-400' : 'text-green-700'}`}>
            ₹{(stats.proCount * 31).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Skin Tone Distribution */}
      <div className={`rounded-2xl p-4 ${cardBg}`}>
        <p className={`text-xs font-bold mb-3 ${headingCls}`}>🎨 Skin Tone Distribution</p>
        <div className="space-y-2">
          {Object.entries(stats.toneDist).sort((a, b) => b[1] - a[1]).map(([tone, count]) => (
            <div key={tone} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex-shrink-0 border border-white/20" style={{ backgroundColor: TONE_COLORS[tone] || '#C68642' }} />
              <span className={`text-xs font-semibold w-14 capitalize ${headingCls}`}>{tone}</span>
              <div className={`flex-1 h-4 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${(count / maxToneCount) * 100}%` }} />
              </div>
              <span className={`text-xs font-bold w-8 text-right ${headingCls}`}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Analyses */}
      <div className={`rounded-2xl p-4 ${cardBg}`}>
        <p className={`text-xs font-bold mb-3 ${headingCls}`}>📋 Recent Analyses</p>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {stats.recentProfiles.filter(p => p?.skin_tone).map((p, i) => (
            <div key={i} className={`flex items-center gap-3 p-2 rounded-xl ${isDark ? 'bg-white/3 hover:bg-white/5' : 'bg-gray-50 hover:bg-gray-100'}`}>
              <div className="w-8 h-8 rounded-lg flex-shrink-0 border border-white/20" style={{ backgroundColor: p.skin_hex || TONE_COLORS[p.skin_tone] || '#C68642' }} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold capitalize ${headingCls}`}>{p.skin_tone} · {p.undertone || '?'}</p>
                <p className={`text-[10px] ${labelCls}`}>{p.color_season || ''} · {p.gender_mode || 'male'}</p>
              </div>
              <span className={`text-[9px] ${labelCls}`}>{p.analyzed_at ? new Date(p.analyzed_at).toLocaleDateString('en-IN') : ''}</span>
            </div>
          ))}
          {stats.recentProfiles.filter(p => p?.skin_tone).length === 0 && (
            <p className={`text-xs text-center py-4 ${labelCls}`}>No analyses found yet</p>
          )}
        </div>
      </div>

      {/* Conversion Rate */}
      <div className={`rounded-2xl p-4 ${cardBg}`}>
        <p className={`text-xs font-bold mb-2 ${headingCls}`}>📈 Conversion Rate</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
              <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                style={{ width: `${stats.totalUsers > 0 ? ((stats.proCount / stats.totalUsers) * 100).toFixed(1) : 0}%` }} />
            </div>
          </div>
          <span className={`text-sm font-black ${isDark ? 'text-green-400' : 'text-green-700'}`}>
            {stats.totalUsers > 0 ? ((stats.proCount / stats.totalUsers) * 100).toFixed(1) : 0}%
          </span>
        </div>
        <p className={`text-[10px] mt-1 ${labelCls}`}>Free → Pro conversion</p>
      </div>

      <button onClick={fetchStats}
        className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 transition-all">
        🔄 Refresh Data
      </button>
    </div>
  );
}

export default AdminDashboard;
