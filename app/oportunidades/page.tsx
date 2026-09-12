import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function OportunidadesPage() {
  return (
    <ExecutivePage
      badge="Relacionamento"
      title="Oportunidades"
      subtitle="Portfólio comercial e projetos em evolução"
      context="Estrutura para acompanhar oportunidades em pipeline, competitividade e probabilidade de fechamento."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Abertas</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">18</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Valor total</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">R$ 7,45 mi</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Taxa de conversão</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">31%</h2>
      </div>
    </ExecutivePage>
  );
}
