import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function ClientesPage() {
  return (
    <ExecutivePage
      badge="Relacionamento"
      title="Clientes"
      subtitle="Base de relacionamento e carteira ativa"
      context="Painel estruturado para acompanhar clientes, segmentação e continuidade do relacionamento institucional."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Clientes ativos</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">184</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Retenção</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">96,4%</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Atendimento</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">7 reuniões</h2>
      </div>
    </ExecutivePage>
  );
}
