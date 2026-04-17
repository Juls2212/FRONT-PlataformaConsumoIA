const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function buildUrl(path) {
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

export function getApiBaseUrl() {
  return apiBaseUrl;
}
