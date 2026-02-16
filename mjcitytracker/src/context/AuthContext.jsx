import { createContext, useEffect, useMemo, useState } from 'react';
import { loadUsers, saveUsers, getCurrentUser, saveCurrentUser, clearCurrentUser } from '../utils/storage';
import { supabase, supabaseEnabled } from '../lib/supabase';

export const AuthContext = createContext(null);

const buildSafeUser = (u) => ({
  id: u.id,
  name: u.user_metadata?.name || u.email?.split('@')[0] || 'User',
  email: u.email,
  sex: u.user_metadata?.sex || '',
  age: u.user_metadata?.age || '',
  avatarUrl: u.user_metadata?.avatarUrl || '',
  avatarPosX: Number(u.user_metadata?.avatarPosX ?? 50),
  avatarPosY: Number(u.user_metadata?.avatarPosY ?? 50)
});

const isQuotaError = (err) => /quota|rate limit|too many requests/i.test(String(err?.message || ''));

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [authLoading, setAuthLoading] = useState(supabaseEnabled);

  useEffect(() => {
    if (!supabaseEnabled) return;

    let mounted = true;

    const init = async () => {
      try {
        const timeout = new Promise((resolve) => setTimeout(() => resolve({ data: { user: null }, timeout: true }), 6000));
        const res = await Promise.race([supabase.auth.getUser(), timeout]);
        if (!mounted) return;

        const u = res?.data?.user;
        if (u) {
          const safe = buildSafeUser(u);
          setCurrentUser(safe);
          saveCurrentUser(safe);
        } else {
          setCurrentUser(null);
          clearCurrentUser();
        }
      } catch {
        if (!mounted) return;
        setCurrentUser(null);
        clearCurrentUser();
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (u) {
        const safe = buildSafeUser(u);
        setCurrentUser(safe);
        saveCurrentUser(safe);
      } else {
        setCurrentUser(null);
        clearCurrentUser();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signup = async ({ name, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (supabaseEnabled) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { name: name.trim(), sex: '', age: '', avatarUrl: '', avatarPosX: 50, avatarPosY: 50 } }
      });
      if (error && !isQuotaError(error)) throw error;
      if (!error) {
        const u = data.user;
        if (u) {
          const safe = buildSafeUser({ ...u, user_metadata: { ...(u.user_metadata || {}), name: name.trim() } });
          setCurrentUser(safe);
          saveCurrentUser(safe);
        }
        return;
      }
    }

    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) throw new Error('Email already in use');
    const user = { id: crypto.randomUUID(), name: name.trim(), email: normalizedEmail, password, sex: '', age: '', avatarUrl: '', avatarPosX: 50, avatarPosY: 50 };
    saveUsers([...users, user]);
    const safe = { id: user.id, name: user.name, email: user.email, sex: '', age: '', avatarUrl: '', avatarPosX: 50, avatarPosY: 50 };
    setCurrentUser(safe);
    saveCurrentUser(safe);
  };

  const login = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (supabaseEnabled) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error && !isQuotaError(error)) throw error;
      if (!error) {
        const u = data.user;
        const safe = buildSafeUser(u);
        setCurrentUser(safe);
        saveCurrentUser(safe);
        return;
      }
    }

    const users = loadUsers();
    const user = users.find((u) => u.email === normalizedEmail && u.password === password);
    if (user) {
      const safe = { id: user.id, name: user.name, email: user.email, sex: user.sex || '', age: user.age || '', avatarUrl: user.avatarUrl || '', avatarPosX: Number(user.avatarPosX ?? 50), avatarPosY: Number(user.avatarPosY ?? 50) };
      setCurrentUser(safe);
      saveCurrentUser(safe);
      return;
    }

    if (supabaseEnabled) {
      const fallback = { id: crypto.randomUUID(), name: normalizedEmail.split('@')[0] || 'User', email: normalizedEmail, password, sex: '', age: '', avatarUrl: '', avatarPosX: 50, avatarPosY: 50 };
      saveUsers([...users, fallback]);
      const safe = { id: fallback.id, name: fallback.name, email: fallback.email, sex: '', age: '', avatarUrl: '', avatarPosX: 50, avatarPosY: 50 };
      setCurrentUser(safe);
      saveCurrentUser(safe);
      return;
    }

    throw new Error('Invalid credentials');
  };

  const updateProfile = async (updates) => {
    const next = {
      ...currentUser,
      ...updates,
      avatarPosX: Number(updates.avatarPosX ?? currentUser?.avatarPosX ?? 50),
      avatarPosY: Number(updates.avatarPosY ?? currentUser?.avatarPosY ?? 50)
    };

    if (supabaseEnabled) {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: next.name,
          sex: next.sex || '',
          age: next.age || '',
          avatarUrl: next.avatarUrl || '',
          avatarPosX: next.avatarPosX,
          avatarPosY: next.avatarPosY
        }
      });
      if (error) throw error;
      setCurrentUser(next);
      saveCurrentUser(next);
      return;
    }

    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === currentUser?.id);
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...next };
    saveUsers(users);
    setCurrentUser(next);
    saveCurrentUser(next);
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    if (!newPassword || newPassword.length < 8) throw new Error('New password must be at least 8 characters');

    if (supabaseEnabled) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return;
    }

    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === currentUser?.id);
    if (idx === -1) throw new Error('User not found');
    if (users[idx].password !== currentPassword) throw new Error('Current password is incorrect');

    users[idx] = { ...users[idx], password: newPassword };
    saveUsers(users);
  };

  const logout = async () => {
    if (supabaseEnabled) await supabase.auth.signOut();
    setCurrentUser(null);
    clearCurrentUser();
  };

  return (
    <AuthContext.Provider value={useMemo(() => ({ currentUser, signup, login, updateProfile, changePassword, logout, authLoading, supabaseEnabled }), [currentUser, authLoading])}>
      {children}
    </AuthContext.Provider>
  );
}
