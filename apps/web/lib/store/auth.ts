"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@freshorder/shared";
import type { Store, User } from "@freshorder/shared";

interface AuthState {
  user?: User;
  store?: Store;
  hydrated: boolean;
  loginAsMockOwner: () => Promise<void>;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: undefined,
      store: undefined,
      hydrated: false,
      loginAsMockOwner: async () => {
        const user = await api.getCurrentUser("u-owner-1");
        if (!user) throw new Error("mock owner not found");
        const store = user.storeId
          ? await api.getStore(user.storeId)
          : undefined;
        set({ user, store });
      },
      logout: () => set({ user: undefined, store: undefined }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "freshorder-auth",
      partialize: (s) => ({ user: s.user, store: s.store }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
