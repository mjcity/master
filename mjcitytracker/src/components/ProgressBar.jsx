export default function ProgressBar({ value }) {
  const v = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700/80 ring-1 ring-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-300 shadow-[0_0_14px_rgba(34,211,238,0.45)] transition-all duration-500"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
