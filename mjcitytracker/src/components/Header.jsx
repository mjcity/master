import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaCirclePlus, FaRightFromBracket, FaUser } from 'react-icons/fa6';
import { useAuth } from '../hooks/useAuth';

export default function Header({ onAdd, onToggleMobileMenu, title = 'Mjcitytrack', subtitle = 'Track goals and level up daily', showAdd = true }) {
  const { currentUser, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
          aria-label="Open menu"
        >
          <FaBars />
        </button>
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {showAdd && (
          <button onClick={onAdd} className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <FaCirclePlus /> New Goal
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50"
            aria-label="Open profile menu"
          >
            <FaUser className="text-slate-500" />
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium leading-tight">{currentUser?.name}</p>
              <p className="text-xs leading-tight text-slate-500">{currentUser?.email}</p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-soft">
              <Link
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Profile & Settings
              </Link>
              <button
                onClick={async () => {
                  setProfileOpen(false);
                  await logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
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
