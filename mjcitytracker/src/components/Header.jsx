import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaCirclePlus, FaRightFromBracket } from 'react-icons/fa6';
import { useAuth } from '../hooks/useAuth';

export default function Header({ onAdd, onToggleMobileMenu, title = 'Mjcitytrack', subtitle = 'Track goals and level up daily', showAdd = true }) {
  const { currentUser, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900/40 px-4 py-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 text-slate-300 hover:bg-white/10 md:hidden"
          aria-label="Open menu"
        >
          <FaBars />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="text-sm text-slate-300">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {showAdd && (
          <button onClick={onAdd} className="flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/30">
            <FaCirclePlus /> New Goal
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 hover:bg-white/10"
            aria-label="Open profile menu"
          >
            <div className="h-7 w-7 overflow-hidden rounded-full border border-slate-500/60 bg-slate-800">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Profile" className="h-full w-full object-cover" style={{ objectPosition: `${Number(currentUser?.avatarPosX ?? 50)}% ${Number(currentUser?.avatarPosY ?? 50)}%` }} />
              ) : null}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium leading-tight text-slate-100">{currentUser?.name}</p>
              <p className="text-xs leading-tight text-slate-300">{currentUser?.email}</p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute left-0 z-30 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl md:left-auto md:right-0">
              <Link
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-slate-100 hover:bg-white/10"
              >
                Profile & Settings
              </Link>
              <button
                onClick={async () => {
                  setProfileOpen(false);
                  await logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-100 hover:bg-white/10"
              >
                <FaRightFromBracket /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
