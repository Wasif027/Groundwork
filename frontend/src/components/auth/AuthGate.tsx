"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/store/useAuthStore";
import { AuthScreen } from "./AuthScreen";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Show the real sign-in screen while the session check is in flight instead
  // of a bare spinner — the initial HTML then always carries a real H1 and
  // product proposition (crawlers/link-previews never see JS-only content),
  // and a logged-out visitor sees this exact screen either way. A returning
  // logged-in visitor briefly sees it flash before the app takes over.
  if (status === "loading" || status === "anon") return <AuthScreen />;
  return <>{children}</>;
}
