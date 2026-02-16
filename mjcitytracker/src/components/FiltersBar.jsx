export default function FiltersBar({ filter, setFilter, sort, setSort, categories }) {
  const fieldClass = 'h-11 w-full max-w-full rounded-lg border border-white/15 bg-slate-800/60 px-3 py-2 text-sm text-slate-100';

  return <div className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-slate-900/55 p-3 sm:grid-cols-2 lg:grid-cols-4">
    <div className="min-w-0"><label className="mb-1 block text-xs font-medium text-slate-300">Category</label><select value={filter.category} onChange={(e)=>setFilter(p=>({...p,category:e.target.value}))} className={fieldClass}><option value="all">All</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
    <div className="min-w-0"><label className="mb-1 block text-xs font-medium text-slate-300">Status</label><select value={filter.status} onChange={(e)=>setFilter(p=>({...p,status:e.target.value}))} className={fieldClass}><option value="all">All</option><option value="active">Active</option><option value="completed">Completed</option></select></div>
    <div className="min-w-0"><label className="mb-1 block text-xs font-medium text-slate-300">Due Date</label><input type="date" value={filter.dueDate} onChange={(e)=>setFilter(p=>({...p,dueDate:e.target.value}))} className={`${fieldClass} appearance-none`} /></div>
    <div className="min-w-0"><label className="mb-1 block text-xs font-medium text-slate-300">Sort</label><select value={sort} onChange={(e)=>setSort(e.target.value)} className={fieldClass}><option value="created">Newest</option><option value="dueDate">Due Date</option><option value="progressDesc">Progress High → Low</option><option value="progressAsc">Progress Low → High</option></select></div>
  </div>;
}
