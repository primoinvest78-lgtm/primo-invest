export default function IntegracoesLoading() {
  return (
    <div className="space-y-6">
      <section className="h-[148px] animate-pulse rounded-2xl bg-secondary/40" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
