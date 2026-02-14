import { createContext, useMemo, useState } from 'react';
import { loadGoals, saveGoals } from '../utils/storage';

export const GoalContext = createContext(null);

export function GoalProvider({ children }) {
  const [goals, setGoals] = useState(loadGoals());
  const persist = (next) => { setGoals(next); saveGoals(next); };

  const createGoal = (goal) => persist([{ ...goal, id: crypto.randomUUID(), createdAt: Date.now() }, ...goals]);
  const updateGoal = (id, updates) => persist(goals.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  const deleteGoal = (id) => persist(goals.filter((g) => g.id !== id));

  return <GoalContext.Provider value={useMemo(() => ({ goals, createGoal, updateGoal, deleteGoal }), [goals])}>{children}</GoalContext.Provider>;
}
