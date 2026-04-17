export default function ChatPanel({
  messages,
  prompt,
  onPromptChange,
  onSubmit,
  isLoading,
  isSendDisabled,
  disabledMessage
}) {
  return (
    <section className="flex min-h-[540px] flex-col rounded-[2rem] bg-white/90 shadow-panel">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-xl font-semibold text-ink">Generador de texto</h2>
        <p className="mt-1 text-sm text-slate-500">
          Envía un prompt y observa cómo la plataforma refleja el control del proxy.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {messages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Aún no hay mensajes. Escribe un prompt para iniciar la demo.
          </div>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[90%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "ml-auto bg-ocean text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {message.content}
            </article>
          ))
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t border-slate-100 px-6 py-5">
        <label className="block text-sm font-medium text-slate-500" htmlFor="prompt-input">
          Prompt
        </label>
        <textarea
          id="prompt-input"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          rows={4}
          placeholder="Escribe lo que quieres generar..."
          className="mt-2 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-ocean disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoading}
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-sm ${isSendDisabled ? "font-semibold text-red-700" : "text-slate-500"}`}>
            {disabledMessage}
          </p>
          <button
            type="submit"
            disabled={isSendDisabled || isLoading}
            className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ocean disabled:cursor-not-allowed disabled:bg-red-300 disabled:text-red-900"
          >
            {isLoading ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </section>
  );
}
