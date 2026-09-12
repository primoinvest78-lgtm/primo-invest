import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function CofrePage() {
  return (
    <ExecutivePage
      badge="Documentos"
      title="Cofre digital"
      subtitle="Arquivos sensíveis e ativos documentais"
      context="Estrutura para o armazenamento e controle de documentos confidenciais e registros patrimoniais."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Itens</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">1.248</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Criptografados</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">100%</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Última revisão</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Hoje</h2>
      </div>
    </ExecutivePage>
  );
}
