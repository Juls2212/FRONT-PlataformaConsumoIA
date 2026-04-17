export default function QuotaProgress({ used = 0, limit = 0 }) {
  const safeLimit = limit > 0 ? limit : 1;
  const progress = Math.min((used / safeLimit) * 100, 100);

  return (
    <section className="rounded-3xl bg-white/90 p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Cuota mensual</p>
          <h2 className="text-lg font-semibold text-ink">{used} / {limit || 0} tokens</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
          {progress.toFixed(0)}%
        </span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-ocean via-mint to-coral transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  );
}
