import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types/api.types";
import * as authApi from "@/api/auth.api";
import { DEFAULT_CLINIC_ID } from "@/lib/constants";

// ── State ───────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

// ── Thunk payloads ──────────────────────────────────────────

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  insuranceNumber?: string;
}

// ── Async thunks ────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (params: LoginParams) => {
    const res = await authApi.login(params);
    return res.data;
  },
);

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (params: RegisterParams) => {
    const res = await authApi.register({ ...params, clinicId: DEFAULT_CLINIC_ID });
    return res.data;
  },
);

// ── Slice ───────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>,
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      });
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
