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

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [authLoading, setAuthLoading] = useState(supabaseEnabled);

  useEffect(() => {
    if (!supabaseEnabled) return;

    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const u = data?.user;
      if (u) {
        const safe = buildSafeUser(u);
        setCurrentUser(safe);
        saveCurrentUser(safe);
      } else {
        setCurrentUser(null);
        clearCurrentUser();
      }
      setAuthLoading(false);
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
    if (supabaseEnabled) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: name.trim(), sex: '', age: '', avatarUrl: '', avatarPosX: 50, avatarPosY: 50 } }
      });
      if (error) throw error;
      const u = data.user;
      if (u) {
        const safe = buildSafeUser({ ...u, user_metadata: { ...(u.user_metadata || {}), name: name.trim() } });
        setCurrentUser(safe);
        saveCurrentUser(safe);
      }
      return;
    }

    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error('Email already in use');
    const user = { id: crypto.randomUUID(), name: name.trim(), email: email.trim().toLowerCase(), password, sex: '', age: '', avatarUrl: '', avatarPosX: 50, avatarPosY: 50 };
    saveUsers([...users, user]);
    const safe = { id: user.id, name: user.name, email: user.email, sex: '', age: '', avatarUrl: '', avatarPosX: 50, avatarPosY: 50 };
    setCurrentUser(safe);
    saveCurrentUser(safe);
  };

  const login = async ({ email, password }) => {
    if (supabaseEnabled) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      const u = data.user;
      const safe = buildSafeUser(u);
      setCurrentUser(safe);
      saveCurrentUser(safe);
      return;
    }

    const users = loadUsers();
    const user = users.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    const safe = { id: user.id, name: user.name, email: user.email, sex: user.sex || '', age: user.age || '', avatarUrl: user.avatarUrl || '', avatarPosX: Number(user.avatarPosX ?? 50), avatarPosY: Number(user.avatarPosY ?? 50) };
    setCurrentUser(safe);
    saveCurrentUser(safe);
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
