import { API_BASE_URL } from "@/lib/constants";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type TokenStore = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (access: string, refresh: string) => void;
  clearTokens: () => void;
};

let tokenStore: TokenStore | null = null;

export function setTokenStore(store: TokenStore) {
  tokenStore = store;
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenStore?.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const json = await res.json();
    if (json.success) {
      tokenStore?.setTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const accessToken = tokenStore?.getAccessToken();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && tokenStore) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = tokenStore.getAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
      }
      res = await fetch(url, { ...options, headers });
    } else {
      tokenStore.clearTokens();
    }
  }

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(
      res.status,
      json.error?.code ?? "UNKNOWN_ERROR",
      json.error?.message ?? "An unexpected error occurred",
      json.error?.details,
    );
  }

  return json as T;
}
