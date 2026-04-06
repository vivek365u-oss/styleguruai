import { createContext, useContext } from 'react';

export const PlanContext = createContext(null);

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
