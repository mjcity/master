import { FaBullseye, FaChartLine, FaListCheck, FaSliders } from 'react-icons/fa6';

export default function Sidebar(){
  return <aside className="hidden w-64 shrink-0 rounded-3xl bg-slate-900 p-5 text-slate-100 md:block">
    <div className="mb-10 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500"><FaBullseye/></div><div><p className="text-xs text-slate-400">Project</p><p className="font-semibold">mjcitytracker</p></div></div>
    <nav className="space-y-2 text-sm">
      <button className="flex w-full items-center gap-3 rounded-xl bg-slate-800 px-3 py-2 text-left"><FaListCheck/> Dashboard</button>
      <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-300 hover:bg-slate-800"><FaChartLine/> Progress</button>
      <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-300 hover:bg-slate-800"><FaSliders/> Settings</button>
    </nav>
  </aside>
}
