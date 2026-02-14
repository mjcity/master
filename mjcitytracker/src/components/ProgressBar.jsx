export default function ProgressBar({ value }) {
  const v = Math.max(0, Math.min(100, Number(value || 0)));
  return <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-500" style={{width:`${v}%`}}/></div>;
}
