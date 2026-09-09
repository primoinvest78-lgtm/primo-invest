import type { GoalItem } from "@/lib/mock/dashboard";

export function GoalsSummary({ items }: { items: GoalItem[] }) {
  return (
    <div className="rounded-2xl border border-[#DCE3EA] bg-white p-5 shadow-[0_12px_30px_rgba(7,26,45,0.03)]">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#64748B]">Patrimônio</p>
        <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#071A2D]">Metas patrimoniais</h3>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-[#DCE3EA] bg-[#F5F7FA]/80 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#142235]">{item.label}</span>
              <span className="text-xs font-medium text-[#64748B]">{item.value} / {item.target}</span>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-[#DCE3EA]">
              <div
                className="h-2.5 rounded-full"
                style={{ width: `${item.progress}%`, backgroundColor: item.tone }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
