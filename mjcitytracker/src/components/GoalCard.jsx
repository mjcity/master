import { FaCalendarDays, FaCheck, FaPenToSquare, FaTrashCan } from 'react-icons/fa6';
import ProgressBar from './ProgressBar';
import { formatDate, isOverdue } from '../utils/date';

export default function GoalCard({ goal, onEdit, onDelete, onToggleComplete, onQuickProgress }) {
  return <article className="card-hover rounded-2xl border border-slate-200 bg-white p-4">
    <div className="mb-3 flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{goal.title}</h3><p className="mt-1 text-sm text-slate-500">{goal.description}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{goal.category}</span></div>

    {goal.media?.dataUrl && (
      <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {goal.media.type?.startsWith('video/') ? (
          <video src={goal.media.dataUrl} controls className="max-h-48 w-full bg-black" />
        ) : (
          <img src={goal.media.dataUrl} alt={`${goal.title} media`} className="max-h-48 w-full object-cover" />
        )}
      </div>
    )}

    <div className="mb-3 space-y-1"><div className="flex items-center justify-between text-sm"><span className="text-slate-500">Progress</span><span className="font-medium text-slate-700">{goal.progress}%</span></div><ProgressBar value={goal.progress}/></div>
    <div className="mb-4 flex items-center justify-between text-xs text-slate-500"><div className="flex items-center gap-1"><FaCalendarDays/> {formatDate(goal.dueDate)}</div>{isOverdue(goal.dueDate)&&!goal.completed?<span className="rounded-full bg-rose-100 px-2 py-1 text-rose-700">Overdue</span>:goal.completed?<span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Completed</span>:null}</div>
    <div className="mb-3 flex items-center gap-2 py-1"><input type="range" min="0" max="100" value={goal.progress} onChange={(e)=>onQuickProgress(goal.id, Number(e.target.value))} className="w-full cursor-pointer accent-blue-600 [touch-action:pan-x]"/></div>
    <div className="flex flex-wrap gap-2">
      <button onClick={()=>onToggleComplete(goal)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"><FaCheck/> {goal.completed?'Set Active':'Complete'}</button>
      <button onClick={()=>onEdit(goal)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"><FaPenToSquare/> Edit</button>
      <button onClick={()=>onDelete(goal.id)} className="flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"><FaTrashCan/> Delete</button>
    </div>
  </article>;
}
