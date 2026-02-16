import { useState } from 'react';
import { FaCalendarDays, FaCheck, FaPenToSquare, FaTrashCan } from 'react-icons/fa6';
import ProgressBar from './ProgressBar';
import { formatDate, isOverdue } from '../utils/date';

export default function GoalCard({ goal, onEdit, onDelete, onToggleComplete, onQuickProgress, onToggleSubtask, onAddSubtask, onAddJournal, onSetWeeklyStatus }) {
  const [subtaskText, setSubtaskText] = useState('');
  const [journalText, setJournalText] = useState('');

  const subtasks = goal.media?.subtasks || [];
  const streak = Number(goal.media?.streakCount || 0);
  const tokens = Number(goal.media?.freezeTokens || 0);

  return <article className="card-hover relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-b from-slate-800/80 to-slate-900/95 p-4 shadow-[0_18px_35px_rgba(2,6,23,0.55)]">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-400" />

    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-2xl font-black tracking-tight text-slate-100">{goal.title}</h3>
        <p className="mt-1 text-base text-slate-300">{goal.description}</p>
      </div>
      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-slate-100">{goal.category}</span>
    </div>

    {goal.media?.dataUrl && (
      <div className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-800/50">
        {goal.media.type?.startsWith('video/') ? (
          <video src={goal.media.dataUrl} controls className="max-h-52 w-full bg-black" />
        ) : (
          <img src={goal.media.dataUrl} alt={`${goal.title} media`} className="max-h-52 w-full object-cover" />
        )}
      </div>
    )}

    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
      <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-slate-100">Streak: {streak}d</span>
      <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-slate-100">Freeze: {tokens}</span>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-slate-300">Week:</span>
        <select value={goal.media?.weeklyStatus || 'thisWeek'} onChange={(e) => onSetWeeklyStatus(goal.id, e.target.value)} className="rounded-xl border border-white/15 bg-slate-800 px-2 py-1 text-slate-100">
          <option value="thisWeek">This week</option>
          <option value="nextWeek">Next week</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
    </div>

    <div className="mb-3 space-y-1">
      <div className="flex items-center justify-between text-lg">
        <span className="font-semibold text-slate-200">Progress</span>
        <span className="font-black text-slate-100">{goal.progress}%</span>
      </div>
      <ProgressBar value={goal.progress}/>
    </div>

    <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
      <div className="flex items-center gap-2"><FaCalendarDays/> {formatDate(goal.dueDate)}</div>
      {isOverdue(goal.dueDate)&&!goal.completed?<span className="rounded-full bg-rose-500/20 px-3 py-1 text-rose-200">Overdue</span>:goal.completed?<span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">Completed</span>:null}
    </div>

    <div className="mb-4 flex items-center gap-2 py-1"><input type="range" min="0" max="100" value={goal.progress} onChange={(e)=>onQuickProgress(goal.id, Number(e.target.value))} className="w-full cursor-pointer accent-cyan-400 [touch-action:pan-x]"/></div>

    <div className="mb-3 rounded-2xl border border-white/10 bg-slate-800/45 p-3">
      <p className="mb-2 text-base font-bold text-slate-100">Milestones / Subtasks</p>
      <div className="space-y-1 text-slate-100">
        {subtasks.map((s) => <label key={s.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!s.done} onChange={() => onToggleSubtask(goal.id, s.id)} /> {s.text}</label>)}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={subtaskText} onChange={(e) => setSubtaskText(e.target.value)} placeholder="Add subtask" className="w-full rounded-xl border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-slate-100" />
        <button onClick={() => { onAddSubtask(goal.id, subtaskText); setSubtaskText(''); }} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100">Add</button>
      </div>
    </div>

    <div className="mb-3 rounded-2xl border border-white/10 bg-slate-800/45 p-3">
      <p className="mb-2 text-base font-bold text-slate-100">Progress Journal</p>
      <div className="flex gap-2">
        <input value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder="Quick check-in" className="w-full rounded-xl border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-slate-100" />
        <button onClick={() => { onAddJournal(goal.id, { note: journalText }); setJournalText(''); }} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100">Log</button>
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      <button onClick={()=>onToggleComplete(goal)} className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15"><FaCheck/> {goal.completed?'Set Active':'Complete'}</button>
      <button onClick={()=>onEdit(goal)} className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15"><FaPenToSquare/> Edit</button>
      <button onClick={()=>onDelete(goal.id)} className="flex items-center gap-1 rounded-xl border border-rose-300/35 bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/25"><FaTrashCan/> Delete</button>
    </div>
  </article>;
}
