import { GeneratorView } from "@/components/reports/generator/generator-view";
import { BackLink } from "@/components/ui/back-link";
import { getReportFilterOptions, listReportTemplates } from "@/lib/data/reports";
import { stateFromParams } from "@/lib/reports/generator-state";
import { isManagementRole } from "@/lib/reports/permissions";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Gerador de relatórios.
 *
 * Aceita o estado inicial pela querystring — é assim que os atalhos
 * "Gerar relatório" espalhados pelos outros módulos (ficha do cliente,
 * Patrimônio, Consórcios) abrem esta tela já configurada, sem obrigar o
 * usuário a repetir a seleção que ele acabou de fazer lá.
 */
export default async function NovoRelatorioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { organizationId, role } = await requireActiveMembership();

  const [options, templates] = await Promise.all([
    getReportFilterOptions(organizationId),
    listReportTemplates(organizationId),
  ]);

  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const requestedClientId = one("cliente");
  const clientName =
    options.clients.find((c) => c.id === requestedClientId)?.fullName ?? null;

  const initial = stateFromParams(
    {
      tipo: one("tipo"),
      cliente: requestedClientId,
      inicio: one("inicio"),
      fim: one("fim"),
      instituicao: one("instituicao"),
      publico: one("publico"),
    },
    clientName,
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 block-navy-3d rounded-2xl p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Report Center</p>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">
            Novo relatório
          </h1>
          <p className="mt-2 max-w-2xl text-body text-secondary-foreground/75">
            Escolha o tipo, defina o recorte, selecione o conteúdo e confira a prévia antes de gerar.
          </p>
        </div>

        <BackLink href="/relatorios" label="Voltar ao Report Center" />
      </section>

      <GeneratorView
        initial={initial}
        options={options}
        templates={templates}
        canUseInternalTypes={isManagementRole(role)}
      />
    </div>
  );
}
