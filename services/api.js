function readApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
}

function buildUrl(path) {
  const apiBaseUrl = readApiBaseUrl();

  if (!apiBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  }

  return `${apiBaseUrl}${path}`;
}

function buildStatusUrl(userId) {
  const url = new URL(buildUrl("/api/quota/status"));

  if (userId) {
    url.searchParams.set("userId", userId);
  }

  return url.toString();
}

function buildHistoryUrl(userId) {
  const url = new URL(buildUrl("/api/quota/history"));

  if (userId) {
    url.searchParams.set("userId", userId);
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
  const headers = {
    "Content-Type": "application/json"
  };

  if (userId) {
    headers["x-user-id"] = userId;
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
  const response = await fetch(
    buildUrl("/api/ai/generate"),
    createRequestOptions("POST", userId, {
      userId,
      prompt,
      estimatedTokens
    })
  );

  return parseResponse(response);
}

export async function upgradePlan(userId, plan) {
  const response = await fetch(
    buildUrl("/api/quota/upgrade"),
    createRequestOptions("POST", userId, {
      userId,
      plan
    })
  );

  return parseResponse(response);
}

export function getApiBaseUrl() {
  return readApiBaseUrl();
}
