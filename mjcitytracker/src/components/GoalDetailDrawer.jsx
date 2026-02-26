import { formatDate, isOverdue } from '../utils/date';

export default function GoalDetailDrawer({ goal, open, onClose }) {
  if (!open || !goal) return null;

  const journal = goal.media?.journal || [];
  const subtasks = goal.media?.subtasks || [];
  const doneSubtasks = subtasks.filter((s) => s.done).length;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-slate-950/65" onClick={onClose} aria-label="Close goal details" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950 p-5 text-slate-100 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-cyan-300">Goal details</p>
            <h2 className="text-2xl font-black">{goal.title}</h2>
            <p className="mt-1 text-sm text-slate-300">{goal.description || 'No description yet.'}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/20 px-3 py-1 text-sm font-semibold">Close</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stat label="Progress" value={`${goal.progress || 0}%`} />
          <Stat label="Status" value={goal.completed ? 'Completed' : isOverdue(goal.dueDate) ? 'Overdue' : 'Active'} />
          <Stat label="Due" value={formatDate(goal.dueDate)} />
          <Stat label="Category" value={goal.category || 'General'} />
          <Stat label="Streak" value={`${Number(goal.media?.streakCount || 0)}d`} />
          <Stat label="Freeze" value={`${Number(goal.media?.freezeTokens || 0)}`} />
        </div>

        <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-300">Milestones</h3>
          <p className="mb-2 text-sm text-slate-300">{doneSubtasks}/{subtasks.length} completed</p>
          {!subtasks.length ? <p className="text-sm text-slate-400">No subtasks yet.</p> : (
            <ul className="space-y-2 text-sm">
              {subtasks.map((s) => (
                <li key={s.id} className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2">
                  <span className={s.done ? 'text-emerald-300' : 'text-slate-100'}>{s.done ? '✓ ' : '○ '}{s.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-300">Recent check-ins</h3>
          {!journal.length ? <p className="text-sm text-slate-400">No check-ins yet.</p> : (
            <ul className="space-y-2 text-sm">
              {journal.slice(0, 8).map((j) => (
                <li key={j.id} className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2">
                  <p className="text-xs text-cyan-300">{j.date}</p>
                  <p>{j.note || 'Check-in logged'}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="rounded-xl border border-white/10 bg-white/5 p-3">
    <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className="text-sm font-bold text-slate-100">{value}</p>
  </div>;
}
