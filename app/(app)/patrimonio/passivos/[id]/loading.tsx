export default function LiabilityDetailLoading() {
  return (
    <div className="space-y-6">
      <section className="h-[150px] animate-pulse rounded-2xl bg-secondary/40" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>

      <div className="h-56 animate-pulse rounded-2xl border border-border bg-card" />
      <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
    </div>
  );
}
