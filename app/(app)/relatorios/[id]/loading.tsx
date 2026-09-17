export default function RelatorioLoading() {
  return (
    <div className="space-y-6">
      <section className="h-[148px] animate-pulse rounded-2xl bg-secondary/40" />
      <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
      <div className="h-[180px] animate-pulse rounded-2xl bg-secondary/40" />

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
      ))}
    </div>
  );
}
