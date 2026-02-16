export default function FiltersBar({ filter, setFilter, sort, setSort, categories }) {
  const fieldClass = 'h-11 w-full max-w-full rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-100 outline-none ring-cyan-300/30 focus:ring';

  return <div className="mb-4 rounded-[28px] border border-white/15 bg-gradient-to-b from-slate-800/70 to-slate-900/85 p-4 shadow-[0_14px_30px_rgba(2,6,23,0.45)]">
    <div className="mb-3 flex items-center justify-between">
      <h4 className="text-base font-black text-slate-100">Goal Filters</h4>
      <span className="rounded-full bg-cyan-400/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-200">Smart Sort</span>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="min-w-0"><label className="mb-1 block text-xs font-bold text-slate-300">Category</label><select value={filter.category} onChange={(e)=>setFilter(p=>({...p,category:e.target.value}))} className={fieldClass}><option value="all">All</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
      <div className="min-w-0"><label className="mb-1 block text-xs font-bold text-slate-300">Status</label><select value={filter.status} onChange={(e)=>setFilter(p=>({...p,status:e.target.value}))} className={fieldClass}><option value="all">All</option><option value="active">Active</option><option value="completed">Completed</option></select></div>
      <div className="min-w-0"><label className="mb-1 block text-xs font-bold text-slate-300">Due Date</label><input type="date" value={filter.dueDate} onChange={(e)=>setFilter(p=>({...p,dueDate:e.target.value}))} className={`${fieldClass} appearance-none`} /></div>
      <div className="min-w-0"><label className="mb-1 block text-xs font-bold text-slate-300">Sort</label><select value={sort} onChange={(e)=>setSort(e.target.value)} className={fieldClass}><option value="created">Newest</option><option value="dueDate">Due Date</option><option value="progressDesc">Progress High → Low</option><option value="progressAsc">Progress Low → High</option></select></div>
    </div>
  </div>;
}
