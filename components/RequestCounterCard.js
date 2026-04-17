export default function RequestCounterCard({
  currentRequests = 0,
  requestLimit = 0,
  lockSeconds = 0
}) {
  const isLocked = lockSeconds > 0;

  return (
    <section className="rounded-3xl bg-white/90 p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Solicitudes por minuto</p>
          <h2 className="text-3xl font-semibold text-ink">
            {currentRequests}
            <span className="text-lg text-slate-400"> / {requestLimit || 0}</span>
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            isLocked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {isLocked ? "Bloqueado" : "Disponible"}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-600">
        {isLocked
          ? `Espera ${lockSeconds}s para volver a enviar.`
          : "Puedes seguir enviando solicitudes dentro del minuto actual."}
      </p>
    </section>
  );
}
