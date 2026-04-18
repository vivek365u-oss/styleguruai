/**
 * CommunityFeed.jsx — Premium Community Feed v2
 * Real-time Firestore listener, glassmorphic cards, like system
 * No localStorage dependency — all Firebase
 */

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { auth } from '../api/styleApi';
import { logEvent, EVENTS } from '../utils/analytics';
import { useLanguage } from '../i18n/LanguageContext';

// ── Firestore helpers (dynamic import for smaller initial bundle) ──
async function getDb() {
  const { db } = await import('../firebase');
  return db;
}

async function listenToFeed(callback) {
  const { collection, query, orderBy, limit, onSnapshot } = await import('firebase/firestore');
  const db = await getDb();
  const q = query(collection(db, 'community_feed'), orderBy('published_at', 'desc'), limit(40));
  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(posts);
  }, (err) => {
    console.error('[CommunityFeed] Firestore error:', err);
    callback([]);
  });
}

async function toggleLikePost(postId, uid) {
  const { doc, runTransaction, arrayUnion, arrayRemove, increment } = await import('firebase/firestore');
  const db = await getDb();
  const postRef = doc(db, 'community_feed', postId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(postRef);
    if (!snap.exists()) return;
    const likedBy = snap.data().likedBy || [];
    const hasLiked = likedBy.includes(uid);
    tx.update(postRef, {
      likedBy: hasLiked ? arrayRemove(uid) : arrayUnion(uid),
      likes: increment(hasLiked ? -1 : 1),
    });
  });
}

async function postToCommunity(uid, postData) {
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  const db = await getDb();
  await addDoc(collection(db, 'community_feed'), {
    uid: uid || 'anonymous',
    ...postData,
    likes: 0,
    likedBy: [],
    published_at: serverTimestamp(),
  });
}

// ── Skeleton card ───────────────────────────────────────────────
function SkeletonCard({ isDark }) {
  const base = isDark ? 'bg-white/8 animate-pulse rounded-2xl' : 'bg-gray-100 animate-pulse rounded-2xl';
  return (
    <div className={`rounded-3xl p-4 border ${isDark ? 'bg-white/5 border-white/8' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-11 h-11 rounded-full ${base}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-3 rounded-full w-2/3 ${base}`} />
          <div className={`h-2.5 rounded-full w-1/2 ${base}`} />
        </div>
      </div>
      <div className={`h-2 rounded-full w-full mb-2 ${base}`} />
      <div className="flex gap-2">
        {[1,2,3,4,5].map(i => <div key={i} className={`flex-1 aspect-square rounded-xl ${base}`} />)}
      </div>
    </div>
  );
}

// ── Post Card ───────────────────────────────────────────────────
function PostCard({ post, isDark, currentUid }) {
  const hasLiked = (post.likedBy || []).includes(currentUid);
  const [liking, setLiking] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!currentUid || liking) return;
    setLiking(true);
    try {
      await toggleLikePost(post.id, currentUid);
      logEvent(EVENTS.FEED_INTERACTION, { type: 'like_post' });
    } catch (err) {
      console.error('[PostCard] like error:', err);
    } finally {
      setLiking(false);
    }
  };

  const getTimeAgo = (ts) => {
    if (!ts) return 'Just now';
    const date = ts?.toDate?.() || new Date(ts);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const skinLabel = [post.skinTone, post.undertone].filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ');
  const bestColors = (post.bestColors || []).slice(0, 5);

  return (
    <div className={`rounded-3xl p-4 border transition-all hover:scale-[1.005] ${
      isDark
        ? 'bg-white/[0.04] border-white/[0.07] hover:border-purple-500/30 hover:bg-white/[0.07]'
        : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {/* Skin tone avatar */}
          <div
            className="w-11 h-11 rounded-full border-2 shadow-md flex-shrink-0"
            style={{
              background: post.skinHex
                ? `radial-gradient(circle at 35% 35%, ${post.skinHex}dd, ${post.skinHex}99)`
                : 'linear-gradient(135deg, #C68642, #A0724A)',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
            }}
          />
          <div>
            <p className={`text-sm font-black leading-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {skinLabel || 'Skin Tone'}
            </p>
            <p className={`text-[10px] leading-tight flex items-center gap-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
              {post.colorSeason && <span>{post.colorSeason} Season</span>}
              {post.gender && <span>· {post.gender === 'female' ? '👩' : '👨'}</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-[10px] font-medium ${isDark ? 'text-white/25' : 'text-gray-400'}`}>
            {getTimeAgo(post.published_at)}
          </span>
          <button
            onClick={handleLike}
            disabled={!currentUid || liking}
            className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all select-none ${
              hasLiked
                ? isDark ? 'bg-pink-500/20 border-pink-500/40 text-pink-400' : 'bg-pink-50 border-pink-200 text-pink-500'
                : isDark ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
            } ${liking ? 'opacity-50 scale-95' : 'hover:scale-105'}`}
          >
            {hasLiked ? '🔥' : '🤍'} {post.likes || 0}
          </button>
        </div>
      </div>

      {/* OOTD image */}
      {post.ootdImage && (
        <div className="w-full aspect-[4/5] overflow-hidden rounded-2xl mb-3 border shadow-sm"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>
          <img src={post.ootdImage} alt="OOTD" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      {/* Color palette grid */}
      {bestColors.length > 0 ? (
        <div className="flex gap-1.5">
          {bestColors.map((color, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                className="w-full aspect-square rounded-xl border shadow-sm transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: color.hex || '#888',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                }}
              />
              <span className={`text-[8px] font-semibold truncate w-full text-center ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                {(color.name || 'Color').split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-xs text-center py-2 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
          No palette shared
        </p>
      )}
    </div>
  );
}

