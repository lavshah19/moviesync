import { create } from "zustand";
import axios from "axios";
import { authApi } from "../api/auth.api";
import type { AuthUser } from "../types";

// Tokens live in httpOnly cookies (JS can't read them), so the store only holds the user.
// ponytail: no persist; loadUser() rebuilds it from the cookie via /auth/me on reload.
interface AuthState {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated" | "error"; // error = backend unreachable
  setUser: (user: AuthUser) => void;
  clear: () => void;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
}

// One in-flight /auth/me shared by every caller: Strict Mode's double effect in dev, or two
// guards on one page, reuse it instead of sending a second request.
let loadPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: "loading",
  setUser: (user) => set({ user, status: "authenticated" }),
  clear: () => set({ user: null, status: "unauthenticated" }),
  loadUser: () => {
    loadPromise ??= (async () => {
      set({ status: "loading" });
      try {
        set({ user: await authApi.me(), status: "authenticated" });
      } catch (err) {
        // a 4xx means the cookies are stale or invalid: have the server clear them, otherwise
        // proxy.ts (cookie exists -> "/") and AuthGuard (no session -> "/auth") bounce forever.
        // 5xx/network: backend is down, the cookies may still be fine, keep them.
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (status && status < 500) {
          await authApi.logout().catch(() => {});
          set({ user: null, status: "unauthenticated" });
        } else {
          set({ user: null, status: "error" });
        }
      }
    })().finally(() => {
      loadPromise = null;
    });
    return loadPromise;
  },
  logout: async () => {
    await authApi.logout().catch(() => {}); // server clears cookies; clear locally either way
    set({ user: null, status: "unauthenticated" });
  },
}));
