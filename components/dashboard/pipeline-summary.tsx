import type { PipelineStage } from "@/lib/mock/dashboard";

export function PipelineSummary({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="rounded-2xl border border-[#DCE3EA] bg-white p-5 shadow-[0_12px_30px_rgba(7,26,45,0.03)]">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#64748B]">Comercial</p>
        <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#071A2D]">Pipeline comercial</h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {stages.map((stage, index) => (
          <div key={stage.name} className="min-w-[110px] flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${stage.tone}`} />
              <span className="text-[11px] text-[#64748B]">{stage.name}</span>
            </div>

            <div className="rounded-xl border border-[#DCE3EA] bg-[#F5F7FA] p-3">
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#64748B]">Valor</div>
              <div className="mt-2 text-sm font-semibold text-[#071A2D]">{stage.value}</div>
            </div>

            {index < stages.length - 1 && (
              <div className="mt-3 flex justify-end">
                <div className="h-px w-full bg-[#DCE3EA]" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
