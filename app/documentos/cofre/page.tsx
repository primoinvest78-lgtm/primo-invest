import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function CofrePage() {
  return (
    <ExecutivePage
      badge="Documentos"
      title="Cofre digital"
      subtitle="Arquivos sensíveis e ativos documentais"
      context="Estrutura para o armazenamento e controle de documentos confidenciais e registros patrimoniais."
    >
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Itens</p>
        <h2 className="mt-3 text-3xl font-bold text-white">1.248</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Criptografados</p>
        <h2 className="mt-3 text-3xl font-bold text-white">100%</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#122b43] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">Última revisão</p>
        <h2 className="mt-3 text-3xl font-bold text-white">Hoje</h2>
      </div>
    </ExecutivePage>
  );
}
