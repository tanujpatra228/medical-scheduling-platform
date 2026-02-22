import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types/api.types";
import * as authApi from "@/api/auth.api";
import { setTokenStore } from "@/api/client";
import { DEFAULT_CLINIC_ID } from "@/lib/constants";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    insuranceNumber?: string;
  }) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);

  // Wire up token store for the API client
  useEffect(() => {
    setTokenStore({
      getAccessToken: () => accessTokenRef.current,
      getRefreshToken: () => refreshTokenRef.current,
      setTokens: (access, refresh) => {
        accessTokenRef.current = access;
        refreshTokenRef.current = refresh;
      },
      clearTokens: () => {
        accessTokenRef.current = null;
        refreshTokenRef.current = null;
        setUser(null);
      },
    });

    // Try to restore session from sessionStorage
    const stored = sessionStorage.getItem("auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        accessTokenRef.current = parsed.accessToken;
        refreshTokenRef.current = parsed.refreshToken;
        setUser(parsed.user);
      } catch {
        sessionStorage.removeItem("auth");
      }
    }
    setIsLoading(false);
  }, []);

  const persistSession = useCallback(
    (accessToken: string, refreshToken: string, userData: User) => {
      accessTokenRef.current = accessToken;
      refreshTokenRef.current = refreshToken;
      setUser(userData);
      sessionStorage.setItem(
        "auth",
        JSON.stringify({ accessToken, refreshToken, user: userData }),
      );
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      const { accessToken, refreshToken, user: userData } = res.data;
      persistSession(accessToken, refreshToken, userData);
    },
    [persistSession],
  );

  const register = useCallback(
    async (params: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      dateOfBirth?: string;
      insuranceNumber?: string;
    }) => {
      const res = await authApi.register({
        ...params,
        clinicId: DEFAULT_CLINIC_ID,
      });
      const { accessToken, refreshToken, user: userData } = res.data;
      persistSession(accessToken, refreshToken, userData);
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    setUser(null);
    sessionStorage.removeItem("auth");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
