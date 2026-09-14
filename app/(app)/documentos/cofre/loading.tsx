export default function CofreLoading() {
  return (
    <div className="space-y-6">
      <section className="h-[124px] animate-pulse rounded-2xl bg-secondary/40" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>

      <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
    </div>
  );
}
