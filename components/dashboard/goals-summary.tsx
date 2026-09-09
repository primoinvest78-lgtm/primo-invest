import type { GoalItem } from "@/lib/mock/dashboard";

export function GoalsSummary({ items }: { items: GoalItem[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B2238] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">Patrimônio</p>
        <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-white">Metas patrimoniais</h3>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-[#122b43] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-white/90">{item.label}</span>
              <span className="text-xs font-medium text-white/60">{item.value} / {item.target}</span>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-white/8">
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
