export function Skeleton({ className = "" }: { className?: string }) {
  // Design.md §5: skeleton screens, never a generic spinner for known-shape content.
  return <div className={`animate-pulse rounded-lg bg-[var(--border)] ${className}`} />;
}
