import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function ConsorciosPage() {
  return (
    <ExecutivePage
      badge="Consórcios"
      title="Consórcios"
      subtitle="Gestão de contratos, parcelas e lances"
      context="Painel executivo para monitorar contratos em curso, vencimentos e dinâmica de lances."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Contratos ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">12</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Parcelas em aberto</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">96</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Lances ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">7</h2>
      </div>
    </ExecutivePage>
  );
}
