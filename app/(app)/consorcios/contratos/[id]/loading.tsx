export default function ContractDetailLoading() {
  return (
    <div className="space-y-6">
      <section className="h-[150px] animate-pulse rounded-2xl bg-secondary/40" />

      <div className="flex gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-28 animate-pulse rounded-md bg-muted" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>

      <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
    </div>
  );
}
