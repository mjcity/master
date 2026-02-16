export default function FiltersBar({ filter, setFilter, sort, setSort, categories }) {
  const fieldClass = 'h-11 w-full max-w-full rounded-xl border border-white/55 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-900 outline-none ring-cyan-300/40 focus:ring';

  return <div className="mb-4 rounded-[28px] border border-white/40 bg-gradient-to-br from-cyan-300 via-blue-300 to-indigo-300 p-4 text-slate-950 shadow-[0_14px_30px_rgba(2,6,23,0.25)]">
    <div className="mb-3 flex items-center justify-between">
      <h4 className="text-xl font-black">Goal Filters</h4>
      <span className="rounded-full bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Smart Sort</span>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="min-w-0"><label className="mb-1 block text-xs font-black text-slate-900/85">Category</label><select value={filter.category} onChange={(e)=>setFilter(p=>({...p,category:e.target.value}))} className={fieldClass}><option value="all">All</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
      <div className="min-w-0"><label className="mb-1 block text-xs font-black text-slate-900/85">Status</label><select value={filter.status} onChange={(e)=>setFilter(p=>({...p,status:e.target.value}))} className={fieldClass}><option value="all">All</option><option value="active">Active</option><option value="completed">Completed</option></select></div>
      <div className="min-w-0"><label className="mb-1 block text-xs font-black text-slate-900/85">Due Date</label><input type="date" value={filter.dueDate} onChange={(e)=>setFilter(p=>({...p,dueDate:e.target.value}))} className={`${fieldClass} appearance-none`} /></div>
      <div className="min-w-0"><label className="mb-1 block text-xs font-black text-slate-900/85">Sort</label><select value={sort} onChange={(e)=>setSort(e.target.value)} className={fieldClass}><option value="created">Newest</option><option value="dueDate">Due Date</option><option value="progressDesc">Progress High → Low</option><option value="progressAsc">Progress Low → High</option></select></div>
    </div>
  </div>;
}
