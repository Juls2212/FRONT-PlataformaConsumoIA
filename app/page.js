"use client";

import { useEffect, useMemo, useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import PlanBadge from "@/components/PlanBadge";
import QuotaProgress from "@/components/QuotaProgress";
import RequestCounterCard from "@/components/RequestCounterCard";
import TokenEstimator from "@/components/TokenEstimator";
import UpgradeModal from "@/components/UpgradeModal";
import UsageHistoryChart from "@/components/UsageHistoryChart";
import UserSelector from "@/components/UserSelector";
import {
  generateText,
  getApiBaseUrl,
  getQuotaHistory,
  getQuotaStatus,
  upgradePlan
} from "@/services/api";

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
    quotaUsed: payload?.quotaUsed ?? payload?.monthlyUsed ?? payload?.monthlyTokensUsed ?? 0,
    quotaLimit: payload?.quotaLimit ?? payload?.monthlyLimit ?? payload?.monthlyTokenLimit ?? 0,
    currentRequests: payload?.currentRequests ?? payload?.requestsThisMinute ?? payload?.requestsUsedCurrentMinute ?? 0,
    requestLimit: payload?.requestLimit ?? payload?.requestsPerMinute ?? payload?.requestLimitCurrentMinute ?? 0,
    remainingLockSeconds: payload?.remainingLockSeconds ?? payload?.retryAfterSeconds ?? 0
  };
}

function normalizeGeneratedText(payload) {
  if (typeof payload === "string") {
    return payload;
  }

  return payload?.generatedText || payload?.text || payload?.response || payload?.message || "Respuesta recibida.";
}

function createLastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));

    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", ""),
      tokens: 0
    };
  });
}

function normalizeHistory(payload) {
  const baseDays = createLastSevenDays();
  const rawItems = Array.isArray(payload) ? payload : payload?.items || payload?.history || [];
  const tokensByDay = new Map();

  rawItems.forEach((item) => {
    const rawDate = item?.date || item?.day || item?.createdAt || item?.timestamp;
    const date = rawDate ? new Date(rawDate) : null;

    if (!date || Number.isNaN(date.getTime())) {
      return;
    }

    const key = date.toISOString().slice(0, 10);
    const tokenValue = Number(item?.tokens ?? item?.usedTokens ?? item?.totalTokens ?? item?.value ?? 0);
    tokensByDay.set(key, tokenValue);
  });

  return baseDays.map((day) => ({
    ...day,
    tokens: tokensByDay.get(day.key) || 0
  }));
}

