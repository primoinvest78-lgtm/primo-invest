import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function InteligenciaPage() {
  return (
    <ExecutivePage
      badge="Inteligência"
      title="Inteligência"
      subtitle="Insights e sinais de mercado"
      context="Painel executivo de indicadores, inteligência estratégica e leitura de oportunidades em tempo real."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Sinais ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-white">14</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Indicadores</p>
        <h2 className="mt-3 text-3xl font-bold text-white">92%</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Foco</p>
        <h2 className="mt-3 text-3xl font-bold text-white">Patrimônio</h2>
      </div>
    </ExecutivePage>
  );
}
