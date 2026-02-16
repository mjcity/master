import { FaBullseye, FaChartLine, FaListCheck, FaSliders } from 'react-icons/fa6';
import { NavLink } from 'react-router-dom';

const itemClass = ({ isActive }) =>
  `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition border ${
    isActive
      ? 'border-cyan-300/40 bg-cyan-500/15 text-cyan-100'
      : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5'
  }`;

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-slate-100 shadow-[0_15px_40px_rgba(2,6,23,0.6)] backdrop-blur-xl md:block">
      <div className="mb-10 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950"><FaBullseye /></div>
        <div>
          <p className="text-xs text-slate-400">Project</p>
          <p className="font-semibold">Mjcitytrack</p>
        </div>
      </div>
      <nav className="space-y-2 text-sm">
        <NavLink to="/dashboard" className={itemClass}><FaListCheck /> Dashboard</NavLink>
        <NavLink to="/progress" className={itemClass}><FaChartLine /> Progress</NavLink>
        <NavLink to="/settings" className={itemClass}><FaSliders /> Settings</NavLink>
      </nav>
    </aside>
  );
}
