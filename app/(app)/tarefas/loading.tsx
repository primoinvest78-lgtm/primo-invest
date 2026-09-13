export default function TarefasLoading() {
  return (
    <div className="space-y-6">
      <section className="h-[124px] animate-pulse rounded-2xl bg-secondary/40" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
