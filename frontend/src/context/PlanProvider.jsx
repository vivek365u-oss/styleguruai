import { useState, useEffect, useCallback } from 'react';
import { PlanContext } from './PlanContext';
import { getUserLimits } from '../api/styleApi';
import { auth, db } from '../firebase';
import { onSnapshot, doc } from 'firebase/firestore';

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState('free');
  const [usage, setUsage] = useState({ 
    adFreeAnalysesLeft: 3, 
    analysisHistoryCount: 0, 
    adFreeOutfitChecks: 3 
  });
  const [isPro, setIsPro] = useState(false);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshPlan = useCallback(async () => {
    // Keep this for manual refreshes if needed, but onSnapshot handles reactivity
    if (!auth.currentUser) return;
    try {
      const res = await getUserLimits();
      if (res.success && res.data) {
        setIsPro(res.data.is_pro || false);
        setPlan(res.data.planName || 'free');
        setCoins(res.data.coins || 0);
        setUsage({
          adFreeAnalysesLeft: res.data.adFreeAnalysesLeft ?? 3,
          analysisHistoryCount: res.data.analysisHistoryCount ?? 0,
          adFreeOutfitChecks: res.data.adFreeOutfitChecks ?? 3,
        });
      }
    } catch (err) { }
  }, []);

  useEffect(() => {
    let unsubscribeSnap = null;
    
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // ── Real-time Listener ────────────────
        unsubscribeSnap = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsPro(data.is_pro || false);
            setPlan(data.planName || 'free');
            setCoins(data.coins || 0);
            setUsage({
              adFreeAnalysesLeft: data.adFreeAnalysesLeft ?? 3,
              analysisHistoryCount: data.analysisHistoryCount ?? 0,
              adFreeOutfitChecks: data.adFreeOutfitChecks ?? 3,
            });
            console.log("[PlanProvider] Real-time sync updated:", data.is_pro ? "PRO" : "FREE");
          } else {
            // Document doesn't exist, try refreshing via API once
            refreshPlan();
          }
          setLoading(false);
        }, (err) => {
          console.error("[PlanProvider] Snap error:", err);
          refreshPlan(); // Fallback to API if snap fails
        });
      } else {
        if (unsubscribeSnap) unsubscribeSnap();
        setIsPro(false);
        setPlan('free');
        setCoins(0);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnap) unsubscribeSnap();
    };
  }, [refreshPlan]);

  return (
    <PlanContext.Provider value={{ plan, usage, isPro, loading, refreshPlan, coins, setUsage, setCoins }}>
      {children}
    </PlanContext.Provider>
  );
}
