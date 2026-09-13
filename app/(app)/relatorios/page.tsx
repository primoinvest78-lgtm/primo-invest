import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function RelatoriosPage() {
  return (
    <ExecutivePage
      badge="Relatórios"
      title="Relatórios"
      subtitle="Performance e apresentação de indicadores"
      context="Painel para consolidar relatórios executivos e comparativos de patrimônio, relacionamento e operação."
    >
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Relatórios ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">24</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Entregues</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">18</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Acompanhamento</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">7 dias</h2>
      </div>
    </ExecutivePage>
  );
}
