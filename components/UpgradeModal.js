const availablePlans = [
  { id: "BASIC", label: "Plan básico", description: "Más solicitudes y más cuota mensual." },
  { id: "PRO", label: "Plan pro", description: "Mayor capacidad para seguir con la demo sin interrupciones." }
];

export default function UpgradeModal({
  isOpen,
  selectedPlan,
  onPlanChange,
  onClose,
  onConfirm,
  isLoading,
  errorMessage
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Cuota agotada</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Actualiza tu plan para continuar</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              La cuota mensual del usuario actual ya no permite más generaciones. Completa una actualización simple para seguir con la demostración.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {availablePlans.map((plan) => (
            <label
              key={plan.id}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${
                selectedPlan === plan.id
                  ? "border-ocean bg-mist"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="upgrade-plan"
                value={plan.id}
                checked={selectedPlan === plan.id}
                onChange={(event) => onPlanChange(event.target.value)}
                className="mt-1 h-4 w-4 border-slate-300 text-ocean focus:ring-ocean"
              />
              <div>
                <p className="text-sm font-semibold text-ink">{plan.label}</p>
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
              </div>
            </label>
          ))}
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            disabled={isLoading}
          >
            Más tarde
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ocean disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isLoading ? "Procesando pago..." : "Pagar y actualizar"}
          </button>
        </div>
      </div>
    </div>
  );
}
