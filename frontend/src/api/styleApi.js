import axios from 'axios';
import { auth, googleProvider, db } from '../firebase';
export { auth };
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000' });

// Auto-attach Firebase token to every request
API.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
// ANALYSIS APIs
// ============================================

export const analyzeImage = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/api/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
    timeout: 30000,
  });
};

export const analyzeImageFemale = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/api/analyze/female', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
    timeout: 30000,
  });
};

export const analyzeImageSeasonal = (file, season, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post(`/api/analyze/seasonal?season=${season}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
    timeout: 30000,
  });
};

export const checkOutfitCompatibility = (selfieFile, outfitFile, onProgress) => {
  const formData = new FormData();
  formData.append('selfie', selfieFile);
  formData.append('outfit', outfitFile);
  return API.post('/api/outfit/check', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
    timeout: 30000,
  });
};

export const testTone = (tone, undertone = 'warm') =>
  API.get(`/api/test/${tone}?undertone=${undertone}`);