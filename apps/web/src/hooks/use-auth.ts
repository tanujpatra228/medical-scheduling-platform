import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginThunk, registerThunk, clearCredentials } from "@/store/auth.slice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, accessToken } = useAppSelector((s) => s.auth);

  const login = useCallback(
    (email: string, password: string) =>
      dispatch(loginThunk({ email, password })).unwrap(),
    [dispatch],
  );

  const register = useCallback(
    (params: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      dateOfBirth?: string;
      insuranceNumber?: string;
    }) => dispatch(registerThunk(params)).unwrap(),
    [dispatch],
  );

  const logout = useCallback(() => {
    dispatch(clearCredentials());
  }, [dispatch]);

  return {
    user,
    // PersistGate blocks rendering until rehydration completes,
    // so isLoading is always false when components read it.
    isLoading: false,
    isAuthenticated: !!user && !!accessToken,
    login,
    register,
    logout,
  };
}
