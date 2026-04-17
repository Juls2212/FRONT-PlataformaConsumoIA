export default function TokenEstimator({ estimatedTokens = 0 }) {
  return (
    <section className="rounded-3xl bg-white/90 p-5 shadow-panel">
      <p className="text-sm font-medium text-slate-500">Estimación antes de enviar</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-ink">{estimatedTokens}</h2>
          <p className="text-sm text-slate-500">tokens aproximados</p>
        </div>
        <div className="max-w-44 text-right text-xs text-slate-500">
          La estimación ayuda a visualizar el consumo antes de usar la cuota.
        </div>
      </div>
    </section>
  );
}
