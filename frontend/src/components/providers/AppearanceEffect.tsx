"use client";

import { useEffect } from "react";

import { useUIStore } from "@/store/useUIStore";

/** Applies the persisted font-size / density prefs to <html> as attributes
 * that globals.css keys off. No SSR blocking script — the shift is subtle
 * enough (unlike theme) that a brief default-size flash on first load is fine. */
export function AppearanceEffect() {
  const fontScale = useUIStore((s) => s.fontScale);
  const density = useUIStore((s) => s.density);

  useEffect(() => {
    document.documentElement.setAttribute("data-font", fontScale);
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  return null;
}
