import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function OportunidadesPage() {
  return (
    <ExecutivePage
      badge="Relacionamento"
      title="Oportunidades"
      subtitle="Portfólio comercial e projetos em evolução"
      context="Estrutura para acompanhar oportunidades em pipeline, competitividade e probabilidade de fechamento."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Abertas</p>
        <h2 className="mt-3 text-3xl font-bold text-white">18</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Valor total</p>
        <h2 className="mt-3 text-3xl font-bold text-white">R$ 7,45 mi</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Taxa de conversão</p>
        <h2 className="mt-3 text-3xl font-bold text-white">31%</h2>
      </div>
    </ExecutivePage>
  );
}
