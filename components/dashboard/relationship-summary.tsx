import type { RelationshipSummaryData } from "@/lib/mock/dashboard";

export function RelationshipSummary({ items }: { items: RelationshipSummaryData[] }) {
  return (
    <div className="rounded-2xl border border-[#DCE3EA] bg-white p-5 shadow-[0_12px_30px_rgba(7,26,45,0.03)]">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#64748B]">Relacionamento</p>
        <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#071A2D]">Relacionamento</h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-[#DCE3EA] bg-[#F5F7FA]/70 p-3">
            <span className="text-sm text-[#64748B]">{item.label}</span>
            <span className="text-base font-semibold text-[#071A2D]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
