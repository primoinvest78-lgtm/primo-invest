import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function LeadsPage() {
  return (
    <ExecutivePage
      badge="Relacionamento"
      title="Leads"
      subtitle="Pipeline de prospecção e qualificação"
      context="Monitoramento dos leads em estágio inicial até chegada à proposta e avaliação comercial."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Em qualificação</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">32</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Conversão</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">22,8%</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Tempo médio</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">12 dias</h2>
      </div>
    </ExecutivePage>
  );
}
