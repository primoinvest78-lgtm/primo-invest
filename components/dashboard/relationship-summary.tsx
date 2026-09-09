import type { RelationshipSummaryData } from "@/lib/mock/dashboard";

export function RelationshipSummary({ items }: { items: RelationshipSummaryData[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B2238] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">Relacionamento</p>
        <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-white">Relacionamento</h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/4 p-3">
            <span className="min-w-0 flex-1 text-sm text-white/70">{item.label}</span>
            <span className="shrink-0 text-base font-semibold text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
