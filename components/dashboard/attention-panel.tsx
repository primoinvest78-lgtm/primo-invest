import type { AttentionItem } from "@/lib/mock/dashboard";

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B2238] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">Atenção</p>
        <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-white">
          O que precisa da sua atenção
        </h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.description}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/3 p-3.5"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-5 text-white/90">{item.description}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/55">
                    Prioridade {item.priority}
                  </span>
                  <span className="rounded-full bg-[#061827] px-2 py-1 text-[11px] font-semibold text-white ring-1 ring-white/10">
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
