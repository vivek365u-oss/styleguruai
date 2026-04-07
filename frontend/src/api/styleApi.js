import axios from 'axios';
import { auth, googleProvider, db } from '../firebase';
export { auth };
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, limit, deleteDoc, increment } from 'firebase/firestore';
import { compressImage, validateImageFile } from '../utils/imageCompression';
import { retryRequest, startKeepAlive, healthCheck } from '../utils/apiRetry';

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000 // 30s global timeout
});

// Auto-attach Firebase token to every request
API.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API] Attached auth token for user: ${user.uid}`);
    } catch (e) {
      console.error('[API] Failed to get auth token', e);
    }
  } else {
    // Only warn if it's NOT the health check or a public route
    const isPublic = config.url === '/health' || config.url === '/';
    if (!isPublic) {
      console.warn(`[API] Request to ${config.url} sent without authentication!`);
    } else {
      console.log(`[API] Public request: ${config.url}`);
    }
  }
  return config;
}, (error) => {
  console.error('[API] Request error:', error);
  return Promise.reject(error);
});

// Response Interceptor for better error handling
API.interceptors.response.use(
  (response) => {
    console.log(`[API] Success: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`[API] Error on ${error.config?.url || 'unknown url'}:`, error.message);
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timed out after 30s');
    }
    return Promise.reject(error);
  }
);

// Start keep-alive system on API initialization
startKeepAlive(() => healthCheck(API));

// ============================================
// FIREBASE AUTH
// ============================================

// Google Login
export const googleLogin = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Firestore mein user save karo (pehli baar)
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      full_name: user.displayName,
      created_at: new Date().toISOString()
    });
  }
  return { name: user.displayName, email: user.email };
};


// Email Register
export const registerUser = async (data) => {
  const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
  await updateProfile(result.user, { displayName: data.full_name });

  // Firestore mein save karo
  await setDoc(doc(db, 'users', result.user.uid), {
    email: data.email,
    full_name: data.full_name,
    created_at: new Date().toISOString()
  });
  return { data: { user_name: data.full_name, email: data.email } };
};

// Email Login
export const loginUser = async (data) => {
  const result = await signInWithEmailAndPassword(auth, data.email, data.password);
  return { data: { user_name: result.user.displayName || data.email, email: data.email } };
};

// ============================================
// AUTH HELPERS
// ============================================

export const saveAuth = (data) => {
  localStorage.setItem('tonefit_user', JSON.stringify({ name: data.user_name, email: data.email }));
};

export const getUser = () => {
  const u = localStorage.getItem('tonefit_user');
  return u ? JSON.parse(u) : null;
};

export const logout = async () => {
  await signOut(auth);
  localStorage.removeItem('tonefit_user');
};

export const isLoggedIn = () => !!auth.currentUser;

export const getMe = () => API.get('/auth/me');

// ============================================
// HISTORY — FIRESTORE
// ============================================

export const saveHistory = async (historyData) => {
  const user = auth.currentUser;
  if (!user) return;
  await addDoc(collection(db, 'users', user.uid, 'history'), {
    ...historyData,
    date: new Date().toISOString()
  });
};

export const getHistory = async () => {
  const user = auth.currentUser;
  if (!user) return { data: { total: 0, history: [] } };

  const q = query(
    collection(db, 'users', user.uid, 'history'),
    orderBy('date', 'desc'),
    limit(10)
  );
  const snap = await getDocs(q);
  const history = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return { data: { total: history.length, history } };
};

// ============================================
// COINS — FIRESTORE
// ============================================

export const consumeCoin = async (cost = 1) => {
  return await API.post('/api/users/consume-coin', { cost });
};

// ============================================
// ============================================

export const analyzeImage = async (file, lang = 'en', onProgress) => {
  try {
    validateImageFile(file);
    // Compress image before upload
    const compressedFile = await compressImage(file);
    console.log(`✓ Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
    
    return await retryRequest(async () => {
      const formData = new FormData();
      formData.append('file', compressedFile);
      return API.post(`/api/analyze?lang=${lang}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
        },
        timeout: 60000,
      });
    }, 3, 1000);
  } catch (error) {
    console.error('Image analysis failed:', error);
    throw error;
  }
};

export const analyzeImageFemale = async (file, lang = 'en', onProgress) => {
  try {
    validateImageFile(file);
    const compressedFile = await compressImage(file);
    console.log(`✓ Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
    
    return await retryRequest(async () => {
      const formData = new FormData();
      formData.append('file', compressedFile);
      return API.post(`/api/analyze/female?lang=${lang}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
        },
        timeout: 60000,
      });
    }, 3, 1000);
  } catch (error) {
    console.error('Female image analysis failed:', error);
    throw error;
  }
};

export const analyzeImageSeasonal = async (file, season, lang = 'en', onProgress) => {
  try {
    validateImageFile(file);
    const compressedFile = await compressImage(file);
    console.log(`✓ Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
    
    return await retryRequest(async () => {
      const formData = new FormData();
      formData.append('file', compressedFile);
      return API.post(`/api/analyze/seasonal?season=${season}&lang=${lang}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
        },
        timeout: 60000,
      });
    }, 3, 1000);
  } catch (error) {
    console.error('Seasonal image analysis failed:', error);
    throw error;
  }
};

