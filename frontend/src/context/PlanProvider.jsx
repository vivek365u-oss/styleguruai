import { useState, useEffect, useCallback } from 'react';
import { PlanContext } from './PlanContext';
import { getUserLimits } from '../api/styleApi';
import { auth } from '../firebase';

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
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
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
    } catch (err) {
      console.error("Failed to load plan:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        refreshPlan();
      } else {
        setIsPro(false);
        setPlan('free');
        setCoins(0);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [refreshPlan]);

  return (
    <PlanContext.Provider value={{ plan, usage, isPro, loading, refreshPlan, coins, setUsage, setCoins }}>
      {children}
    </PlanContext.Provider>
  );
}
