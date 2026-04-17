"use client";

import { useEffect, useMemo, useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import PlanBadge from "@/components/PlanBadge";
import QuotaProgress from "@/components/QuotaProgress";
import RequestCounterCard from "@/components/RequestCounterCard";
import TokenEstimator from "@/components/TokenEstimator";
import UserSelector from "@/components/UserSelector";
import { generateText, getApiBaseUrl, getQuotaHistory, getQuotaStatus } from "@/services/api";

const defaultMessages = [
  {
    id: "welcome-message",
    role: "assistant",
    content: "Bienvenido. Aquí podrás ver cómo el sistema controla el uso según el plan y la cuota disponible."
  }
];

const defaultStatus = {
  plan: "FREE",
  quotaUsed: 0,
  quotaLimit: 0,
  currentRequests: 0,
  requestLimit: 0,
  remainingLockSeconds: 0
};

function estimateTokens(prompt) {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    return 0;
  }

  return Math.max(1, Math.ceil(trimmedPrompt.length / 4));
}

function normalizeStatus(payload) {
  return {
    plan: payload?.plan || payload?.currentPlan || "FREE",
    quotaUsed: payload?.quotaUsed ?? payload?.monthlyUsed ?? 0,
    quotaLimit: payload?.quotaLimit ?? payload?.monthlyLimit ?? 0,
    currentRequests: payload?.currentRequests ?? payload?.requestsThisMinute ?? 0,
    requestLimit: payload?.requestLimit ?? payload?.requestsPerMinute ?? 0,
    remainingLockSeconds: payload?.remainingLockSeconds ?? payload?.retryAfterSeconds ?? 0
  };
}

function normalizeGeneratedText(payload) {
  if (typeof payload === "string") {
    return payload;
  }

  return payload?.text || payload?.response || payload?.message || "Respuesta recibida.";
}

export default function HomePage() {
  const [selectedUserId, setSelectedUserId] = useState("student-free");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState(defaultMessages);
  const [quotaStatus, setQuotaStatus] = useState(defaultStatus);
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [statusError, setStatusError] = useState("");

  const estimatedTokens = useMemo(() => estimateTokens(prompt), [prompt]);

  useEffect(() => {
    const savedUserId = window.localStorage.getItem("demo-user-id");
    if (savedUserId) {
      setSelectedUserId(savedUserId);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("demo-user-id", selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    let intervalId;

    if (quotaStatus.remainingLockSeconds > 0) {
      intervalId = window.setInterval(() => {
        setQuotaStatus((currentStatus) => ({
          ...currentStatus,
          remainingLockSeconds: Math.max(currentStatus.remainingLockSeconds - 1, 0)
        }));
      }, 1000);
    }

    return () => {
      window.clearInterval(intervalId);
    };
  }, [quotaStatus.remainingLockSeconds]);

  useEffect(() => {
    async function loadDashboard() {
      setIsInitializing(true);
      setStatusError("");

      try {
        const [statusPayload, historyPayload] = await Promise.all([
          getQuotaStatus(selectedUserId),
          getQuotaHistory(selectedUserId)
        ]);

        setQuotaStatus(normalizeStatus(statusPayload));
        setHistoryItems(Array.isArray(historyPayload) ? historyPayload : historyPayload?.items || []);
      } catch (error) {
        setStatusError(
          error.message === "Missing NEXT_PUBLIC_API_BASE_URL"
            ? "Configura NEXT_PUBLIC_API_BASE_URL para conectar el frontend con el backend."
            : "No fue posible cargar el estado del consumo en este momento."
        );
      } finally {
        setIsInitializing(false);
      }
    }

    loadDashboard();
  }, [selectedUserId]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!prompt.trim() || isSendLocked) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setIsLoading(true);
    setStatusError("");

    try {
      const payload = await generateText(selectedUserId, prompt, estimatedTokens);
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: normalizeGeneratedText(payload)
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
      setPrompt("");

      const refreshedStatus = await getQuotaStatus(selectedUserId);
      setQuotaStatus(normalizeStatus(refreshedStatus));
    } catch (error) {
      const errorMessage =
        error.status === 429
          ? "Se alcanzó el límite temporal de solicitudes."
          : "No fue posible generar la respuesta.";

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: errorMessage
        }
      ]);

      if (error.payload) {
        setQuotaStatus((currentStatus) => ({
          ...currentStatus,
          ...normalizeStatus(error.payload)
        }));
      }

      setStatusError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const isSendLocked = quotaStatus.remainingLockSeconds > 0;
  const disabledMessage = isSendLocked
    ? `Límite alcanzado. Podrás enviar nuevamente en ${quotaStatus.remainingLockSeconds}s.`
    : "El envío usa el backend real y mostrará el consumo controlado por el proxy.";

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/60 bg-white/55 p-6 shadow-panel backdrop-blur xl:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Proxy Pattern Demo</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">
              Plataforma de consumo IA con control visible de cuota y límite
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Esta pantalla concentra el chat, el plan activo y los indicadores necesarios para demostrar cómo el proxy del backend regula el acceso.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:max-w-sm">
            <UserSelector selectedUserId={selectedUserId} onChange={setSelectedUserId} />
            <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-panel">
              <p className="text-sm font-medium text-slate-500">Backend conectado</p>
              <p className="mt-1 break-all text-sm text-ink">
                {getApiBaseUrl() || "Sin configurar"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-panel">
              <p className="text-sm font-medium text-slate-500">Plan actual</p>
              <div className="mt-2">
                <PlanBadge planName={quotaStatus.plan} />
              </div>
            </div>
          </div>
        </div>

        {statusError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {statusError}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <ChatPanel
            messages={messages}
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isSendDisabled={isInitializing || isSendLocked}
            disabledMessage={disabledMessage}
          />

          <div className="space-y-6">
            <QuotaProgress used={quotaStatus.quotaUsed} limit={quotaStatus.quotaLimit} />
            <RequestCounterCard
              currentRequests={quotaStatus.currentRequests}
              requestLimit={quotaStatus.requestLimit}
              lockSeconds={quotaStatus.remainingLockSeconds}
            />
            <TokenEstimator estimatedTokens={estimatedTokens} />

            <section className="rounded-3xl bg-white/90 p-5 shadow-panel">
              <p className="text-sm font-medium text-slate-500">Historial reciente</p>
              <div className="mt-4 space-y-3">
                {historyItems.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {isInitializing
                      ? "Cargando historial..."
                      : "Aún no hay datos de historial para este usuario."}
                  </p>
                ) : (
                  historyItems.slice(0, 5).map((item, index) => (
                    <div key={`${item?.date || "history"}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-sm font-medium text-ink">{item?.date || "Registro"}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item?.tokens ?? item?.usedTokens ?? 0} tokens utilizados
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