export const checkOutfitCompatibility = async (selfieFile, outfitFile, lang = 'en', onProgress) => {
  try {
    validateImageFile(selfieFile);
    validateImageFile(outfitFile);
    const compressedSelfie = await compressImage(selfieFile);
    const compressedOutfit = await compressImage(outfitFile);
    console.log(`✓ Images compressed`);
    
    return await retryRequest(async () => {
      const formData = new FormData();
      formData.append('selfie', compressedSelfie);
      formData.append('outfit', compressedOutfit);
      return API.post(`/api/outfit/check?lang=${lang}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
        },
        timeout: 60000,
      });
    }, 3, 1000);
  } catch (error) {
    console.error('Outfit compatibility check failed:', error);
    throw error;
  }
};


export const testTone = (tone, undertone = 'warm') =>
  API.get(`/api/test/${tone}?undertone=${undertone}`);


// ============================================
// ERROR HELPERS
// ============================================
const handleFirestoreError = (fnName, e) => {
  if (e?.code === 'permission-denied' || e?.message?.includes('permission-denied')) {
    console.error(`[Firestore] Access denied in ${fnName}. Check security rules or re-login.`, e);
  } else {
    console.error(`${fnName} error:`, e);
  }
};

// ============================================
// PROFILE — FIRESTORE
// ============================================

export const saveProfile = async (uid, profile) => {
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, 'users', uid, 'profile', 'data'), {
      ...profile,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    handleFirestoreError('saveProfile', e);
    throw e;
  }
};

export const loadProfile = async (uid) => {
  if (!auth.currentUser) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'profile', 'data'));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    handleFirestoreError('loadProfile', e);
    return null;
  }
};

// ============================================
// WARDROBE — FIRESTORE
// ============================================

export const saveWardrobeItem = async (uid, item) => {
  if (!auth.currentUser) return null;
  try {
    const ref = await addDoc(collection(db, 'users', uid, 'wardrobe'), {
      ...item,
      saved_at: new Date().toISOString(),
    });
    return ref.id;
  } catch (e) {
    handleFirestoreError('saveWardrobeItem', e);
    throw e;
  }
};

const getCachedWardrobe = (uid) => {
  try {
    const cached = localStorage.getItem(getCacheKey(uid, 'wardrobe'));
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

const setCachedWardrobe = (uid, items) => {
  try {
    localStorage.setItem(getCacheKey(uid, 'wardrobe'), JSON.stringify(items));
  } catch (e) {
    console.warn('[Cache] Failed to save wardrobe to localStorage:', e);
  }
};

export const getWardrobe = async (uid) => {
  if (!auth.currentUser) return [];
  try {
    const q = query(
      collection(db, 'users', uid, 'wardrobe'),
      orderBy('saved_at', 'desc')
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Always update cache on successful fetch
    setCachedWardrobe(uid, items);
    return items;
  } catch (e) {
    handleFirestoreError('getWardrobe', e);
    // Offline fallback: return cached data
    console.log('[API] Offline - returning cached wardrobe');
    return getCachedWardrobe(uid);
  }
};

export const deleteWardrobeItem = async (uid, itemId) => {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'wardrobe', itemId));
    // Update cache
    const cached = getCachedWardrobe(uid);
    setCachedWardrobe(uid, cached.filter(c => c.id !== itemId));
  } catch (e) {
    handleFirestoreError('deleteWardrobeItem', e);
    throw e;
  }
};

export const getWardrobeCount = async (uid) => {
  if (!auth.currentUser) return 0;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'wardrobe'));
    return snap.size;
  } catch (e) {
    handleFirestoreError('getWardrobeCount', e);
    // Offline fallback
    return getCachedWardrobe(uid).length;
  }
};

// ============================================
// SAVED COLORS — FIRESTORE
// ============================================

// Offline cache helpers
const getCacheKey = (uid, collection) => `cache_${uid}_${collection}`;

const getCachedColors = (uid) => {
  try {
    const cached = localStorage.getItem(getCacheKey(uid, 'saved_colors'));
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

const setCachedColors = (uid, colors) => {
  try {
    localStorage.setItem(getCacheKey(uid, 'saved_colors'), JSON.stringify(colors));
  } catch (e) {
    console.warn('[Cache] Failed to save colors to localStorage:', e);
  }
};

export const saveSavedColor = async (uid, color) => {
  if (!auth.currentUser) return null;
  try {
    const ref = await addDoc(collection(db, 'users', uid, 'saved_colors'), {
      ...color,
      saved_at: new Date().toISOString(),
    });
    
    // Update local cache
    const current = getCachedColors(uid);
    const newColor = { id: ref.id, ...color, saved_at: new Date().toISOString() };
    setCachedColors(uid, [newColor, ...current]);
    
    return ref.id;
  } catch (e) {
    handleFirestoreError('saveSavedColor', e);
    throw e;
  }
};

export const getSavedColors = async (uid) => {
  if (!auth.currentUser) return [];
  try {
    const q = query(
      collection(db, 'users', uid, 'saved_colors'),
      orderBy('saved_at', 'desc')
    );
    const snap = await getDocs(q);
    const colors = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Always update cache on successful fetch
    setCachedColors(uid, colors);
    return colors;
  } catch (e) {
    handleFirestoreError('getSavedColors', e);
    // Offline fallback: return cached data
    console.log('[API] Offline - returning cached saved colors');
    return getCachedColors(uid);
  }
};

export const deleteSavedColor = async (uid, colorId) => {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'saved_colors', colorId));
    // Update cache
    const cached = getCachedColors(uid);
    setCachedColors(uid, cached.filter(c => c.id !== colorId));
  } catch (e) {
    handleFirestoreError('deleteSavedColor', e);
    throw e;
  }
};

export const deleteAllSavedColors = async (uid) => {
  if (!auth.currentUser) return;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'saved_colors'));
    const deletePromises = snap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    // Clear cache
    setCachedColors(uid, []);
  } catch (e) {
    handleFirestoreError('deleteAllSavedColors', e);
    throw e;
  }
};

// ============================================
// PUSH SUBSCRIPTIONS — FIRESTORE
// ============================================

export const savePushSubscription = async (uid, sub, skinTone, colorSeason) => {
  if (!auth.currentUser) return;
  try {
    const subId = btoa(sub.endpoint).slice(0, 20).replace(/[^a-zA-Z0-9]/g, '');
    await setDoc(doc(db, 'users', uid, 'push_subscriptions', subId), {
      endpoint: sub.endpoint,
      keys: sub.keys || { p256dh: sub.toJSON?.()?.keys?.p256dh || '', auth: sub.toJSON?.()?.keys?.auth || '' },
      skin_tone: skinTone || '',
      color_season: colorSeason || '',
      created_at: new Date().toISOString(),
    });
    return subId;
  } catch (e) {
    handleFirestoreError('savePushSubscription', e);
    throw e;
  }
};

export const deletePushSubscription = async (uid, subId) => {
  if (!auth.currentUser) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'push_subscriptions', subId));
  } catch (e) {
    handleFirestoreError('deletePushSubscription', e);
    throw e;
  }
};

// ============================================
// ANALYTICS — FIRESTORE
// ============================================

export const logShareEvent = async (uid, skinTone) => {
  if (!auth.currentUser) return;
  try {
    await addDoc(collection(db, 'users', uid, 'events'), {
      type: 'share',
      skin_tone: skinTone || '',
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('logShareEvent error:', e);
    // Do not throw — share event logging should never block the share action
  }
};

// ============================================
// SUBSCRIPTION & USAGE — FIRESTORE
// ============================================

export const getSubscription = async (uid) => {
  if (!auth.currentUser) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'subscription', 'data'));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error('getSubscription error:', e);
    return null;
  }
};

export const activateProSubscription = async (uid) => {
  if (!auth.currentUser) return;
  try {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30); // 30 days from now
    await setDoc(doc(db, 'users', uid, 'subscription', 'data'), {
      plan: 'pro',
      valid_until: validUntil.toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('activateProSubscription error:', e);
    throw e;
  }
};

export const getUsage = async (uid, monthKey) => {
  if (!auth.currentUser) return { analyses_count: 0, outfit_checks_count: 0 };
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'usage', monthKey));
    return snap.exists() ? snap.data() : { analyses_count: 0, outfit_checks_count: 0 };
  } catch (e) {
    console.error('getUsage error:', e);
    return { analyses_count: 0, outfit_checks_count: 0 };
  }
};

export const incrementUsage = async (uid, field) => {
  if (!auth.currentUser) return;
  try {
    const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    const ref = doc(db, 'users', uid, 'usage', monthKey);
    await setDoc(ref, { [field]: increment(1) }, { merge: true });
  } catch (e) {
    console.error('incrementUsage error:', e);
  }
};

// ============================================
// PAYMENT — RAZORPAY
// ============================================

export const createPaymentOrder = () => API.post('/api/payment/create-order');

export const verifyPayment = (payload) => API.post('/api/payment/verify', payload);

// ============================================
// COMMUNITY FEED
// ============================================

export const publishToCommunityFeed = async (uid, paletteData) => {
  if (!auth.currentUser) return null;
  try {
    const ref = await addDoc(collection(db, 'community_feed'), {
      uid, // Used for delete rights later if needed, but not displayed publicly
      ...paletteData,
      likes: 0,
      published_at: new Date().toISOString(),
    });
    return ref.id;
  } catch (e) {
    if (e?.code === 'permission-denied') {
      console.error('Community rules denied.');
    }
    throw e;
  }
};

export const likeCommunityPost = async (postId) => {
  if (!auth.currentUser) return;
  try {
    const ref = doc(db, 'community_feed', postId);
    await setDoc(ref, { likes: increment(1) }, { merge: true });
  } catch (e) {
    console.error('Failed to like post:', e);
  }
};

export const getCommunityFeed = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'community_feed'),
      orderBy('published_at', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('getCommunityFeed failed', e);
    return [];
  }
};
