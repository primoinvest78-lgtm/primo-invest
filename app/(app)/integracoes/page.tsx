import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function IntegracoesPage() {
  return (
    <ExecutivePage
      badge="Integrações"
      title="Integrações"
      subtitle="Sistemas, canais e dados conectados"
      context="Estrutura para monitorar conectividade, sincronização e integrações de parceiros e plataformas."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Conectadas</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">8</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Sincronizadas</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">99,2%</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Status</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">Estável</h2>
      </div>
    </ExecutivePage>
  );
}
