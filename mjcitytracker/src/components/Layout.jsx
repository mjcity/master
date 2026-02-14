import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, onAdd, title, subtitle, showAdd = true }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-4 p-4 md:p-6">
        <Sidebar />
        <div className="flex min-h-[85vh] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
          <Header onAdd={onAdd} title={title} subtitle={subtitle} showAdd={showAdd} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
