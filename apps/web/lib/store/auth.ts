"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import { api, tokenStore } from "@freshorder/shared";
import type { User } from "@freshorder/shared";

interface JwtPayload {
  sub: string;
  email: string;
  role: User["role"];
  storeId?: string;
  exp?: number;
}

interface AuthState {
  user?: User;
  storeId?: string;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: api.SignupInput) => Promise<void>;
  logout: () => void;
  refreshFromToken: () => void;
  setHydrated: () => void;
}

function userFromToken(): { user: User; storeId?: string } | null {
  const token = tokenStore.getAccess();
  if (!token) return null;
  try {
    const payload = jwtDecode<JwtPayload>(token);
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return {
      user: {
        id: payload.sub,
        email: payload.email,
        name: "",
        role: payload.role,
        isApproved: true,
        storeId: payload.storeId,
        createdAt: new Date().toISOString(),
      },
      storeId: payload.storeId,
    };
  } catch {
    return null;
  }
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: undefined,
      storeId: undefined,
      hydrated: false,
      login: async (email, password) => {
        const res = await api.login(email, password);
        set({ user: res.user, storeId: res.user.storeId });
      },
      signup: async (input) => {
        const res = await api.signup(input);
        set({ user: res.user, storeId: res.user.storeId });
      },
      logout: () => {
        api.logout();
        set({ user: undefined, storeId: undefined });
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },
      refreshFromToken: () => {
        const decoded = userFromToken();
        if (decoded) {
          // 기존 user 정보(name 등)는 유지하되, storeId는 토큰 우선
          const cur = get().user;
          set({
            user: cur ?? decoded.user,
            storeId: decoded.storeId ?? cur?.storeId,
          });
        }
      },
      setHydrated: () => {
        set({ hydrated: true });
        get().refreshFromToken();
      },
    }),
    {
      name: "freshorder-auth",
      partialize: (s) => ({ user: s.user, storeId: s.storeId }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
