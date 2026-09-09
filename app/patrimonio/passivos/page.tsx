import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function PassivosPage() {
  return (
    <ExecutivePage
      badge="Patrimônio"
      title="Passivos"
      subtitle="Estrutura de endividamento e compromissos"
      context="Visão estruturada dos passivos, vencimentos e impacto financeiro sobre o patrimônio."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Passivo total</p>
        <h2 className="mt-3 text-3xl font-bold text-white">R$ 6,1 mi</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Vencimentos</p>
        <h2 className="mt-3 text-3xl font-bold text-white">14</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Cobertura</p>
        <h2 className="mt-3 text-3xl font-bold text-white">2,8x</h2>
      </div>
    </ExecutivePage>
  );
}
