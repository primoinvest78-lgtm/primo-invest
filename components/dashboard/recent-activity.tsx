import type { RecentActivityItem } from "@/lib/mock/dashboard";

export function RecentActivity({ items }: { items: RecentActivityItem[] }) {
  return (
    <div className="rounded-2xl border border-[#DCE3EA] bg-white p-5 shadow-[0_12px_30px_rgba(7,26,45,0.03)]">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#64748B]">Movimento</p>
        <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#071A2D]">Atividade recente</h3>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <div className="mt-1 flex h-3 w-3 items-center justify-center rounded-full bg-white ring-2 ring-[#DCE3EA]">
              <span className={`h-2 w-2 rounded-full ${item.tone}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#142235]">{item.title}</p>
              <p className="mt-1 text-xs text-[#64748B]">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
