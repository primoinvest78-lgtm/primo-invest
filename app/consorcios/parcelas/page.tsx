import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function ParcelasPage() {
  return (
    <ExecutivePage
      badge="Consórcios"
      title="Parcelas"
      subtitle="Fluxo de pagamentos e vencimentos"
      context="Gestão de parcelas ativas, vencimentos e acompanhamento do fluxo de quitação."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Em aberto</p>
        <h2 className="mt-3 text-3xl font-bold text-white">96</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">This month</p>
        <h2 className="mt-3 text-3xl font-bold text-white">R$ 0,8 mi</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Em dia</p>
        <h2 className="mt-3 text-3xl font-bold text-white">91%</h2>
      </div>
    </ExecutivePage>
  );
}
