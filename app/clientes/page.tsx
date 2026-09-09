import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function ClientesPage() {
  return (
    <ExecutivePage
      badge="Relacionamento"
      title="Clientes"
      subtitle="Base de relacionamento e carteira ativa"
      context="Painel estruturado para acompanhar clientes, segmentação e continuidade do relacionamento institucional."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Clientes ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-white">184</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Retenção</p>
        <h2 className="mt-3 text-3xl font-bold text-white">96,4%</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Atendimento</p>
        <h2 className="mt-3 text-3xl font-bold text-white">7 reuniões</h2>
      </div>
    </ExecutivePage>
  );
}