// ── Main CommunityFeed ───────────────────────────────────────────
function CommunityFeed() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const { t } = useLanguage();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const currentUid = auth.currentUser?.uid || null;

  // Real-time Firestore listener
  useEffect(() => {
    let unsubscribe;
    setLoading(true);

    listenToFeed((data) => {
      setPosts(data);
      setLoading(false);
    }).then((unsub) => {
      unsubscribe = unsub;
    }).catch((err) => {
      console.error('[CommunityFeed] Failed to subscribe:', err);
      setError('Could not connect to community feed.');
      setLoading(false);
    });

    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const handleOOTDUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!currentUid) { alert('Please login to post your OOTD.'); return; }

    // Get DNA from Firestore
    let dnaData = null;
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const db = await getDb();
      const snap = await getDoc(doc(db, 'users', currentUid, 'primary_profile', 'data'));
      if (snap.exists()) dnaData = snap.data();
    } catch {}

    // Fallback to localStorage cache
    if (!dnaData) {
      try { dnaData = JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch {}
    }

    if (!dnaData) {
      alert('Please analyze your photo first to set your Style DNA before posting.');
      return;
    }

    setUploading(true);
    try {
      // Compress image to ~300px for community (privacy + speed)
      const canvas = document.createElement('canvas');
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise((resolve, reject) => {
        reader.onload = (ev) => {
          const img = new Image();
          img.src = ev.target.result;
          img.onload = async () => {
            const MAX = 400;
            let w = img.width, h = img.height;
            if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } } else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const base64 = canvas.toDataURL('image/jpeg', 0.6);

            const post = {
              skinTone: dnaData.skinTone || 'medium',
              undertone: dnaData.undertone || 'warm',
              skinHex: dnaData.skinHex || '#C68642',
              colorSeason: dnaData.colorSeason || '',
              gender: dnaData.gender || 'male',
              bestColors: (dnaData.bestColors || []).slice(0, 5),
              ootdImage: base64,
            };

            await postToCommunity(currentUid, post);
            logEvent(EVENTS.FEED_INTERACTION, { type: 'post_ootd', gender: post.gender });
            resolve();
          };
          img.onerror = reject;
        };
        reader.onerror = reject;
      });
    } catch (err) {
      console.error('[CommunityFeed] Upload error:', err);
      alert('Failed to post. Please try again.');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleSharePalette = async () => {
    if (!currentUid) { alert('Please login to share your palette.'); return; }

    let dnaData = null;
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const db = await getDb();
      const snap = await getDoc(doc(db, 'users', currentUid, 'primary_profile', 'data'));
      if (snap.exists()) dnaData = snap.data();
    } catch {}
    if (!dnaData) {
      try { dnaData = JSON.parse(localStorage.getItem('sg_last_analysis') || 'null'); } catch {}
    }
    if (!dnaData) { alert('Set your Style DNA first by analyzing a photo.'); return; }

    try {
      await postToCommunity(currentUid, {
        skinTone: dnaData.skinTone || 'medium',
        undertone: dnaData.undertone || 'warm',
        skinHex: dnaData.skinHex || '#C68642',
        colorSeason: dnaData.colorSeason || '',
        gender: dnaData.gender || 'male',
        bestColors: (dnaData.bestColors || []).slice(0, 5),
      });
      logEvent(EVENTS.FEED_INTERACTION, { type: 'share_palette' });
    } catch (err) {
      console.error('[CommunityFeed] Share palette error:', err);
      alert('Failed to share. Please try again.');
    }
  };

  const bg = isDark ? '' : '';
  const cardBg = isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="text-center pt-2">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-3 border ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Live Community</span>
        </div>
        <h2 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Style Palettes</h2>
        <p className={`text-xs max-w-[240px] mx-auto mb-5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
          Real palettes from StyleGuru users around India
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {/* Share Palette */}
          <button
            onClick={handleSharePalette}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-black shadow-lg shadow-purple-900/30 hover:scale-[1.03] active:scale-[0.97] transition-all"
          >
            🎨 Share My Palette
          </button>

          {/* Post OOTD */}
          <label className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black border cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.97] ${
            uploading
              ? 'bg-gray-500 text-white border-transparent cursor-wait'
              : isDark ? 'bg-white/5 border-white/15 text-white/70 hover:text-white hover:border-purple-500/40' : 'bg-white border-gray-200 text-gray-600 hover:border-purple-400 shadow-sm'
          }`}>
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleOOTDUpload} />
            {uploading ? '⏳ Posting...' : '📸 Post OOTD'}
          </label>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4 max-w-lg mx-auto">
        {/* Loading skeletons */}
        {loading && [1, 2, 3].map(i => <SkeletonCard key={i} isDark={isDark} />)}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">⚠️</p>
            <p className={`text-sm font-bold ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{error}</p>
          </div>
        )}

        {/* Posts */}
        {!loading && !error && posts.map(post => (
          <PostCard key={post.id} post={post} isDark={isDark} currentUid={currentUid} />
        ))}

        {/* Empty state */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎨</div>
            <p className={`text-base font-black mb-1 ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
              No palettes yet!
            </p>
            <p className={`text-sm mb-6 ${isDark ? 'text-white/35' : 'text-gray-400'}`}>
              Be the first to share your color palette.
            </p>
            <button
              onClick={handleSharePalette}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-black shadow-lg hover:scale-[1.03] active:scale-[0.97] transition-all"
            >
              🎨 Share My Palette
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityFeed;
