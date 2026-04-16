/**
 * Custom hook for handling Firebase auth state with profile loading
 * Prevents race conditions and ensures consistent state
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, loadProfile } from '../api/styleApi';

const INITIAL_STATE = {
  user: null,
  profile: null,
  loading: true,
  error: null,
  authError: null,
};

export function useAuthState() {
  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (!firebaseUser) {
        // User logged out
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
          authError: null,
        });
        return;
      }

      // User is logging in
      try {
        setState((prev) => ({
          ...prev,
          user: { 
            name: firebaseUser.displayName || firebaseUser.email, 
            email: firebaseUser.email,
            uid: firebaseUser.uid,
          },
          loading: true,
          error: null,
        }));

        // Load profile from Firestore
        const profile = await loadProfile(firebaseUser.uid);

        if (!isMounted) return;

        if (profile) {
          // Sync to localStorage (as cache, but FIREBASE IS BOSS)
          try {
            const firestoreEntry = {
              skinTone: profile.skinTone || profile.skin_tone,
              undertone: profile.undertone,
              season: profile.season || profile.color_season,
              skinHex: profile.skinHex || profile.skin_hex,
              confidence: profile.confidence,
              gender: profile.gender,
              date: profile.date || new Date().toLocaleDateString('en-IN'),
              timestamp: profile.timestamp || Date.now(),
              fullData: profile.fullData || null,
            };

            // STRICT OVERWRITE: Firebase is the truth!
            localStorage.setItem('sg_last_analysis', JSON.stringify(firestoreEntry));

            // Apply saved preferences globally
            if (profile.gender) localStorage.setItem('sg_gender', profile.gender);
            if (profile.gender_mode) localStorage.setItem('sg_gender', profile.gender_mode); // Backward compat
            if (profile.language) localStorage.setItem('sg_language', profile.language);
            
            // Sync true counts from Firebase root document (fetched securely in loadProfile)
            localStorage.setItem('sg_analysis_count', (profile.analysisHistoryCount || 0).toString());
            localStorage.setItem('sg_wardrobe_count', (profile.wardrobeCount || 0).toString());
            localStorage.setItem('sg_colors_count', (profile.savedColorsCount || 0).toString());
          } catch (localStorageErr) {
            console.warn('localStorage sync failed:', localStorageErr);
            // Don't fail auth for localStorage issues
          }
        }

        setState((prev) => ({
          ...prev,
          profile,
          loading: false,
          error: null,
        }));
      } catch (profileErr) {
        console.error('Profile loading failed:', profileErr);

        if (!isMounted) return;

        setState((prev) => ({
          ...prev,
          profile: null,
          loading: false,
          error: profileErr.message || 'Failed to load profile',
          authError: true,
        }));

        // Retry profile load after 3 seconds
        const retryTimer = setTimeout(async () => {
          if (!isMounted) return;
          console.log('Retrying profile load...');
          try {
            const retryProfile = await loadProfile(firebaseUser.uid);
            setState((prev) => ({
              ...prev,
              profile: retryProfile,
              error: null,
              authError: false,
            }));
          } catch (retryErr) {
            console.error('Profile retry failed:', retryErr);
            if (isMounted) {
              setState((prev) => ({
                ...prev,
                error: 'Failed to load profile. Please refresh.',
                authError: true,
              }));
            }
          }
        }, 3000);

        return () => clearTimeout(retryTimer);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return state;
}
