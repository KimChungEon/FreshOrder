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
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshFromToken: () => void;
  setHydrated: () => void;
}

function userFromToken(): User | null {
  const token = tokenStore.getAccess();
  if (!token) return null;
  try {
    const payload = jwtDecode<JwtPayload>(token);
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return {
      id: payload.sub,
      email: payload.email,
      name: "",
      role: payload.role,
      isApproved: true,
      storeId: payload.storeId,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: undefined,
      hydrated: false,
      login: async (email, password) => {
        const res = await api.login(email, password);
        set({ user: res.user });
      },
      logout: () => {
        api.logout();
        set({ user: undefined });
        if (typeof window !== "undefined") {
          window.location.href = "/admin/login";
        }
      },
      refreshFromToken: () => {
        const u = userFromToken();
        if (u) {
          const cur = get().user;
          set({ user: cur ?? u });
        }
      },
      setHydrated: () => {
        set({ hydrated: true });
        get().refreshFromToken();
      },
    }),
    {
      name: "freshorder-admin-auth",
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
