const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "/api/v1";

export interface ApiErrorBody {
  status: "error";
  code: string;
  message: string;
  requestId?: string;
  errors?: Array<{ field: string; message: string }>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly fieldErrors: ApiErrorBody["errors"];

  constructor(
    message: string,
    status: number,
    code = "REQUEST_FAILED",
    requestId?: string,
    fieldErrors: ApiErrorBody["errors"] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.fieldErrors = fieldErrors;
  }
}

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let refreshRequest: Promise<boolean> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  accessTokenExpiresAt = 0;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") ?? "")) as { exp?: number };
      accessTokenExpiresAt = typeof payload.exp === "number" ? payload.exp * 1000 : 0;
    } catch {
      accessTokenExpiresAt = 0;
    }
  }
}

async function parseError(response: Response) {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  return new ApiError(
    body?.message ?? `Request failed with status ${response.status}`,
    response.status,
    body?.code,
    body?.requestId,
    body?.errors,
  );
}

async function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const result = (await response.json()) as { data: { accessToken: string } };
        setAccessToken(result.data.accessToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retryAfterRefresh = true,
): Promise<T> {
  if (
    accessToken &&
    accessTokenExpiresAt > 0 &&
    accessTokenExpiresAt <= Date.now() + 15_000 &&
    !path.startsWith("/auth/")
  ) {
    if (!(await refreshAccessToken())) setAccessToken(null);
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
      signal: init.signal ?? controller.signal,
    });
    if (response.status === 401 && retryAfterRefresh && path !== "/auth/refresh") {
      if (await refreshAccessToken()) return apiRequest<T>(path, init, false);
      setAccessToken(null);
    }
    if (!response.ok) throw await parseError(response);
    if (response.status === 204) return undefined as T;
    const result = (await response.json()) as { data: T };
    return result.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The request timed out. Please try again.", 408, "REQUEST_TIMEOUT");
    }
    throw new ApiError("The server could not be reached. Check your connection and try again.", 0, "NETWORK_ERROR");
  } finally {
    window.clearTimeout(timeout);
  }
}
