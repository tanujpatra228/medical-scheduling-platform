import { API_BASE_URL } from "@/lib/constants";
import { store } from "@/store";
import { clearCredentials, setCredentials } from "@/store/auth.slice";

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

// Mutex to prevent concurrent refresh attempts
let refreshPromise: Promise<boolean> | null = null;

async function doRefreshAccessToken(): Promise<boolean> {
  const { refreshToken } = store.getState().auth;
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return false;
    }

    const data = json as { success?: boolean; data?: { accessToken: string; refreshToken: string } };
    if (data.success && data.data) {
      const { user } = store.getState().auth;
      if (user) {
        store.dispatch(
          setCredentials({
            user,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          }),
        );
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = doRefreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string>),
  };

  const { accessToken } = store.getState().auth;
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = store.getState().auth.accessToken;
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
      }
      res = await fetch(url, { ...options, headers });
    } else {
      store.dispatch(clearCredentials());
    }
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(
      res.status,
      "PARSE_ERROR",
      `Server returned non-JSON response (${res.status})`,
    );
  }

  const body = json as { success?: boolean; error?: { code?: string; message?: string; details?: unknown } };

  if (!res.ok || !body.success) {
    throw new ApiError(
      res.status,
      body.error?.code ?? "UNKNOWN_ERROR",
      body.error?.message ?? "An unexpected error occurred",
      body.error?.details,
    );
  }

  return json as T;
}
