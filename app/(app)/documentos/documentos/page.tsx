import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function DocumentosListaPage() {
  return (
    <ExecutivePage
      badge="Documentos"
      title="Documentos"
      subtitle="Fluxo documental e assinaturas"
      context="Gerenciamento de documentos por cliente, operação, contrato e gestão patrimonial."
      backHref="/documentos"
      backLabel="Voltar a Documentos"
    >
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Aguardando assinatura</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">3</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Vencimentos</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">8</h2>
      </div>
      <div className="card-premium rounded-2xl p-4">
        <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Validados</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">94%</h2>
      </div>
    </ExecutivePage>
  );
}
