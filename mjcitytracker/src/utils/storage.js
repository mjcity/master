const USERS_KEY = 'goaltracker_users_v1';
const CURRENT_USER_KEY = 'goaltracker_current_user_v1';
const GOALS_KEY = 'goaltracker_goals_v1';

export const seedGoals = [
  { id: 'seed-portfolio', userId: 'seed', title: 'Launch portfolio website', description: 'Ship portfolio with case studies.', category: 'Career', progress: 75, dueDate: new Date(Date.now()+864000000).toISOString().slice(0,10), completed: false, createdAt: Date.now()-100000 },
  { id: 'seed-books', userId: 'seed', title: 'Read 3 books this month', description: 'Complete reading routine.', category: 'Personal', progress: 40, dueDate: new Date(Date.now()+1728000000).toISOString().slice(0,10), completed: false, createdAt: Date.now()-90000 },
  { id: 'seed-gym', userId: 'seed', title: 'Gym 4x weekly', description: 'Strength + cardio plan.', category: 'Health', progress: 100, dueDate: new Date(Date.now()-86400000).toISOString().slice(0,10), completed: true, createdAt: Date.now()-80000 }
];

export const loadUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
export const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
export const getCurrentUser = () => JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
export const saveCurrentUser = (u) => localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u));
export const clearCurrentUser = () => localStorage.removeItem(CURRENT_USER_KEY);

export function loadGoals() {
  const raw = localStorage.getItem(GOALS_KEY);
  if (!raw) { localStorage.setItem(GOALS_KEY, JSON.stringify(seedGoals)); return seedGoals; }
  return JSON.parse(raw);
}

export const saveGoals = (g) => localStorage.setItem(GOALS_KEY, JSON.stringify(g));
