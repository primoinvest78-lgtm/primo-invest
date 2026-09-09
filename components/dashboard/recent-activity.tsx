import type { RecentActivityItem } from "@/lib/mock/dashboard";

export function RecentActivity({ items }: { items: RecentActivityItem[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B2238] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">Movimento</p>
        <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-white">Atividade recente</h3>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <div className="mt-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#061827] ring-2 ring-white/10">
              <span className={`h-2 w-2 rounded-full ${item.tone}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white/90">{item.title}</p>
              <p className="mt-1 text-xs text-white/55">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
