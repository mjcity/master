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
    const streakAvg = total ? Math.round(mine.reduce((sum, g) => sum + Number(g.media?.streakCount || 0), 0) / total) : 0;
    const month = new Date().toISOString().slice(0, 7);
    const consistencyHits = mine.reduce((sum, g) => sum + (g.media?.consistencyHistory || []).filter((d) => d.startsWith(month)).length, 0);
    const max = Math.max(1, total * new Date().getDate());
    const consistency = Math.round((consistencyHits / max) * 100);
    return { total, completed, active, avgProgress, overdue, streakAvg, consistency };
  }, [goals, currentUser.id]);

  return (
    <Layout title="Progress" subtitle="Track how close you are to each target" showAdd={false}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
        <Stat label="Total Goals" value={stats.total} />
        <Stat label="Completed" value={stats.completed} />
        <Stat label="Active" value={stats.active} />
        <Stat label="Avg Progress" value={`${stats.avgProgress}%`} />
        <Stat label="Overdue" value={stats.overdue} />
        <Stat label="Avg Streak" value={`${stats.streakAvg}d`} />
        <Stat label="Monthly Consistency" value={`${stats.consistency}%`} />
      </div>
    </Layout>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-[0_10px_25px_rgba(2,6,23,0.5)]">
      <p className="text-sm text-slate-300">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-100">{value}</p>
    </div>
  );
}
