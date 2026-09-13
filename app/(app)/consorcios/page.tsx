import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function ConsorciosPage() {
  return (
    <ExecutivePage
      badge="Consórcios"
      title="Consórcios"
      subtitle="Gestão de contratos, parcelas e lances"
      context="Painel executivo para monitorar contratos em curso, vencimentos e dinâmica de lances."
    >
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Contratos ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">12</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Parcelas em aberto</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">96</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Lances ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">7</h2>
      </div>
    </ExecutivePage>
  );
}
