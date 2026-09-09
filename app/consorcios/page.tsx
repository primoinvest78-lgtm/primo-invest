import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function ConsorciosPage() {
  return (
    <ExecutivePage
      badge="Consórcios"
      title="Consórcios"
      subtitle="Gestão de contratos, parcelas e lances"
      context="Painel executivo para monitorar contratos em curso, vencimentos e dinâmica de lances."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Contratos ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-white">12</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Parcelas em aberto</p>
        <h2 className="mt-3 text-3xl font-bold text-white">96</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Lances ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-white">7</h2>
      </div>
    </ExecutivePage>
  );
}
