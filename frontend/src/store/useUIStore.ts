"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// One slider (0.85–1.3, default 1) drives both text size and spacing across
// the app — replaces the old separate Small/Default/Large + Comfortable/
// Compact pickers.
export const UI_SCALE_MIN = 0.85;
export const UI_SCALE_MAX = 1.3;
export const UI_SCALE_DEFAULT = 1;

interface UIState {
  leftWidth: number;
  rightWidth: number;
  leftPinned: boolean;
  rightOpen: boolean;
  uiScale: number;
  skipCache: boolean;
  setLeftWidth: (w: number) => void;
  setRightWidth: (w: number) => void;
  toggleLeftPinned: () => void;
  toggleRight: () => void;
  setUiScale: (s: number) => void;
  toggleSkipCache: () => void;
}

const clamp = (w: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, w));

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      leftWidth: 288,
      rightWidth: 392,
      leftPinned: false,
      rightOpen: true,
      uiScale: UI_SCALE_DEFAULT,
      skipCache: false,
      setLeftWidth: (w) => set({ leftWidth: clamp(w, 240, 460) }),
      setRightWidth: (w) => set({ rightWidth: clamp(w, 320, 620) }),
      toggleLeftPinned: () => set((s) => ({ leftPinned: !s.leftPinned })),
      toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
      setUiScale: (s) => set({ uiScale: clamp(s, UI_SCALE_MIN, UI_SCALE_MAX) }),
      toggleSkipCache: () => set((s) => ({ skipCache: !s.skipCache })),
    }),
    { name: "ekdp-ui" },
  ),
);
