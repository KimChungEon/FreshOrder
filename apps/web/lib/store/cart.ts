"use client";

import { create } from "zustand";

export interface CartLine {
  productId: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  desiredDeliveryDate?: string;
  memo?: string;
  add: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setDeliveryDate: (d?: string) => void;
  setMemo: (m?: string) => void;
}

export const useCart = create<CartState>((set) => ({
  lines: [],
  desiredDeliveryDate: undefined,
  memo: undefined,
  add: (productId, qty = 1) =>
    set((s) => {
      const exist = s.lines.find((l) => l.productId === productId);
      if (exist) {
        return {
          lines: s.lines.map((l) =>
            l.productId === productId ? { ...l, qty: l.qty + qty } : l,
          ),
        };
      }
      return { lines: [...s.lines, { productId, qty }] };
    }),
  setQty: (productId, qty) =>
    set((s) => ({
      lines:
        qty <= 0
          ? s.lines.filter((l) => l.productId !== productId)
          : s.lines.map((l) =>
              l.productId === productId ? { ...l, qty } : l,
            ),
    })),
  remove: (productId) =>
    set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
  clear: () =>
    set({ lines: [], desiredDeliveryDate: undefined, memo: undefined }),
  setDeliveryDate: (d) => set({ desiredDeliveryDate: d }),
  setMemo: (m) => set({ memo: m }),
}));
