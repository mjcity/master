import { useContext } from 'react';
import { GoalContext } from '../context/GoalContext';

export const useGoals = () => {
  const ctx = useContext(GoalContext);
  if (!ctx) throw new Error('useGoals must be used inside GoalProvider');
  return ctx;
};
