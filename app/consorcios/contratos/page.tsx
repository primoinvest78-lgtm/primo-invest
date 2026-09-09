import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function ContratosPage() {
  return (
    <ExecutivePage
      badge="Consórcios"
      title="Contratos"
      subtitle="Detalhamento de contratos vigentes"
      context="Acompanhamento de contratos por status, valor e relativa maturidade financeira."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-white">12</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Valor total</p>
        <h2 className="mt-3 text-3xl font-bold text-white">R$ 9,2 mi</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Prazo médio</p>
        <h2 className="mt-3 text-3xl font-bold text-white">38 meses</h2>
      </div>
    </ExecutivePage>
  );
}
