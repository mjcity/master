import { createContext, useMemo, useState } from 'react';
import { loadUsers, saveUsers, getCurrentUser, saveCurrentUser, clearCurrentUser } from '../utils/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  const signup = ({ name, email, password }) => {
    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error('Email already in use');
    const user = { id: crypto.randomUUID(), name: name.trim(), email: email.trim().toLowerCase(), password };
    saveUsers([...users, user]);
    const safe = { id: user.id, name: user.name, email: user.email };
    setCurrentUser(safe);
    saveCurrentUser(safe);
  };

  const login = ({ email, password }) => {
    const users = loadUsers();
    const user = users.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    const safe = { id: user.id, name: user.name, email: user.email };
    setCurrentUser(safe);
    saveCurrentUser(safe);
  };

  const logout = () => { setCurrentUser(null); clearCurrentUser(); };

  return <AuthContext.Provider value={useMemo(() => ({ currentUser, signup, login, logout }), [currentUser])}>{children}</AuthContext.Provider>;
}
