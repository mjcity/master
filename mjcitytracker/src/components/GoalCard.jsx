import { useMemo, useState } from 'react';
import { FaCalendarDays, FaCheck, FaPenToSquare, FaTrashCan } from 'react-icons/fa6';
import ProgressBar from './ProgressBar';
import { formatDate, isOverdue } from '../utils/date';

const palettes = [
  {
    card: 'from-cyan-300 to-sky-400 text-slate-950 border-cyan-200/60',
    chip: 'bg-white/55 text-slate-900',
    panel: 'bg-white/45 border-white/40',
    input: 'bg-white/70 border-white/55 text-slate-900 placeholder:text-slate-600',
    button: 'bg-slate-900 text-white border-slate-900/40 hover:bg-slate-800'
  },
  {
    card: 'from-indigo-300 to-blue-400 text-slate-950 border-indigo-200/60',
    chip: 'bg-white/55 text-slate-900',
    panel: 'bg-white/45 border-white/40',
    input: 'bg-white/70 border-white/55 text-slate-900 placeholder:text-slate-600',
    button: 'bg-slate-900 text-white border-slate-900/40 hover:bg-slate-800'
  },
  {
    card: 'from-orange-300 to-amber-400 text-slate-950 border-orange-200/60',
    chip: 'bg-white/55 text-slate-900',
    panel: 'bg-white/45 border-white/40',
    input: 'bg-white/70 border-white/55 text-slate-900 placeholder:text-slate-600',
    button: 'bg-slate-900 text-white border-slate-900/40 hover:bg-slate-800'
  }
];

function pickPalette(goal) {
  const key = String(goal.id || goal.title || '0');
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return palettes[hash % palettes.length];
}

export default function GoalCard({ goal, onEdit, onDelete, onToggleComplete, onQuickProgress, onToggleSubtask, onAddSubtask, onAddJournal, onSetWeeklyStatus }) {
  const [subtaskText, setSubtaskText] = useState('');
  const [journalText, setJournalText] = useState('');

  const subtasks = goal.media?.subtasks || [];
  const streak = Number(goal.media?.streakCount || 0);
  const tokens = Number(goal.media?.freezeTokens || 0);
  const tone = useMemo(() => pickPalette(goal), [goal]);

  return <article className={`card-hover relative overflow-hidden rounded-[30px] border bg-gradient-to-br p-4 shadow-[0_18px_35px_rgba(2,6,23,0.35)] ${tone.card}`}>
    <div className="pointer-events-none absolute -right-3 -bottom-8 text-[130px] font-black leading-none text-black/10">{goal.progress}</div>

    <div className="relative z-10 mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-2xl font-black tracking-tight">{goal.title}</h3>
        <p className="mt-1 text-base text-slate-900/80">{goal.description}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone.chip}`}>{goal.category}</span>
    </div>

    {goal.media?.dataUrl && (
      <div className={`mb-3 overflow-hidden rounded-2xl border ${tone.panel}`}>
        {goal.media.type?.startsWith('video/') ? (
          <video src={goal.media.dataUrl} controls className="max-h-52 w-full bg-black" />
        ) : (
          <img src={goal.media.dataUrl} alt={`${goal.title} media`} className="max-h-52 w-full object-cover" />
        )}
      </div>
    )}

    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
      <span className={`rounded-full px-3 py-1 font-semibold ${tone.chip}`}>Streak: {streak}d</span>
      <span className={`rounded-full px-3 py-1 font-semibold ${tone.chip}`}>Freeze: {tokens}</span>
      <div className="ml-auto flex items-center gap-2">
        <span className="font-semibold text-slate-900/80">Week:</span>
        <select value={goal.media?.weeklyStatus || 'thisWeek'} onChange={(e) => onSetWeeklyStatus(goal.id, e.target.value)} className={`rounded-xl border px-2 py-1 ${tone.input}`}>
          <option value="thisWeek">This week</option>
          <option value="nextWeek">Next week</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
    </div>

    <div className="mb-3 space-y-1">
      <div className="flex items-center justify-between text-lg">
        <span className="font-bold text-slate-900/85">Progress</span>
        <span className="font-black">{goal.progress}%</span>
      </div>
      <ProgressBar value={goal.progress}/>
    </div>

    <div className="mb-3 flex items-center justify-between text-sm text-slate-900/80">
      <div className="flex items-center gap-2"><FaCalendarDays/> {formatDate(goal.dueDate)}</div>
      {isOverdue(goal.dueDate)&&!goal.completed?<span className="rounded-full bg-rose-600/20 px-3 py-1 text-rose-900">Overdue</span>:goal.completed?<span className="rounded-full bg-emerald-600/20 px-3 py-1 text-emerald-900">Completed</span>:null}
    </div>

    <div className="mb-4 flex items-center gap-2 py-1"><input type="range" min="0" max="100" value={goal.progress} onChange={(e)=>onQuickProgress(goal.id, Number(e.target.value))} className="w-full cursor-pointer accent-cyan-500 [touch-action:pan-x]"/></div>

    <div className={`mb-3 rounded-2xl border p-3 ${tone.panel}`}>
      <p className="mb-2 text-base font-bold text-slate-900">Milestones / Subtasks</p>
      <div className="space-y-1 text-slate-900">
        {subtasks.map((s) => <label key={s.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!s.done} onChange={() => onToggleSubtask(goal.id, s.id)} /> {s.text}</label>)}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={subtaskText} onChange={(e) => setSubtaskText(e.target.value)} placeholder="Add subtask" className={`w-full rounded-xl border px-3 py-2 text-sm ${tone.input}`} />
        <button onClick={() => { onAddSubtask(goal.id, subtaskText); setSubtaskText(''); }} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${tone.button}`}>Add</button>
      </div>
    </div>

    <div className={`mb-3 rounded-2xl border p-3 ${tone.panel}`}>
      <p className="mb-2 text-base font-bold text-slate-900">Progress Journal</p>
      <div className="flex gap-2">
        <input value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder="Quick check-in" className={`w-full rounded-xl border px-3 py-2 text-sm ${tone.input}`} />
        <button onClick={() => { onAddJournal(goal.id, { note: journalText }); setJournalText(''); }} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${tone.button}`}>Log</button>
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      <button onClick={()=>onToggleComplete(goal)} className="flex items-center gap-1 rounded-xl border border-slate-900/25 bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"><FaCheck/> {goal.completed?'Set Active':'Complete'}</button>
      <button onClick={()=>onEdit(goal)} className="flex items-center gap-1 rounded-xl border border-slate-900/25 bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"><FaPenToSquare/> Edit</button>
      <button onClick={()=>onDelete(goal.id)} className="flex items-center gap-1 rounded-xl border border-rose-700/35 bg-rose-600/20 px-3 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-600/30"><FaTrashCan/> Delete</button>
    </div>
  </article>;
}
