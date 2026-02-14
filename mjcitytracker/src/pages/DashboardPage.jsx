import { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import FiltersBar from '../components/FiltersBar';
import GoalCard from '../components/GoalCard';
import GoalFormModal from '../components/GoalFormModal';
import { useGoals } from '../hooks/useGoals';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage(){
  const { goals, createGoal, updateGoal, deleteGoal } = useGoals();
  const { currentUser } = useAuth();
  const [openModal,setOpenModal]=useState(false);
  const [editingGoal,setEditingGoal]=useState(null);
  const [filter,setFilter]=useState({category:'all',status:'all',dueDate:''});
  const [sort,setSort]=useState('created');

  const userGoals = useMemo(()=>{
    const mine=goals.filter((g)=>g.userId===currentUser.id||g.userId==='seed');
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
  },[goals,currentUser.id,filter,sort]);

  const categories=useMemo(()=>[...new Set(goals.map(g=>g.category))],[goals]);

  const handleSubmit=(goalData)=>{ if(editingGoal) updateGoal(editingGoal.id,goalData); else createGoal(goalData); setEditingGoal(null); setOpenModal(false); };
  const openCreate=()=>{ setEditingGoal(null); setOpenModal(true); };
  const openEdit=(goal)=>{ setEditingGoal(goal); setOpenModal(true); };
  const toggleComplete=(goal)=> updateGoal(goal.id,{completed:!goal.completed,progress:!goal.completed?100:Math.min(goal.progress,99)});

  return <Layout onAdd={openCreate}><FiltersBar filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} categories={categories}/>{userGoals.length===0?<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">No goals found. Create your first goal.</div>:<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{userGoals.map((goal)=><GoalCard key={goal.id} goal={goal} onEdit={openEdit} onDelete={deleteGoal} onToggleComplete={toggleComplete} onQuickProgress={(id,progress)=>updateGoal(id,{progress,completed:progress>=100})}/>)}</div>}<GoalFormModal open={openModal} onClose={()=>{setOpenModal(false);setEditingGoal(null);}} onSubmit={handleSubmit} initialGoal={editingGoal} userId={currentUser.id}/></Layout>;
}
