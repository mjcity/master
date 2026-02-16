import { createContext, useEffect, useMemo, useState } from 'react';
import { loadGoals, saveGoals, seedGoals } from '../utils/storage';
import { supabase, supabaseEnabled } from '../lib/supabase';

export const GoalContext = createContext(null);

const weekKey = (d = new Date()) => {
  const dt = new Date(d);
  const day = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - day);
  return dt.toISOString().slice(0, 10);
};

function withMeta(goal) {
  const media = goal.media || {};
  return {
    ...goal,
    media: {
      ...media,
      subtasks: media.subtasks || [],
      weeklyStatus: media.weeklyStatus || 'thisWeek',
      weeklyBucket: media.weeklyBucket || weekKey(),
      carryOverCount: Number(media.carryOverCount || 0),
      freezeTokens: Number(media.freezeTokens ?? 2),
      streakCount: Number(media.streakCount || 0),
      lastCheckinDate: media.lastCheckinDate || null,
      consistencyHistory: media.consistencyHistory || [],
      journal: media.journal || []
    }
  };
}

function mapRow(g) {
  return withMeta({
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
  });
}

function applyCarryOver(goal) {
  const wk = weekKey();
  if (goal.media.weeklyBucket === wk) return goal;
  if (goal.media.weeklyStatus === 'thisWeek' && !goal.completed) {
    return withMeta({
      ...goal,
      media: {
        ...goal.media,
        weeklyStatus: 'nextWeek',
        weeklyBucket: wk,
        carryOverCount: Number(goal.media.carryOverCount || 0) + 1
      }
    });
  }
  return withMeta({ ...goal, media: { ...goal.media, weeklyBucket: wk } });
}

export function GoalProvider({ children }) {
  const [goals, setGoals] = useState(loadGoals().map(withMeta));
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
        const mapped = data.map(mapRow).map(applyCarryOver);
        setGoals([...mapped, ...seedGoals.map(withMeta)]);
      }
      setGoalsLoading(false);
    };

    loadRemoteGoals();
  }, []);

  const createGoal = async (goal) => {
    const enriched = withMeta(goal);
    if (supabaseEnabled) {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) throw new Error('Please log in again.');

      const payload = {
        user_id: userId,
        title: enriched.title,
        description: enriched.description || '',
        category: enriched.category || 'Personal',
        progress: Number(enriched.progress || 0),
        due_date: enriched.dueDate || null,
        completed: !!enriched.completed,
        media: enriched.media || null
      };

      const { data, error } = await supabase.from('goals').insert(payload).select().single();
      if (error) throw error;

      setGoals((prev) => [mapRow(data), ...prev]);
      return;
    }

    const next = [{ ...enriched, id: crypto.randomUUID(), createdAt: Date.now() }, ...goals];
    setGoals(next);
    saveGoals(next);
  };

  const updateGoal = async (id, updates) => {
    if (id?.startsWith('seed-')) {
      setGoals((prev) => prev.map((g) => (g.id === id ? withMeta({ ...g, ...updates, media: { ...g.media, ...(updates.media || {}) } }) : g)));
      return;
    }

    if (supabaseEnabled) {
      const current = goals.find((g) => g.id === id);
      const payload = {};
      if ('title' in updates) payload.title = updates.title;
      if ('description' in updates) payload.description = updates.description;
      if ('category' in updates) payload.category = updates.category;
      if ('progress' in updates) payload.progress = Number(updates.progress || 0);
      if ('dueDate' in updates) payload.due_date = updates.dueDate || null;
      if ('completed' in updates) payload.completed = !!updates.completed;
      if ('media' in updates) payload.media = { ...(current?.media || {}), ...updates.media };

      const { data, error } = await supabase.from('goals').update(payload).eq('id', id).select().single();
      if (error) throw error;

      setGoals((prev) => prev.map((g) => (g.id === id ? mapRow(data) : g)));
      return;
    }

    const next = goals.map((g) => (g.id === id ? withMeta({ ...g, ...updates, media: { ...g.media, ...(updates.media || {}) } }) : g));
    setGoals(next);
    saveGoals(next);
  };

  const deleteGoal = async (id) => {
    if (id?.startsWith('seed-')) {
      setGoals((prev) => prev.filter((g) => g.id !== id));
      return;
    }

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

  const toggleSubtask = async (goalId, subtaskId) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const subtasks = (goal.media.subtasks || []).map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s));
    const done = subtasks.filter((s) => s.done).length;
    const progress = subtasks.length ? Math.round((done / subtasks.length) * 100) : goal.progress;
    await updateGoal(goalId, { progress, completed: progress >= 100, media: { subtasks } });
  };

  const addSubtask = async (goalId, text) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !text?.trim()) return;
    const subtasks = [...(goal.media.subtasks || []), { id: crypto.randomUUID(), text: text.trim(), done: false }];
    await updateGoal(goalId, { media: { subtasks } });
  };

  const addJournalEntry = async (goalId, entry) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const today = new Date().toISOString().slice(0, 10);
    const last = goal.media.lastCheckinDate;
    const diff = last ? Math.round((new Date(today) - new Date(last)) / 86400000) : 1;
    let streak = Number(goal.media.streakCount || 0);
    let tokens = Number(goal.media.freezeTokens || 0);
    if (diff === 0) {
      // no-op
    } else if (diff === 1) {
      streak += 1;
    } else if (tokens > 0) {
      tokens -= 1;
      streak += 1;
    } else {
      streak = 1;
    }

    const journal = [
      { id: crypto.randomUUID(), date: today, note: entry.note || '', media: entry.media || null },
      ...(goal.media.journal || [])
    ].slice(0, 100);

    const consistencyHistory = Array.from(new Set([...(goal.media.consistencyHistory || []), today])).sort();

    await updateGoal(goalId, { media: { journal, streakCount: streak, freezeTokens: tokens, lastCheckinDate: today, consistencyHistory } });
  };

  const setWeeklyStatus = async (goalId, weeklyStatus) => updateGoal(goalId, { media: { weeklyStatus, weeklyBucket: weekKey() } });

  return <GoalContext.Provider value={useMemo(() => ({ goals, createGoal, updateGoal, deleteGoal, goalsLoading, toggleSubtask, addSubtask, addJournalEntry, setWeeklyStatus }), [goals, goalsLoading])}>{children}</GoalContext.Provider>;
}
