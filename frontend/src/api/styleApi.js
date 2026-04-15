import axios from 'axios';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, limit, deleteDoc, increment, updateDoc } from 'firebase/firestore';
import { compressImage, validateImageFile } from '../utils/imageCompression';
import { retryRequest, startKeepAlive, healthCheck } from '../utils/apiRetry';

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000 // 30s global timeout
});

export { auth, API, db };

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
// ACCOUNT DESTRUCTION — FIRESTORE & AUTH
// ============================================

/**
 * Performs a deep wipe of all user data in Firestore and deletes the Auth account.
 */
export const destroyUserAccount = async (uid) => {
  if (!uid || auth.currentUser?.uid !== uid) throw new Error('Unauthorized');

  const collectionsToWipe = [
    'wardrobe',
    'history',
    'saved_colors',
    'outfit_logs',
    'push_subscriptions',
    'events'
  ];

  try {
    console.log(`[Security] Initiating deep wipe for user: ${uid}`);

    // 1. Wipe Sub-collections
    for (const collName of collectionsToWipe) {
      const collRef = collection(db, 'users', uid, collName);
      const snap = await getDocs(collRef);
      const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      console.log(`[Security] Wiped collection: ${collName}`);
    }

    // 2. Wipe Profile Docs
    const profileDocs = ['data', 'preferences', 'insights', 'primary'];
    for (const docName of profileDocs) {
      await deleteDoc(doc(db, 'users', uid, 'profile', docName));
    }
    console.log('[Security] Wiped profile documentation');

    // 3. Wipe Main User Doc
    await deleteDoc(doc(db, 'users', uid));
    console.log('[Security] Wiped root user metadata');

    // 4. Delete Auth User (Must be recently logged in)
    const { deleteUser } = await import('firebase/auth');
    await deleteUser(auth.currentUser);
    console.log('[Security] Auth account destroyed successfully');

    return true;
  } catch (err) {
    console.error('[Security] Deep wipe failed partially:', err);
    throw err;
  }
};

// ============================================
// HISTORY — FIRESTORE
// ============================================

