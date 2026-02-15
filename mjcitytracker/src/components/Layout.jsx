import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const mobileItemClass = ({ isActive }) =>
  `block rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

export default function Layout({ children, onAdd, title, subtitle, showAdd = true }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-4 p-4 md:p-6">
        <Sidebar />
        <div className="relative flex min-h-[85vh] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
          <Header
            onAdd={onAdd}
            title={title}
            subtitle={subtitle}
            showAdd={showAdd}
            onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
          />

          {mobileMenuOpen && (
            <div className="border-b border-slate-200 bg-white p-3 md:hidden">
              <nav className="grid gap-2">
                <NavLink to="/dashboard" className={mobileItemClass} onClick={() => setMobileMenuOpen(false)}>Dashboard</NavLink>
                <NavLink to="/progress" className={mobileItemClass} onClick={() => setMobileMenuOpen(false)}>Progress</NavLink>
                <NavLink to="/settings" className={mobileItemClass} onClick={() => setMobileMenuOpen(false)}>Settings</NavLink>
              </nav>
            </div>
          )}

          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
