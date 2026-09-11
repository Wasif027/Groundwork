"use client";

import { cn } from "@/lib/utils";
import type { Icon } from "./icons";

export function Toggle({
  active,
  onClick,
  icon: I,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: Icon;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-2xs font-medium transition-colors",
        active
          ? "border-accent/35 bg-accent-soft text-accent"
          : "border-line bg-surface-sunken text-content-muted hover:text-content-primary",
      )}
    >
      <I className="h-3 w-3" weight={active ? "fill" : "regular"} />
      {children}
    </button>
  );
}
