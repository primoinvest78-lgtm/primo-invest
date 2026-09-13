export default function ClientesLoading() {
  return (
    <div className="space-y-6">
      <section className="h-[124px] animate-pulse rounded-2xl bg-secondary/40" />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="h-10 w-full animate-pulse rounded-xl bg-muted md:max-w-xs" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-muted md:w-[180px]" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-muted md:w-[220px]" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="h-11 animate-pulse bg-muted/60" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-0"
            >
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
