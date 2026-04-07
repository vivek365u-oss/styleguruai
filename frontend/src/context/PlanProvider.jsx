import { useState, useEffect, useCallback } from 'react';
import { PlanContext } from './PlanContext';

export function PlanProvider({ children }) {
  // Simplified for a fully free experience
  const [plan] = useState('pro');
  const [usage] = useState({ analyses_count: 0, outfit_checks_count: 0 });
  const [isPro] = useState(true);
  const [validUntil] = useState(null);
  const [coins] = useState(9999);
  const [loading] = useState(false);

  const refreshPlan = useCallback(async () => {
    // No-op in free mode
  }, []);

  const setUsage = () => {};
  const setCoins = () => {};

  return (
    <PlanContext.Provider value={{ plan, usage, isPro, validUntil, loading, refreshPlan, setUsage, coins, setCoins }}>
      {children}
    </PlanContext.Provider>
  );
}

