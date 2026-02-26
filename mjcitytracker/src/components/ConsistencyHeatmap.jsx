export default function ConsistencyHeatmap({ goals }) {
  const allDates = goals.flatMap((g) => (g.media?.journal || []).map((j) => j.date)).filter(Boolean);
  const counts = allDates.reduce((acc, d) => {
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  const days = [];
  const today = new Date();
  for (let i = 83; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, count: counts[key] || 0 });
  }

  const color = (n) => {
    if (n >= 4) return 'bg-emerald-400';
    if (n >= 2) return 'bg-emerald-500/70';
    if (n >= 1) return 'bg-emerald-700/70';
    return 'bg-slate-800';
  };

  return (
    <div className="rounded-[28px] border border-white/15 bg-slate-900/65 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-black">Consistency Heatmap</h3>
        <span className="text-xs text-slate-400">Last 12 weeks</span>
      </div>
      <div className="grid grid-cols-14 gap-1">
        {days.map((d) => (
          <div key={d.key} title={`${d.key}: ${d.count} check-in(s)`} className={`h-4 w-full rounded-sm ${color(d.count)}`} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <span>Less</span>
        <span className="h-3 w-3 rounded-sm bg-slate-800" />
        <span className="h-3 w-3 rounded-sm bg-emerald-700/70" />
        <span className="h-3 w-3 rounded-sm bg-emerald-500/70" />
        <span className="h-3 w-3 rounded-sm bg-emerald-400" />
        <span>More</span>
      </div>
    </div>
  );
}
