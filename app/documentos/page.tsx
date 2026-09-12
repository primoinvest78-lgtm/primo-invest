import { ExecutivePage } from "@/components/dashboard/executive-page";

export default function DocumentosPage() {
  return (
    <ExecutivePage
      badge="Documentos"
      title="Documentos"
      subtitle="Controle documental institucional"
      context="Acompanhamento de documentos, cofre digital e fluxo de assinaturas e validações."
    >
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Total</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">428</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Pendentes</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">3</h2>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-label font-bold uppercase text-muted-foreground">Assinaturas</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">14</h2>
      </div>
    </ExecutivePage>
  );
}