export default function HomePage() {
  const [selectedUserId, setSelectedUserId] = useState("student-free");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState(defaultMessages);
  const [quotaStatus, setQuotaStatus] = useState(defaultStatus);
  const [historyData, setHistoryData] = useState(createLastSevenDays());
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [statusError, setStatusError] = useState("");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState("BASIC");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

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

  async function refreshDashboard(userId, options = {}) {
    const { keepMessages = false } = options;

    if (!keepMessages) {
      setStatusError("");
    }

    setIsInitializing(true);
    setIsHistoryLoading(true);

    try {
      const [statusPayload, historyPayload] = await Promise.all([
        getQuotaStatus(userId),
        getQuotaHistory(userId)
      ]);

      setQuotaStatus(normalizeStatus(statusPayload));
      setHistoryData(normalizeHistory(historyPayload));
    } catch (error) {
      setStatusError(
        error.message === "Missing NEXT_PUBLIC_API_BASE_URL"
          ? "Configura NEXT_PUBLIC_API_BASE_URL para conectar el frontend con el backend."
          : "No fue posible cargar el estado del consumo en este momento."
      );
    } finally {
      setIsInitializing(false);
      setIsHistoryLoading(false);
    }
  }

  useEffect(() => {
    refreshDashboard(selectedUserId);
  }, [selectedUserId]);

  const isSendLocked = quotaStatus.remainingLockSeconds > 0;
  const isQuotaExhausted =
    quotaStatus.quotaLimit > 0 && quotaStatus.quotaUsed >= quotaStatus.quotaLimit;
  const isSubmitBlocked = isInitializing || isSendLocked || isQuotaExhausted || isUpgrading;

  async function handleSubmit(event) {
    event.preventDefault();

    if (!prompt.trim() || isSubmitBlocked) {
      return;
    }

    const currentPrompt = prompt;
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: currentPrompt
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setIsLoading(true);
    setStatusError("");

    try {
      const payload = await generateText(selectedUserId, currentPrompt, estimateTokens(currentPrompt));
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: normalizeGeneratedText(payload)
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
      setPrompt("");

      await refreshDashboard(selectedUserId, { keepMessages: true });
    } catch (error) {
      if (error.status === 429) {
        const retryAfterSeconds =
          error.retryAfterSeconds ||
          error.payload?.retryAfterSeconds ||
          error.payload?.remainingLockSeconds ||
          0;

        setQuotaStatus((currentStatus) => ({
          ...currentStatus,
          ...normalizeStatus(error.payload),
          remainingLockSeconds: retryAfterSeconds
        }));

        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: `Límite alcanzado. Intenta nuevamente en ${retryAfterSeconds}s.`
          }
        ]);

        setStatusError("Se alcanzó el límite temporal de solicitudes.");
      } else if (error.status === 402) {
        if (error.payload) {
          setQuotaStatus((currentStatus) => ({
            ...currentStatus,
            ...normalizeStatus(error.payload)
          }));
        }

        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `quota-${Date.now()}`,
            role: "assistant",
            content: "La cuota mensual está agotada. Actualiza el plan para seguir generando."
          }
        ]);

        setStatusError("La cuota mensual está agotada.");
        setUpgradeError("");
        setIsUpgradeModalOpen(true);
      } else {
        const errorMessage = "No fue posible generar la respuesta.";

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
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpgrade() {
    setIsUpgrading(true);
    setUpgradeError("");

    try {
      await upgradePlan(selectedUserId, selectedUpgradePlan);
      await refreshDashboard(selectedUserId, { keepMessages: true });
      setIsUpgradeModalOpen(false);
      setStatusError("");
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `upgrade-${Date.now()}`,
          role: "assistant",
          content: "Tu plan fue actualizado correctamente. Ya puedes continuar con la demo."
        }
      ]);
    } catch (error) {
      setUpgradeError("No fue posible actualizar el plan en este momento.");
    } finally {
      setIsUpgrading(false);
    }
  }

  function handleCloseUpgradeModal() {
    if (isUpgrading) {
      return;
    }

    setIsUpgradeModalOpen(false);
    setUpgradeError("");
  }

  const disabledMessage = isSendLocked
    ? `Límite alcanzado. Podrás enviar nuevamente en ${quotaStatus.remainingLockSeconds}s.`
    : isQuotaExhausted
      ? "La cuota mensual está agotada para este usuario."
      : "El envío usa el backend real y mostrará el consumo controlado por el proxy.";

  return (
    <>
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/60 bg-white/55 p-6 shadow-panel backdrop-blur xl:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ocean">Demo del proxy</p>
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
                <p className="mt-1 break-all text-sm text-ink">{getApiBaseUrl() || "Sin configurar"}</p>
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
              isSendDisabled={isSubmitBlocked}
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
            </div>
          </div>

          <div className="mt-6">
            <UsageHistoryChart data={historyData} isLoading={isHistoryLoading} />
          </div>
        </section>
      </main>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        selectedPlan={selectedUpgradePlan}
        onPlanChange={setSelectedUpgradePlan}
        onClose={handleCloseUpgradeModal}
        onConfirm={handleUpgrade}
        isLoading={isUpgrading}
        errorMessage={upgradeError}
      />
    </>
  );
}
