/**
 * Custom hook for handling Firebase auth state with profile loading
 * Prevents race conditions and ensures consistent state
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, loadProfile, loadPrimaryProfile } from '../api/styleApi';

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

        // Load profile and primary Style DNA from Firestore
        const profilePromise = Promise.all([
          loadProfile(firebaseUser.uid),
          loadPrimaryProfile(firebaseUser.uid)
        ]);
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve([null, null]), 5000)
        );
        const [profile, primaryDna] = await Promise.race([profilePromise, timeoutPromise]);

        if (!isMounted) return;

        const effectiveProfile = primaryDna || profile;

        if (effectiveProfile) {
          // Sync to localStorage (as cache, but FIREBASE IS BOSS)
          try {
            const rawGender = primaryDna?.gender || profile?.gender || profile?.gender_mode || 'male';
            const normalizedGender = (typeof rawGender === 'string' && (rawGender.toLowerCase().includes('female') || rawGender.toLowerCase() === 'women')) ? 'female' : 'male';

            const firestoreEntry = {
              skinTone: primaryDna?.skinTone || primaryDna?.skin_tone?.category || profile?.skinTone || profile?.skin_tone,
              undertone: primaryDna?.undertone || primaryDna?.skin_tone?.undertone || profile?.undertone,
              season: primaryDna?.colorSeason || primaryDna?.season || profile?.season || profile?.color_season,
              skinHex: primaryDna?.skinHex || primaryDna?.skin_hex || profile?.skinHex || profile?.skin_hex,
              confidence: primaryDna?.confidence || profile?.confidence,
              gender: normalizedGender,
              bestColors: primaryDna?.bestColors || [],
              date: profile?.date || new Date().toLocaleDateString('en-IN'),
              timestamp: primaryDna?.updatedAt || profile?.timestamp || Date.now(),
              fullData: profile?.fullData || null,
            };

            // STRICT OVERWRITE: Firebase is the truth!
            localStorage.setItem('sg_last_analysis', JSON.stringify(firestoreEntry));
            if (primaryDna) {
              localStorage.setItem('sg_primary_profile', JSON.stringify({ ...primaryDna, gender: normalizedGender }));
            }

            // Apply saved preferences globally
            localStorage.setItem('sg_gender', normalizedGender);
            if (profile?.language) localStorage.setItem('sg_language', profile.language);
            
            // Sync true counts from Firebase root document (fetched securely in loadProfile)
            localStorage.setItem('sg_analysis_count', (profile?.analysisHistoryCount || 0).toString());
            localStorage.setItem('sg_wardrobe_count', (profile?.wardrobeCount || 0).toString());
            localStorage.setItem('sg_colors_count', (profile?.savedColorsCount || 0).toString());
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
              loading: false, // BUG #4 fix: clear loading so AuthErrorUI dismisses
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
