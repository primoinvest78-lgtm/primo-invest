export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-36 animate-pulse rounded-2xl block-navy-3d" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl card-premium" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl card-premium" />
    </div>
  );
}
