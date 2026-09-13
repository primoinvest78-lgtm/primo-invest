export default function LeadsLoading() {
  return (
    <div className="space-y-6">
      <section className="h-[124px] animate-pulse rounded-2xl bg-secondary/40" />
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-96 w-[280px] shrink-0 animate-pulse rounded-2xl bg-muted/40" />
        ))}
      </div>
    </div>
  );
}
