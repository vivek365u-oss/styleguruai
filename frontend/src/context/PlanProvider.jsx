import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, getSubscription, getUsage } from '../api/styleApi';
import axios from 'axios';

import { PlanContext } from './PlanContext';

const getCurrentMonthKey = () => new Date().toISOString().slice(0, 7);

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
});

API.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (e) { }
  }
  return config;
});

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState('free');
  const [usage, setUsage] = useState({ analyses_count: 0, outfit_checks_count: 0 });
  const [isPro, setIsPro] = useState(false);
  const [validUntil, setValidUntil] = useState(null);
  const [coins, setCoins] = useState(2);
  const [loading, setLoading] = useState(true);

  const loadPlan = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    try {
      const [sub, usageData, profileRes] = await Promise.all([
        getSubscription(user.uid),
        getUsage(user.uid, getCurrentMonthKey()),
        API.get('/api/users/profile').catch(() => null)
      ]);

      let pro = false;
      let expiry = sub?.valid_until;

      // Fallback hybrid logic
      if (profileRes?.data?.success) {
        setCoins(profileRes.data.data.coins_balance || 0);
        pro = profileRes.data.data.is_pro || false;
        if (profileRes.data.data.premium_until) expiry = profileRes.data.data.premium_until;
      }

      setPlan(pro ? 'pro' : (sub?.plan || 'free'));
      setIsPro(pro);
      setValidUntil(expiry || null);
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
    <PlanContext.Provider value={{ plan, usage, isPro, validUntil, loading, refreshPlan, setUsage, coins, setCoins }}>
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
