import { useMemo } from 'react';
import Layout from '../components/Layout';
import { useGoals } from '../hooks/useGoals';
import { useAuth } from '../hooks/useAuth';

export default function ProgressPage() {
  const { goals } = useGoals();
  const { currentUser } = useAuth();

  const stats = useMemo(() => {
    const mine = goals.filter((g) => g.userId === currentUser.id || g.userId === 'seed');
    const total = mine.length;
    const completed = mine.filter((g) => g.completed).length;
    const active = total - completed;
    const avgProgress = total ? Math.round(mine.reduce((sum, g) => sum + Number(g.progress || 0), 0) / total) : 0;
    const overdue = mine.filter((g) => !g.completed && g.dueDate && new Date(g.dueDate) < new Date()).length;
    return { total, completed, active, avgProgress, overdue };
  }, [goals, currentUser.id]);

  return (
    <Layout title="Progress" subtitle="Track how close you are to each target" showAdd={false}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Total Goals" value={stats.total} />
        <Stat label="Completed" value={stats.completed} />
        <Stat label="Active" value={stats.active} />
        <Stat label="Avg Progress" value={`${stats.avgProgress}%`} />
        <Stat label="Overdue" value={stats.overdue} />
      </div>
    </Layout>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
