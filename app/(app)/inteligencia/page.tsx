import { IntelligenceView } from "@/components/intelligence/intelligence-view";
import { getIntelligenceData } from "@/lib/data/intelligence";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Central de Inteligência — todo insight aqui é a leitura de um fato
 * real que já existe em outro módulo (tarefa, meta, passivo, parcela,
 * documento, patrimônio, lead, oportunidade, cliente, integração),
 * nunca um dado inventado. Regra determinística, sempre identificada
 * como tal — sem IA real conectada, nada aqui é chamado de "IA
 * detectou".
 */
export default async function InteligenciaPage() {
  const { organizationId } = await requireActiveMembership();
  const { insights, counts } = await getIntelligenceData(organizationId);

  return (
    <div className="space-y-6">
      <Header />

      <IntelligenceView insights={insights} counts={counts} />
    </div>
  );
}

function Header() {
  return (
    <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
      <div className="min-w-0">
        <p className="text-label font-bold uppercase text-primary">Inteligência</p>
        <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
          Central de Inteligência
        </h1>
        <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
          Insights, alertas, oportunidades e pendências derivados dos dados reais da plataforma — cada um
          com origem, motivo e dado usado sempre visíveis.
        </p>
      </div>
    </section>
  );
}
