/**
 * The Groundwork mark — three descending-opacity bars, strata / foundation
 * layers settling into place. Matches `public/favicon.svg`, themed with the
 * live design tokens so it always sits correctly on light or dark.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="rgb(var(--content-primary))" />
      <rect x="7" y="8" width="18" height="3.6" rx="1.8" fill="rgb(var(--accent))" />
      <rect x="7" y="14.2" width="18" height="3.6" rx="1.8" fill="rgb(var(--accent))" opacity="0.68" />
      <rect x="7" y="20.4" width="18" height="3.6" rx="1.8" fill="rgb(var(--accent))" opacity="0.42" />
    </svg>
  );
}
