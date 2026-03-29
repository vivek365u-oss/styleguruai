import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, getSubscription, getUsage } from '../api/styleApi';

const PlanContext = createContext(null);

const getCurrentMonthKey = () => new Date().toISOString().slice(0, 7);

const isPlanPro = (subscription) => {
  if (!subscription) return false;
  if (subscription.plan !== 'pro') return false;
  return new Date(subscription.valid_until) > new Date();
};

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState('free');
  const [usage, setUsage] = useState({ analyses_count: 0, outfit_checks_count: 0 });
  const [isPro, setIsPro] = useState(false);
  const [validUntil, setValidUntil] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    try {
      const [sub, usageData] = await Promise.all([
        getSubscription(user.uid),
        getUsage(user.uid, getCurrentMonthKey()),
      ]);
      const pro = isPlanPro(sub);
      setPlan(sub?.plan || 'free');
      setIsPro(pro);
      setValidUntil(sub?.valid_until || null);
      setUsage(usageData);
    } catch (e) {
      console.error('PlanContext load error:', e);
      setPlan('free');
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const refreshPlan = useCallback(async () => {
    setLoading(true);
    await loadPlan();
  }, [loadPlan]);

  return (
    <PlanContext.Provider value={{ plan, usage, isPro, validUntil, loading, refreshPlan, setUsage }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}

export default PlanContext;
