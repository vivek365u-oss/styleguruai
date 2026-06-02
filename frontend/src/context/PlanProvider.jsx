import { useState, useEffect, useCallback } from 'react';
import { PlanContext } from './PlanContext';
import { getUserLimits } from '../api/styleApi';
import { auth, db } from '../firebase';
import { onSnapshot, doc } from 'firebase/firestore';

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState('pro');
  const [usage, setUsage] = useState({ 
    adFreeAnalysesLeft: 9999, 
    analysisHistoryCount: 0, 
    adFreeOutfitChecks: 9999,
    wardrobeCount: 0,
    savedColorsCount: 0
  });
  const [isPro] = useState(true);
  const [coins] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshPlan = useCallback(async () => {
    // Platform is now fully free, no need to query limits
  }, []);

  useEffect(() => {
    let unsubscribeSnap = null;
    
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        unsubscribeSnap = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUsage({
              adFreeAnalysesLeft: 9999,
              analysisHistoryCount: data.analysisHistoryCount ?? 0,
              adFreeOutfitChecks: 9999,
              wardrobeCount: data.wardrobeCount ?? 0,
              savedColorsCount: data.savedColorsCount ?? 0,
            });
          }
          setLoading(false);
        }, (err) => {
          console.warn("[PlanProvider] Snap error:", err);
          setLoading(false);
        });
      } else {
        if (unsubscribeSnap) unsubscribeSnap();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnap) unsubscribeSnap();
    };
  }, []);

  return (
    <PlanContext.Provider value={{ plan, usage, isPro: true, loading, refreshPlan, coins, setUsage }}>
      {children}
    </PlanContext.Provider>
  );
}
