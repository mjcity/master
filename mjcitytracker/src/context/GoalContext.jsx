import { createContext, useEffect, useMemo, useState } from 'react';
import { loadGoals, saveGoals } from '../utils/storage';
import { supabase, supabaseEnabled } from '../lib/supabase';

export const GoalContext = createContext(null);

export function GoalProvider({ children }) {
  const [goals, setGoals] = useState(loadGoals());
  const [goalsLoading, setGoalsLoading] = useState(false);

  useEffect(() => {
    if (!supabaseEnabled) return;

    let mounted = true;

    const loadRemoteGoals = async () => {
      setGoalsLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) {
        if (mounted) setGoalsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!mounted) return;
      if (!error && data) {
        const mapped = data.map((g) => ({
          id: g.id,
          userId: g.user_id,
          title: g.title,
          description: g.description || '',
          category: g.category || 'Personal',
          progress: g.progress || 0,
          dueDate: g.due_date || '',
          completed: !!g.completed,
          createdAt: new Date(g.created_at).getTime(),
          media: g.media || null
        }));
        setGoals(mapped);
      }
      setGoalsLoading(false);
    };

    loadRemoteGoals();
  }, []);

  const createGoal = async (goal) => {
    if (supabaseEnabled) {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) throw new Error('Please log in again.');

      const payload = {
        user_id: userId,
        title: goal.title,
        description: goal.description || '',
        category: goal.category || 'Personal',
        progress: Number(goal.progress || 0),
        due_date: goal.dueDate || null,
        completed: !!goal.completed,
        media: goal.media || null
      };

      const { data, error } = await supabase.from('goals').insert(payload).select().single();
      if (error) throw error;

      const created = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        description: data.description || '',
        category: data.category || 'Personal',
        progress: data.progress || 0,
        dueDate: data.due_date || '',
        completed: !!data.completed,
        createdAt: new Date(data.created_at).getTime(),
        media: data.media || null
      };
      setGoals((prev) => [created, ...prev]);
      return;
    }

    const next = [{ ...goal, id: crypto.randomUUID(), createdAt: Date.now() }, ...goals];
    setGoals(next);
    saveGoals(next);
  };

  const updateGoal = async (id, updates) => {
    if (supabaseEnabled) {
      const payload = {};
      if ('title' in updates) payload.title = updates.title;
      if ('description' in updates) payload.description = updates.description;
      if ('category' in updates) payload.category = updates.category;
      if ('progress' in updates) payload.progress = Number(updates.progress || 0);
      if ('dueDate' in updates) payload.due_date = updates.dueDate || null;
      if ('completed' in updates) payload.completed = !!updates.completed;
      if ('media' in updates) payload.media = updates.media;

      const { data, error } = await supabase.from('goals').update(payload).eq('id', id).select().single();
      if (error) throw error;

      setGoals((prev) => prev.map((g) => (g.id === id ? {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        description: data.description || '',
        category: data.category || 'Personal',
        progress: data.progress || 0,
        dueDate: data.due_date || '',
        completed: !!data.completed,
        createdAt: new Date(data.created_at).getTime(),
        media: data.media || null
      } : g)));
      return;
    }

    const next = goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
    setGoals(next);
    saveGoals(next);
  };

  const deleteGoal = async (id) => {
    if (supabaseEnabled) {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
      setGoals((prev) => prev.filter((g) => g.id !== id));
      return;
    }

    const next = goals.filter((g) => g.id !== id);
    setGoals(next);
    saveGoals(next);
  };

  return <GoalContext.Provider value={useMemo(() => ({ goals, createGoal, updateGoal, deleteGoal, goalsLoading }), [goals, goalsLoading])}>{children}</GoalContext.Provider>;
}
