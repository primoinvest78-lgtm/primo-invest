import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function ContasPage() {
  return (
    <ExecutivePage
      badge="Patrimônio"
      title="Contas"
      subtitle="Estrutura de contas e alocação operacional"
      context="Centralização das contas e contas vinculadas para gestão de patrimônio e fluxo financeiro."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Contas ativas</p>
        <h2 className="mt-3 text-3xl font-bold text-white">67</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Disponibilidade</p>
        <h2 className="mt-3 text-3xl font-bold text-white">R$ 2,8 mi</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Consolidação</p>
        <h2 className="mt-3 text-3xl font-bold text-white">100%</h2>
      </div>
    </ExecutivePage>
  );
}
