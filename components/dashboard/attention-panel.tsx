import type { AttentionItem } from "@/lib/mock/dashboard";

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  return (
    <div className="rounded-2xl border border-[#DCE3EA] bg-white p-5 shadow-[0_12px_30px_rgba(7,26,45,0.03)]">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#64748B]">Atenção</p>
        <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#071A2D]">
          O que precisa da sua atenção
        </h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.description}
              className="flex items-start gap-3 rounded-xl border border-[#DCE3EA] bg-[#F5F7FA]/70 p-3.5"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#142235]">{item.description}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#64748B]">
                    Prioridade {item.priority}
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[#071A2D] ring-1 ring-[#DCE3EA]">
                    {item.quantity}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
