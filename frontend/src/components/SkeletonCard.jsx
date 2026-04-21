function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border/70 bg-muted/40 p-4">
      <div className="mb-3 h-4 w-2/3 rounded bg-muted" />
      <div className="mb-2 h-3 w-1/2 rounded bg-muted" />
      <div className="h-9 w-full rounded bg-muted" />
    </div>
  );
}

export default SkeletonCard;
