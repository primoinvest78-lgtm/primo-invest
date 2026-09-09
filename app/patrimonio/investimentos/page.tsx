import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function InvestimentosPage() {
  return (
    <ExecutivePage
      badge="Patrimônio"
      title="Investimentos"
      subtitle="Carteira e ativos sob gestão"
      context="Acompanhamento das classes de ativos, concentração e evolução dos investimentos."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Total em gestão</p>
        <h2 className="mt-3 text-3xl font-bold text-white">R$ 41,28 mi</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Renda fixa</p>
        <h2 className="mt-3 text-3xl font-bold text-white">42%</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Ações</p>
        <h2 className="mt-3 text-3xl font-bold text-white">15%</h2>
      </div>
    </ExecutivePage>
  );
}
