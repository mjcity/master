import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaChartLine, FaHouse, FaSliders } from 'react-icons/fa6';
import Sidebar from './Sidebar';
import Header from './Header';

const mobileItemClass = ({ isActive }) =>
  `block rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-300/30' : 'text-slate-200 hover:bg-white/10'}`;

const bottomTabClass = ({ isActive }) =>
  `flex flex-col items-center gap-1 rounded-2xl px-5 py-2 text-xs transition ${
    isActive ? 'bg-orange-300 text-slate-950' : 'text-slate-200'
  }`;

export default function Layout({ children, onAdd, title, subtitle, showAdd = true }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-4 p-4 md:p-6">
        <Sidebar />
        <div className="relative flex min-h-[85vh] flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-[0_24px_55px_rgba(2,6,23,0.65)] backdrop-blur-xl">
          <Header
            onAdd={onAdd}
            title={title}
            subtitle={subtitle}
            showAdd={showAdd}
            onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
          />

          {mobileMenuOpen && (
            <div className="border-b border-white/10 bg-slate-900/95 p-3 md:hidden">
              <nav className="grid gap-2">
                <NavLink to="/dashboard" className={mobileItemClass} onClick={() => setMobileMenuOpen(false)}>Dashboard</NavLink>
                <NavLink to="/progress" className={mobileItemClass} onClick={() => setMobileMenuOpen(false)}>Progress</NavLink>
                <NavLink to="/settings" className={mobileItemClass} onClick={() => setMobileMenuOpen(false)}>Settings</NavLink>
              </nav>
            </div>
          )}

          <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">{children}</main>

          <nav className="fixed bottom-4 left-1/2 z-40 flex w-[88%] -translate-x-1/2 items-center justify-center rounded-3xl border border-white/15 bg-slate-900/95 p-2 shadow-2xl md:hidden">
            <NavLink to="/dashboard" className={bottomTabClass}><FaHouse className="text-base" /> Home</NavLink>
            <NavLink to="/progress" className={bottomTabClass}><FaChartLine className="text-base" /> Progress</NavLink>
            <NavLink to="/settings" className={bottomTabClass}><FaSliders className="text-base" /> Settings</NavLink>
          </nav>
        </div>
      </div>
    </div>
  );
}
