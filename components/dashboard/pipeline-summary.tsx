import type { PipelineStage } from "@/lib/mock/dashboard";

export function PipelineSummary({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B2238] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">Comercial</p>
        <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-white">Pipeline comercial</h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {stages.map((stage, index) => (
          <div key={stage.name} className="min-w-[120px] flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${stage.tone}`} />
              <span className="text-[11px] text-white/70">{stage.name}</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#122b43] p-3">
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/55">Valor</div>
              <div className="mt-2 text-sm font-semibold text-white">{stage.value}</div>
            </div>

            {index < stages.length - 1 && (
              <div className="mt-3 flex justify-end">
                <div className="h-px w-full bg-white/10" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
