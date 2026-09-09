import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function PatrimonioPage() {
  return (
    <ExecutivePage
      badge="Patrimônio"
      title="Visão geral"
      subtitle="Estrutura patrimonial consolidada"
      context="Visão executiva do patrimônio, composição e evolução do portfólio sob gestão."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Ativo total</p>
        <h2 className="mt-3 text-3xl font-bold text-white">R$ 48,75 mi</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Liquidez</p>
        <h2 className="mt-3 text-3xl font-bold text-white">18%</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Rendimento</p>
        <h2 className="mt-3 text-3xl font-bold text-white">+8,42%</h2>
      </div>
    </ExecutivePage>
  );
}
