import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function LancesPage() {
  return (
    <ExecutivePage
      badge="Consórcios"
      title="Lances"
      subtitle="Gestão de lances e competitividade"
      context="Acompanhamento dos lances em disputa e evolução do processo de aquisição."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Lances ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-white">7</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Maior lance</p>
        <h2 className="mt-3 text-3xl font-bold text-white">R$ 1,4 mi</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Estratégia</p>
        <h2 className="mt-3 text-3xl font-bold text-white">Agresiva</h2>
      </div>
    </ExecutivePage>
  );
}
