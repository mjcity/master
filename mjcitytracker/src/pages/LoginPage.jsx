import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBullseye } from 'react-icons/fa6';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage(){
  const [form,setForm]=useState({email:'',password:''});
  const [error,setError]=useState('');
  const { login }=useAuth();
  const navigate=useNavigate();
  const submit=(e)=>{ e.preventDefault(); try{ login(form); navigate('/dashboard'); }catch(err){ setError(err.message);} };
  return <div className="grid min-h-screen place-items-center bg-slate-100 p-4"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft"><div className="mb-6 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white"><FaBullseye/></div><div><p className="text-xs uppercase tracking-wide text-slate-400">GoalTracker</p><h1 className="text-xl font-bold">Welcome back</h1></div></div>{error?<p className="mb-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{error}</p>:null}<div className="space-y-3"><input type="email" placeholder="Email" value={form.email} onChange={(e)=>setForm(p=>({...p,email:e.target.value}))} className="w-full rounded-lg border border-slate-200 px-3 py-2" required/><input type="password" placeholder="Password" value={form.password} onChange={(e)=>setForm(p=>({...p,password:e.target.value}))} className="w-full rounded-lg border border-slate-200 px-3 py-2" required/></div><button className="mt-4 w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700">Login</button><p className="mt-4 text-center text-sm text-slate-500">New here? <Link to="/signup" className="text-brand-600 hover:underline">Create account</Link></p></form></div>;
}
