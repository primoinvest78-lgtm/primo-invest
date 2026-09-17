export default function AdministracaoLoading() {
  return (
    <div className="space-y-6">
      <section className="h-[148px] animate-pulse rounded-2xl bg-secondary/40" />

      <div className="h-10 w-96 animate-pulse rounded-xl border border-border bg-card" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>

      <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />
    </div>
  );
}
