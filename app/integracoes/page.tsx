import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function IntegracoesPage() {
  return (
    <ExecutivePage
      badge="Integrações"
      title="Integrações"
      subtitle="Sistemas, canais e dados conectados"
      context="Estrutura para monitorar conectividade, sincronização e integrações de parceiros e plataformas."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Conectadas</p>
        <h2 className="mt-3 text-3xl font-bold text-white">8</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Sincronizadas</p>
        <h2 className="mt-3 text-3xl font-bold text-white">99,2%</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Status</p>
        <h2 className="mt-3 text-3xl font-bold text-white">Estável</h2>
      </div>
    </ExecutivePage>
  );
}
