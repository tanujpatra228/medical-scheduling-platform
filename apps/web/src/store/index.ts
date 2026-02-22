import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storageSession from "redux-persist/lib/storage/session";
import authReducer from "./auth.slice";

// ── Persisted auth reducer ──────────────────────────────────

const authPersistConfig = {
  key: "auth",
  storage: storageSession,
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

// ── Store ───────────────────────────────────────────────────

export const store = configureStore({
  reducer: { auth: persistedAuthReducer },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// ── Types ───────────────────────────────────────────────────

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
