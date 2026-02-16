import { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import FiltersBar from '../components/FiltersBar';
import GoalCard from '../components/GoalCard';
import GoalFormModal from '../components/GoalFormModal';
import { useGoals } from '../hooks/useGoals';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage(){
  const { goals, createGoal, updateGoal, deleteGoal, toggleSubtask, addSubtask, addJournalEntry, setWeeklyStatus } = useGoals();
  const { currentUser } = useAuth();
  const [openModal,setOpenModal]=useState(false);
  const [editingGoal,setEditingGoal]=useState(null);
  const [filter,setFilter]=useState({category:'all',status:'all',dueDate:''});
  const [sort,setSort]=useState('created');

  const mine = useMemo(() => goals.filter((g)=>g.userId===currentUser.id||g.userId==='seed'), [goals, currentUser.id]);

  const userGoals = useMemo(()=>{
    const filtered=mine.filter((g)=>{
      if(filter.category!=='all'&&g.category!==filter.category) return false;
      if(filter.status==='completed'&&!g.completed) return false;
      if(filter.status==='active'&&g.completed) return false;
      if(filter.dueDate&&g.dueDate!==filter.dueDate) return false;
      return true;
    });
    return filtered.sort((a,b)=>{
      if(sort==='dueDate') return (a.dueDate||'').localeCompare(b.dueDate||'');
      if(sort==='progressDesc') return b.progress-a.progress;
      if(sort==='progressAsc') return a.progress-b.progress;
      return b.createdAt-a.createdAt;
    });
  },[mine,filter,sort]);

  const categories=useMemo(()=>[...new Set(goals.map(g=>g.category))],[goals]);

  const weeklyBoard = useMemo(() => ({
    thisWeek: mine.filter((g) => (g.media?.weeklyStatus || 'thisWeek') === 'thisWeek'),
    nextWeek: mine.filter((g) => (g.media?.weeklyStatus || 'thisWeek') === 'nextWeek'),
    blocked: mine.filter((g) => (g.media?.weeklyStatus || 'thisWeek') === 'blocked')
  }), [mine]);

  const coachTip = useMemo(() => {
    if (!mine.length) return 'Create your first goal and log one check-in to start your momentum.';
    const stalled = [...mine].sort((a, b) => (a.media?.journal?.[0]?.date || '').localeCompare(b.media?.journal?.[0]?.date || ''))[0];
    const topCarry = [...mine].sort((a, b) => Number(b.media?.carryOverCount || 0) - Number(a.media?.carryOverCount || 0))[0];
    if (topCarry?.media?.carryOverCount > 0) return `Coach: ${topCarry.title} keeps carrying over. Break it into 2 subtasks and complete one today.`;
    if (stalled && !(stalled.media?.journal || []).length) return `Coach: Add a quick check-in for "${stalled.title}" to restart progress.`;
    return 'Coach: You are on track. Keep daily check-ins and finish one subtask per active goal.';
  }, [mine]);

  const proofTimeline = useMemo(() => mine
    .flatMap((g) => (g.media?.journal || []).filter((j) => j.media?.dataUrl).map((j) => ({ ...j, goalTitle: g.title })))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 10), [mine]);

  const handleSubmit=async (goalData)=>{ if(editingGoal) await updateGoal(editingGoal.id,goalData); else await createGoal(goalData); setEditingGoal(null); setOpenModal(false); };
  const openCreate=()=>{ setEditingGoal(null); setOpenModal(true); };
  const openEdit=(goal)=>{ setEditingGoal(goal); setOpenModal(true); };
  const toggleComplete=(goal)=> updateGoal(goal.id,{completed:!goal.completed,progress:!goal.completed?100:Math.min(goal.progress,99)});

  return <Layout onAdd={openCreate} title="Dashboard" subtitle="Your goals, deadlines, and daily focus">
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
      <span className="rounded-full border border-white/15 bg-white/5 px-3 py-2">🚶 Walk 30 min</span>
      <span className="rounded-full border border-white/15 bg-white/5 px-3 py-2">🧘 Stretch 10 min</span>
      <span className="rounded-full border border-white/15 bg-white/5 px-3 py-2">😴 Rest</span>
    </div>

    <div className="mb-4 rounded-[28px] border border-cyan-200/40 bg-[#67d3ff] p-5 text-slate-950">
      <p className="mb-1 inline-flex rounded-full bg-black px-2 py-1 text-xs font-bold text-white">NEW · Weekly</p>
      <h3 className="text-5xl font-black tracking-tight">{new Date().toLocaleDateString('en-US', { month: 'short' })} {new Date().getDate()}–{new Date().getDate() + 6}</h3>
      <p className="mt-2 text-sm font-semibold opacity-80">My Activity Recaps</p>
    </div>

    <div className="mb-4 rounded-2xl border border-cyan-300/30 bg-cyan-500/15 p-4 text-sm text-cyan-100">{coachTip}</div>

    <div className="mb-4 grid gap-3 md:grid-cols-3">
      <Board title="This Week" tone="cyan" items={weeklyBoard.thisWeek} />
      <Board title="Next Week" tone="blue" items={weeklyBoard.nextWeek} />
      <Board title="Blocked" tone="orange" items={weeklyBoard.blocked} />
    </div>

    <FiltersBar filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} categories={categories}/>

    {userGoals.length===0?<div className="rounded-2xl border border-dashed border-white/20 bg-slate-900/50 p-10 text-center text-slate-300">No goals found. Create your first goal.</div>:<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{userGoals.map((goal)=><GoalCard key={goal.id} goal={goal} onEdit={openEdit} onDelete={deleteGoal} onToggleComplete={toggleComplete} onQuickProgress={(id,progress)=>updateGoal(id,{progress,completed:progress>=100})} onToggleSubtask={toggleSubtask} onAddSubtask={addSubtask} onAddJournal={addJournalEntry} onSetWeeklyStatus={setWeeklyStatus} />)}</div>}

    <div className="mt-5 rounded-[28px] border border-white/15 bg-gradient-to-br from-fuchsia-300 via-pink-300 to-rose-300 p-4 text-slate-950 shadow-[0_14px_28px_rgba(2,6,23,0.35)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-black">Proof Timeline</h3>
        <span className="rounded-full bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Gallery</span>
      </div>
      {!proofTimeline.length ? <p className="text-sm font-semibold text-slate-900/70">No proof media entries yet.</p> : <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">{proofTimeline.map((p, i)=><div key={p.id} className={`rounded-2xl border border-white/50 p-2 ${i % 3 === 0 ? 'bg-cyan-100/80' : i % 3 === 1 ? 'bg-emerald-100/80' : 'bg-orange-100/80'}`}><p className="text-xs font-bold text-slate-800">{p.date} · {p.goalTitle}</p>{p.media.type?.startsWith('video/') ? <video src={p.media.dataUrl} controls className="mt-1 max-h-36 w-full rounded-xl bg-black"/> : <img src={p.media.dataUrl} alt="proof" className="mt-1 max-h-36 w-full rounded-xl object-cover"/>}</div>)}</div>}
    </div>

    <GoalFormModal open={openModal} onClose={()=>{setOpenModal(false);setEditingGoal(null);}} onSubmit={handleSubmit} initialGoal={editingGoal} userId={currentUser.id}/>
  </Layout>;
}

function Board({ title, items, tone = 'cyan' }) {
  const tones = {
    cyan: 'from-cyan-300 to-sky-400 text-slate-950',
    blue: 'from-indigo-300 to-blue-400 text-slate-950',
    orange: 'from-orange-300 to-amber-400 text-slate-950'
  };

  return <div className={`relative overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-br p-4 ${tones[tone] || tones.cyan}`}>
    <div className="absolute -right-2 -bottom-6 text-[120px] font-black leading-none text-black/10">{items.length || 0}</div>
    <div className="relative z-10">
      <p className="mb-1 inline-flex rounded-full bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">{items.length ? 'Active' : 'Empty'}</p>
      <h4 className="text-2xl font-black">{title}</h4>
      <p className="mb-2 text-xs font-semibold text-slate-900/70">{items.length} goals</p>
      <div className="space-y-1 text-sm">
        {items.slice(0, 3).map((i) => <div key={i.id} className="rounded-xl bg-white/45 px-2 py-1 font-semibold text-slate-900">{i.title}</div>)}
        {!items.length && <p className="font-semibold text-slate-900/70">No goals yet</p>}
      </div>
    </div>
  </div>;
}
