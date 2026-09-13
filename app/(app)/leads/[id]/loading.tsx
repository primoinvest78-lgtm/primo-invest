export default function LeadProfileLoading() {
  return (
    <div className="space-y-6">
      <section className="h-[124px] animate-pulse rounded-2xl bg-secondary/40" />
      <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    </div>
  );
}