export const saveHistory = async (rawDetails) => {
  const user = auth.currentUser;
  if (!user) return;
  
  // Normalize data for UI consistency
  const skinToneObj = rawDetails.analysis?.skin_tone || rawDetails.skin_tone;
  const skinColorObj = rawDetails.analysis?.skin_color || rawDetails.skin_color;
  const gender = rawDetails.gender || localStorage.getItem('sg_gender') || 'male';
  
  const historyEntry = {
    skinTone: skinToneObj?.category || 'medium',
    undertone: skinToneObj?.undertone || 'neutral',
    season: skinToneObj?.color_season || 'Spring',
    confidence: skinToneObj?.confidence || 'medium',
    skinHex: skinColorObj?.hex || '#C68642',
    gender: gender,
    date: new Date().toISOString(),
    timestamp: Date.now(),
    fullData: rawDetails
  };

  const entry = { ...historyEntry };
  
  try {
    const docRef = await addDoc(collection(db, 'users', user.uid, 'history'), entry);
    // ── ATOMIC COUNTER SYNC ──
    await updateDoc(doc(db, 'users', user.uid), {
      analysisHistoryCount: increment(1)
    });

    // ── PROMOTE TO PRIMARY PROFILE ──
    const profileRef = doc(db, 'users', user.uid, 'profile', 'data');
    await setDoc(profileRef, {
      ...historyEntry,
      last_analysis_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { merge: true });

    // ── SYNC LOCAL CACHE ──
    localStorage.setItem('sg_gender', gender);
    localStorage.setItem('sg_last_analysis', JSON.stringify(entry));

    console.log('[API] History saved and profile promoted:', docRef.id);
  } catch (err) {
    console.error('[API] Failed to save history to Firestore:', err);
    throw err;
  }
};

export const getHistory = async (limitCount = 10) => {
  const user = auth.currentUser;
  if (!user) return { data: { total: 0, history: [] } };

  try {
    const q = query(
      collection(db, 'users', user.uid, 'history'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const history = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Merge with temp history if any
    let finalHistory = history;
    try {
      const temp = JSON.parse(localStorage.getItem('sg_temp_history') || '[]');
      if (temp.length > 0) {
        finalHistory = [...temp, ...history].slice(0, 10);
      }
    } catch {}

    return { data: { total: finalHistory.length, history: finalHistory } };
  } catch (err) {
    console.error('[API] getHistory failed:', err);
    // If complex query fails (likely index error), try simple query
    try {
      const simpleQ = query(collection(db, 'users', user.uid, 'history'), limit(limitCount));
      const snap = await getDocs(simpleQ);
      const history = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort manually
      history.sort((a, b) => new Date(b.date) - new Date(a.date));
      return { data: { total: history.length, history } };
    } catch (e) {
       console.error('[API] Simple fallback query also failed:', e);
       return { data: { total: 0, history: [] } };
    }
  }
};

// Coins logic removed

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

export const analyzeImageSeasonal = async (file, season, lang = 'en', onProgress, gender = 'male') => {
  try {
    validateImageFile(file);
    const compressedFile = await compressImage(file);
    console.log(`✓ Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
    
    return await retryRequest(async () => {
      const formData = new FormData();
      formData.append('file', compressedFile);
      return API.post(`/api/analyze/seasonal?season=${season}&lang=${lang}&gender=${gender}`, formData, {
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

export const checkOutfitCompatibility = async (selfieFile, outfitFile, lang = 'en', gender = 'male', clothingType = 'top', onProgress) => {
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
      formData.append('gender', gender);
      formData.append('clothing_type', clothingType);
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

export const getStyleInsights = async (skinTone, undertone, wardrobeItems, lang = 'en', lifestyle = 'other', gender = 'men') => {
  try {
    const res = await API.post('/api/v1/style/navigator/insights', {
      skin_tone: skinTone,
      undertone: undertone,
      wardrobe_items: wardrobeItems,
      lang: lang,
      lifestyle: lifestyle,
      gender: gender
    });
    return res.data;
  } catch (error) {
    console.error('Failed to get style insights:', error);
    throw error;
  }
};


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

export const savePrimaryProfile = async (uid, profileData) => {
  if (!auth.currentUser) return;
  try {
    await setDoc(doc(db, 'users', uid, 'profile', 'primary'), {
      ...profileData,
      locked_at: new Date().toISOString(),
    });
    localStorage.setItem('sg_primary_profile', JSON.stringify(profileData));
  } catch (e) {
    handleFirestoreError('savePrimaryProfile', e);
    throw e;
  }
};

export const loadPrimaryProfile = async (uid) => {
  if (!auth.currentUser) return null;
  try {
    // Check cache first
    const cached = localStorage.getItem('sg_primary_profile');
    if (cached) return JSON.parse(cached);

    const snap = await getDoc(doc(db, 'users', uid, 'profile', 'primary'));
    if (snap.exists()) {
      const data = snap.data();
      localStorage.setItem('sg_primary_profile', JSON.stringify(data));
      return data;
    }
    return null;
  } catch (e) {
    handleFirestoreError('loadPrimaryProfile', e);
    return null;
  }
};

export const saveUserPreferences = async (uid, preferences) => {
  if (!auth.currentUser) return null;
  try {
    await setDoc(doc(db, 'users', uid, 'profile', 'preferences'), {
      ...preferences,
      updated_at: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving user preferences:', e);
    return false;
  }
};

export const loadUserPreferences = async (uid) => {
  if (!auth.currentUser) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'profile', 'preferences'));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error('Error loading user preferences:', e);
    return null;
  }
};

export const saveStyleInsights = async (uid, insights) => {
  if (!auth.currentUser) return;
  try {
    const data = {
      ...insights,
      saved_at: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', uid, 'profile', 'insights'), data);
    localStorage.setItem('sg_locked_insights', JSON.stringify(data));
  } catch (e) {
    handleFirestoreError('saveStyleInsights', e);
    throw e;
  }
};

export const loadStyleInsights = async (uid) => {
  if (!auth.currentUser) return null;
  try {
    // Check cache
    const cached = localStorage.getItem('sg_locked_insights');
    if (cached) return JSON.parse(cached);

    const snap = await getDoc(doc(db, 'users', uid, 'profile', 'insights'));
    if (snap.exists()) {
      const data = snap.data();
      localStorage.setItem('sg_locked_insights', JSON.stringify(data));
      return data;
    }
    return null;
  } catch (e) {
    handleFirestoreError('loadStyleInsights', e);
    return null;
  }
};

export const updateUserFeedback = async (uid, category, value, signal) => {
  if (!auth.currentUser) return null;
  try {
    const prefRef = doc(db, 'users', uid, 'profile', 'preferences');
    const signalField = signal === 'like' ? 'feedback_likes' : 'feedback_rejects';
    
    // We increment/append to the feedback object
    const snap = await getDoc(prefRef);
    let prefs = snap.exists() ? snap.data() : {};
    let feedback = prefs[signalField] || {};
    
    feedback[category] = (feedback[category] || []);
    if (!feedback[category].includes(value)) {
        feedback[category].push(value);
    }
    
    await setDoc(prefRef, {
      [signalField]: feedback,
      updated_at: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (e) {
    console.error('Error updating feedback:', e);
    return false;
  }
};

// ============================================
// WARDROBE — FIRESTORE
// ============================================

export const saveWardrobeItem = async (uid, item) => {
  if (!auth.currentUser) return null;
  try {
    // 1. Strict Gender Safety Net
    const isFemaleCat = ['cat_saree_silk', 'cat_kurti', 'cat_makeup', 'cat_dress', 'cat_top', 'cat_skirt', 'lehenga'].some(x => item.category?.toLowerCase().includes(x));
    const isMaleCat = ['sherwani', 'cat_formal_shirt', 'tuxedo', 'cat_kurta_set', 'cat_polo', 'cat_blazer'].some(x => item.category?.toLowerCase().includes(x));
    
    let safetyGender = item.gender || 'male';
    if (isFemaleCat) safetyGender = 'female';
    if (isMaleCat && !isFemaleCat) safetyGender = 'male';

    // 2. Formality & Occasion Logic Mapping
    let formality = 5;
    const tags = item.tags || [];
    if (['tag_office', 'tag_traditional', 'tag_party'].some(t => tags.includes(t)) || isFemaleCat || isMaleCat) formality = 8;
    if (tags.includes('tag_gym') || item.category === 'cat_sneakers') formality = 2;

    const seasons = [];
    if (item.fabric === 'fabric_wool' || item.fabric === 'fabric_leather') seasons.push('Winter', 'Autumn');
    else if (item.fabric === 'fabric_linen' || item.fabric === 'fabric_cotton') seasons.push('Summer', 'Spring');
    else seasons.push('All-Season');

    const enhancedItem = {
      ...item,
      // Backward Compatability Rules
      tags: tags,
      gender: safetyGender, // Explicit override if category demands it
      // Smart Schema Fields (Phase 2 DNA compatibility)
      main_category: item.category?.includes('top') || item.category?.includes('shirt') ? 'Topwear' : item.category?.includes('bottom') || item.category?.includes('pant') || item.category?.includes('jeans') ? 'Bottomwear' : 'Apparel',
      primary_color_name: item.color_name || 'Unknown',
      primary_color_hex: item.hex || '#000000',
      occasions: tags.map(t => t.replace('tag_', '')),
      seasons: seasons,
      formality_score: formality,
      saved_at: new Date().toISOString(),
    };

    const ref = await addDoc(collection(db, 'users', uid, 'wardrobe'), enhancedItem);
    // ── SYNC COUNTER (FIX) ──
    await updateDoc(doc(db, 'users', uid), {
      wardrobeCount: increment(1)
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
  // Disabled as per user requirement "nothing locally"
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
    // ── SYNC COUNTER (FIX) ──
    await updateDoc(doc(db, 'users', uid), {
      wardrobeCount: increment(-1)
    });
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
  // Disabled as per user requirement "nothing locally"
};

export const saveSavedColor = async (uid, color) => {
  if (!auth.currentUser) return null;
  try {
    const ref = await addDoc(collection(db, 'users', uid, 'saved_colors'), {
      ...color,
      saved_at: new Date().toISOString(),
    });
    // ── SYNC COUNTER (FIX) ──
    await updateDoc(doc(db, 'users', uid), {
      savedColorsCount: increment(1)
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

export const logEvent = async (eventName, meta = {}) => {
  try {
    const user = auth.currentUser;
    const uid = user ? user.uid : 'anonymous';
    if (!user) {
      console.log(`[Analytics] ${eventName}`, meta);
      return;
    }
    await addDoc(collection(db, 'users', uid, 'events'), {
      type: eventName,
      ...meta,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('logEvent error:', e);
  }
};

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
// USAGE LIMITS & MONETIZATION
// ============================================

export const getUserLimits = async () => {
  try {
    const res = await API.get('/api/users/profile');
    return res.data;
  } catch (error) {
    console.error('Failed to get user limits:', error);
    return { success: false, data: {} };
  }
};

export const consumeUserLimit = async (action) => {
  try {
    const res = await API.post('/api/users/consume-action', { action });
    return res.data;
  } catch (error) {
    if (error.response && error.response.status === 400 && error.response.data?.requires_ad) {
        return { success: false, requires_ad: true };
    }
    console.error(`Failed to consume limit for ${action}:`, error);
    return { success: false, error: 'Failed to consume limit' };
  }
};

export const createRazorpayOrder = async (tier) => {
  try {
    const res = await API.post('/api/payment/create-order', { tier });
    return res.data;
  } catch (error) {
    console.error('Failed to create Razorpay order:', error);
    throw error;
  }
};

export const verifyRazorpayPayment = async (verifyData) => {
  try {
    const res = await API.post('/api/payment/verify', verifyData);
    return res.data;
  } catch (error) {
    console.error('Failed to verify Razorpay payment:', error);
    throw error;
  }
};

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

// ============================================
// OUTFIT LOGS — FIRESTORE
// ============================================

export const logDailyOutfit = async (uid, outfitData) => {
  if (!auth.currentUser) return null;
  const today = new Date().toLocaleDateString('en-CA');
  try {
    await setDoc(doc(db, 'users', uid, 'outfit_logs', today), {
      ...outfitData,
      logged_at: new Date().toISOString(),
      date: today
    });
    return true;
  } catch (e) {
    handleFirestoreError('logDailyOutfit', e);
    return false;
  }
};

export const getDailyOutfitLogs = async (uid, limitCount = 31) => {
  if (!auth.currentUser) return [];
  try {
    const q = query(
      collection(db, 'users', uid, 'outfit_logs'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    handleFirestoreError('getDailyOutfitLogs', e);
    return [];
  }
};

// ============================================
// SELFIE → STYLE RECOMMENDATION
// ============================================

export const analyzeSelfieStyle = async (file, gender = 'male', lang = 'en', onProgress) => {
  try {
    validateImageFile(file);
    const compressedFile = await compressImage(file);
    console.log(`✓ Selfie compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);

    return await retryRequest(async () => {
      const formData = new FormData();
      formData.append('file', compressedFile);
      return API.post(`/api/analyze/selfie-style?gender=${gender}&lang=${lang}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
        },
        timeout: 90000,
      });
    }, 2, 1500);
  } catch (error) {
    console.error('Selfie style analysis failed:', error);
    throw error;
  }
};

export const saveSelfieStyleHistory = async (uid, data) => {
  if (!auth.currentUser) return;
  try {
    await addDoc(collection(db, 'users', uid, 'selfie_style_history'), {
      face_shape: data.face_shape?.shape || 'oval',
      skin_tone: data.skin_analysis?.skin_tone || '',
      gender: data.gender || 'male',
      timestamp: new Date().toISOString(),
      fullData: data,
    });
  } catch (e) {
    console.warn('[API] Failed to save selfie style history:', e);
  }
};

