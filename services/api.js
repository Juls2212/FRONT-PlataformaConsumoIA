const apiBaseUrl = "https://back-plataformaconsumoia.onrender.com";

const demoUserIdMap = {
  "student-free": 1,
  "student-basic": 2,
  "student-pro": 3
};

function resolveUserId(userId) {
  if (typeof userId === "number") {
    return userId;
  }

  return demoUserIdMap[userId] ?? userId;
}

function buildUrl(path) {
  return `${apiBaseUrl}${path}`;
}

function buildStatusUrl(userId) {
  const url = new URL(buildUrl("/api/quota/status"));
  const resolvedUserId = resolveUserId(userId);

  if (resolvedUserId) {
    url.searchParams.set("userId", resolvedUserId);
  }

  return url.toString();
}

function buildHistoryUrl(userId) {
  const url = new URL(buildUrl("/api/quota/history"));
  const resolvedUserId = resolveUserId(userId);

  if (resolvedUserId) {
    url.searchParams.set("userId", resolvedUserId);
  }

  return url.toString();
}

function parseRetryAfter(retryAfterValue) {
  if (!retryAfterValue) {
    return 0;
  }

  const retryAfterSeconds = Number(retryAfterValue);

  if (Number.isFinite(retryAfterSeconds)) {
    return Math.max(0, Math.ceil(retryAfterSeconds));
  }

  const retryDate = new Date(retryAfterValue).getTime();

  if (Number.isNaN(retryDate)) {
    return 0;
  }

  return Math.max(0, Math.ceil((retryDate - Date.now()) / 1000));
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload?.message
        ? payload.message
        : "Request failed";

    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    error.retryAfterSeconds = parseRetryAfter(response.headers.get("Retry-After"));
    throw error;
  }

  return payload;
}

function createRequestOptions(method, userId, body) {
  const resolvedUserId = resolveUserId(userId);
  const headers = {
    "Content-Type": "application/json"
  };

  if (resolvedUserId) {
    headers["x-user-id"] = resolvedUserId;
  }

  return {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {})
  };
}

export async function getQuotaStatus(userId) {
  const response = await fetch(buildStatusUrl(userId), {
    ...createRequestOptions("GET", userId),
    cache: "no-store"
  });

  return parseResponse(response);
}

export async function getQuotaHistory(userId) {
  const response = await fetch(buildHistoryUrl(userId), {
    ...createRequestOptions("GET", userId),
    cache: "no-store"
  });

  return parseResponse(response);
}

export async function generateText(userId, prompt, estimatedTokens) {
  const resolvedUserId = resolveUserId(userId);
  const response = await fetch(
    buildUrl("/api/ai/generate"),
    createRequestOptions("POST", resolvedUserId, {
      userId: resolvedUserId,
      prompt,
      estimatedTokens
    })
  );

  return parseResponse(response);
}

export async function upgradePlan(userId, plan) {
  const resolvedUserId = resolveUserId(userId);
  const response = await fetch(
    buildUrl("/api/quota/upgrade"),
    createRequestOptions("POST", resolvedUserId, {
      userId: resolvedUserId,
      plan
    })
  );

  return parseResponse(response);
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}
