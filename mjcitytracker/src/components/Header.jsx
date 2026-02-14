import { FaCirclePlus, FaRightFromBracket, FaUser } from 'react-icons/fa6';
import { useAuth } from '../hooks/useAuth';

export default function Header({ onAdd, title = 'Mjcitytrack', subtitle = 'Track goals and level up daily', showAdd = true }) {
  const { currentUser, logout } = useAuth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 md:px-6">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        {showAdd && (
          <button onClick={onAdd} className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <FaCirclePlus /> New Goal
          </button>
        )}
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 md:flex">
          <FaUser className="text-slate-500" />
          <div>
            <p className="text-sm font-medium leading-tight">{currentUser?.name}</p>
            <p className="text-xs leading-tight text-slate-500">{currentUser?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Logout">
          <FaRightFromBracket />
        </button>
      </div>
    </header>
  );
}
