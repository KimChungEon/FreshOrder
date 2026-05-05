import { create } from "zustand";
import { api } from "@freshorder/shared";
import type { User } from "@freshorder/shared";

interface AuthState {
  user?: User;
  loading: boolean;
  loginAsAdmin: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: undefined,
  loading: false,
  loginAsAdmin: async () => {
    set({ loading: true });
    try {
      const u = await api.getCurrentUser("u-admin-1");
      set({ user: u });
    } finally {
      set({ loading: false });
    }
  },
  logout: () => set({ user: undefined }),
}));
