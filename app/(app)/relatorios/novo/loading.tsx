export default function NovoRelatorioLoading() {
  return (
    <div className="space-y-6">
      <section className="h-[148px] animate-pulse rounded-2xl bg-secondary/40" />
      <div className="h-16 animate-pulse rounded-2xl border border-border bg-card" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
