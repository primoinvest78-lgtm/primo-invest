/**
 * Montagem do conteúdo de um relatório.
 *
 * REGRA ABSOLUTA DO MÓDULO: o relatório é montado a partir das MESMAS
 * funções de `lib/data/*` que alimentam as telas da plataforma. Nada
 * aqui consulta o banco por conta própria e nada aqui recalcula um
 * indicador que já existe — se Patrimônio mostra R$ X na tela, o
 * relatório mostra R$ X, porque os dois leem `getWealthOverview()`.
 * Recorte (cliente / período / instituição) é filtragem sobre o mesmo
 * conjunto, nunca uma query paralela com outra regra.
 *
 * Quando um dado não existe, a seção entra com `note` explicando —
 * nunca com número inventado, nunca com zero disfarçado de valor.
 */

import { listClients, getClientProfile, getClientWealthHistory } from "@/lib/data/clients";
import {
  getConsortiumBids,
  getConsortiumContracts,
  getConsortiumInstallments,
} from "@/lib/data/consortiums";
import { listLeads } from "@/lib/data/leads";
import { listOpportunitiesByStage } from "@/lib/data/opportunities";
import { listTasks } from "@/lib/data/tasks";
import {
  getGoalsDetail,
  getInvestmentsDetail,
  getLiabilitiesDetail,
  getWealthHistory,
  getWealthOverview,
  type HoldingDetail,
  type WealthOverview,
} from "@/lib/data/wealth";
import { buildPeriodLabel, filterMonthly, formatDateOnly, withinPeriod } from "@/lib/reports/period";
import {
  INTERNAL_ONLY_SECTIONS,
  REPORT_TYPE_SECTIONS,
  type ReportAudience,
  type ReportChart,
  type ReportChartFormat,
  type ReportPayload,
  type ReportSection,
  type ReportSource,
  type ReportTable,
  type ReportType,
} from "@/lib/reports/types";
import { bidResultLabel } from "@/lib/utils/bid-helpers";
import { contractStatusLabel } from "@/lib/utils/consortium-helpers";
import { installmentStatusLabel, isEffectivelyOverdue } from "@/lib/utils/installment-helpers";
import { CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL, isTaskOpen } from "@/lib/utils/task-helpers";
import { formatCurrencyBRL, formatDate, formatMonthLabel } from "@/lib/utils/format";
import { isLiquidAccountType } from "@/lib/utils/wealth-helpers";

export type BuildReportInput = {
  type: ReportType;
  title: string;
  audience: ReportAudience;
  clientId: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  institution: string | null;
  sections: string[];
};

const EMPTY_NOTE = "Não disponível — sem registros para o recorte selecionado.";

/** Seção vazia continua no documento, declarada como vazia. Omitir em
 * silêncio faria o leitor supor que o dado não foi consultado. */
function emptySection(id: string, title: string, note = EMPTY_NOTE): ReportSection {
  return { id, title, note };
}

function pct(part: number, whole: number): string {
  if (!whole) return "—";
  return `${((part / whole) * 100).toFixed(1).replace(".", ",")}%`;
}

function topN<T>(items: T[], n: number): T[] {
  return items.slice(0, n);
}

/**
 * Rotas de origem — o relatório aponta de volta pro registro que gerou
 * cada número. Centralizado aqui pra que uma mudança de rota num módulo
 * quebre em um lugar só, não espalhada por seis builders.
 */
export const MODULE_ROUTES = {
  clientes: "/clientes",
  cliente: (id: string) => `/clientes/${id}`,
  patrimonio: "/patrimonio",
  contas: "/patrimonio/contas",
  conta: (id: string) => `/patrimonio/contas/${id}`,
  investimentos: "/patrimonio/investimentos",
  passivos: "/patrimonio/passivos",
  passivo: (id: string) => `/patrimonio/passivos/${id}`,
  metas: "/patrimonio/metas",
  meta: (id: string) => `/patrimonio/metas/${id}`,
  contratos: "/consorcios/contratos",
  contrato: (id: string) => `/consorcios/contratos/${id}`,
  parcelas: "/consorcios/parcelas",
  lances: "/consorcios/lances",
  tarefas: "/tarefas",
  leads: "/leads",
  oportunidades: "/oportunidades",
  oportunidade: (id: string) => `/oportunidades/${id}`,
} as const;

function source(label: string, href: string): ReportSource {
  return { label, href };
}

/**
 * Tabela com corte explícito — o leitor sempre sabe que há mais linhas.
 * `links` acompanha `rows` posição a posição e sobrevive ao corte.
 */
function table(
  id: string,
  title: string,
  columns: string[],
  rows: (string | number)[][],
  limit = 25,
  links?: (string | null)[],
): ReportTable {
  const shown = rows.slice(0, limit);
  return {
    id,
    title,
    columns,
    rows: shown,
    links: links ? links.slice(0, limit) : undefined,
    note: rows.length > limit ? `Exibindo ${shown.length} de ${rows.length} registros.` : undefined,
  };
}

/**
 * Versão que constrói linhas e links a partir da MESMA lista ordenada —
 * garante que o link da linha N aponte para o registro da linha N.
 * Montar `rows` e `links` em dois `.map()` separados convidaria a um
 * desalinhamento silencioso.
 */
function tableFrom<T>(
  id: string,
  title: string,
  columns: string[],
  items: T[],
  toRow: (item: T) => (string | number)[],
  toLink?: (item: T) => string | null,
  limit = 25,
): ReportTable {
  return table(
    id,
    title,
    columns,
    items.map(toRow),
    limit,
    toLink ? items.map(toLink) : undefined,
  );
}

function donut(
  id: string,
  title: string,
  entries: [string, number][],
  format: ReportChartFormat = "currency",
): ReportChart {
  return {
    id,
    kind: "donut",
    title,
    format,
    data: entries
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value })),
  };
}

function ranking(
  id: string,
  title: string,
  entries: [string, number][],
  limit = 8,
  format: ReportChartFormat = "currency",
): ReportChart {
  return {
    id,
    kind: "bar-horizontal",
    title,
    format,
    data: entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([label, value]) => ({ label, value })),
  };
}

function counted(entries: Map<string, number>): [string, number][] {
  return Array.from(entries.entries());
}

function bump(map: Map<string, number>, key: string, value = 1) {
  map.set(key, (map.get(key) ?? 0) + value);
}

/* ────────────────────────────────────────────────────────────────
 * Recortes
 * ──────────────────────────────────────────────────────────────── */

/**
 * Aplica o recorte de cliente sobre o retorno de `getWealthOverview()`
 * — filtra as coleções e RECALCULA os totais a partir das mesmas
 * parcelas que a função original somou, para que o total do relatório
 * de um cliente seja exatamente a fatia dele do total da plataforma.
 */
function scopeOverview(
  overview: WealthOverview,
  clientId: string | null,
  /** Crédito ativo em consórcio do cliente — mesma parcela que
   * `listClients()` soma no patrimônio líquido da lista de clientes,
   * para que os dois números batam. */
  consortiumTotal = 0,
): WealthOverview {
  if (!clientId) return overview;

  const accounts = overview.accounts.filter((a) => a.clientId === clientId);
  const liabilities = overview.liabilities.filter((l) => l.clientId === clientId);
  const goals = overview.goals.filter((g) => g.clientId === clientId);

  const investmentsTotal = accounts.reduce((sum, a) => sum + a.balance, 0);
  const liquidTotal = accounts
    .filter((a) => isLiquidAccountType(a.accountType))
    .reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.outstandingAmount ?? 0), 0);
  const totalAssets = investmentsTotal + consortiumTotal;

  return {
    ...overview,
    accounts,
    liabilities,
    goals,
    investmentsTotal,
    liquidTotal,
    consortiumTotal,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    topClients: overview.topClients.filter((c) => c.id === clientId),
  };
}

function scopeHoldings(
  holdings: HoldingDetail[],
  clientId: string | null,
  institution: string | null,
): HoldingDetail[] {
  return holdings
    .filter((h) => h.accountStatus === "active")
    .filter((h) => (clientId ? h.clientId === clientId : true))
    .filter((h) => (institution ? h.institutionName === institution : true));
}

/* ────────────────────────────────────────────────────────────────
 * Builders por tipo
 * ──────────────────────────────────────────────────────────────── */

async function buildPatrimonial(
  organizationId: string,
  input: BuildReportInput,
  wanted: Set<string>,
): Promise<ReportSection[]> {
  const [rawOverview, rawHistory, liabilities, contracts] = await Promise.all([
    getWealthOverview(organizationId),
    input.clientId
      ? getClientWealthHistory(organizationId, input.clientId)
      : getWealthHistory(organizationId),
    getLiabilitiesDetail(organizationId),
    getConsortiumContracts(organizationId),
  ]);

  const clientConsortiumTotal = input.clientId
    ? contracts
        .filter((c) => c.clientId === input.clientId && c.status === "active")
        .reduce((sum, c) => sum + Number(c.creditAmount ?? 0), 0)
    : 0;
  const overview = scopeOverview(rawOverview, input.clientId, clientConsortiumTotal);
  const history = filterMonthly(rawHistory, input.periodStart, input.periodEnd);
  const scopedLiabilities = liabilities
    .filter((l) => l.status === "active")
    .filter((l) => (input.clientId ? l.clientId === input.clientId : true));

  const sections: ReportSection[] = [];

  if (wanted.has("kpis")) {
    sections.push({
      id: "kpis",
      title: "Indicadores gerais",
      source: source("Patrimônio", MODULE_ROUTES.patrimonio),
      kpis: [
        { label: "Patrimônio líquido", value: formatCurrencyBRL(overview.netWorth) },
        { label: "Ativos totais", value: formatCurrencyBRL(overview.totalAssets) },
        { label: "Passivos totais", value: formatCurrencyBRL(overview.totalLiabilities) },
        {
          label: "Investimentos",
          value: formatCurrencyBRL(overview.investmentsTotal),
          sub: `${pct(overview.investmentsTotal, overview.totalAssets)} dos ativos`,
        },
        { label: "Liquidez imediata", value: formatCurrencyBRL(overview.liquidTotal) },
        {
          label: "Posição consolidada em",
          value: overview.lastUpdatedAt ? formatDate(overview.lastUpdatedAt) : "—",
        },
      ],
    });
  }

  if (wanted.has("evolucao")) {
    sections.push(
      history.length >= 2
        ? {
            id: "evolucao",
            title: "Evolução patrimonial",
            source: source("Patrimônio", MODULE_ROUTES.patrimonio),
            charts: [
              {
                id: "evolucao-linha",
                kind: "line",
                title: "Patrimônio acumulado por mês",
                format: "currency",
                data: history.map((p) => ({ label: formatMonthLabel(p.month), value: p.value })),
              },
            ],
            note: "Série derivada das movimentações registradas nas contas — meses sem movimentação não aparecem.",
          }
        : emptySection(
            "evolucao",
            "Evolução patrimonial",
            "Não disponível — são necessários pelo menos dois meses com movimentação registrada para montar a série.",
          ),
    );
  }

  if (wanted.has("alocacao")) {
    const allocation = overview.allocation.filter((a) => a.value > 0);
    sections.push(
      allocation.length > 0
        ? {
            id: "alocacao",
            title: "Alocação de ativos",
            source: source("Patrimônio", MODULE_ROUTES.patrimonio),
            charts: [
              donut(
                "alocacao-donut",
                "Composição por tipo de ativo",
                allocation.map((a) => [a.productType, a.value] as [string, number]),
              ),
            ],
            tables: [
              table(
                "alocacao-tabela",
                "Detalhamento da alocação",
                ["Tipo de ativo", "Valor", "Participação"],
                allocation
                  .sort((a, b) => b.value - a.value)
                  .map((a) => [
                    a.productType,
                    formatCurrencyBRL(a.value),
                    pct(a.value, overview.totalAssets),
                  ]),
              ),
            ],
            note: input.clientId
              ? "Composição consolidada da organização — o recorte por cliente não se aplica à alocação agregada."
              : undefined,
          }
        : emptySection("alocacao", "Alocação de ativos"),
    );
  }

  if (wanted.has("contas")) {
    sections.push(
      overview.accounts.length > 0
        ? {
            id: "contas",
            title: "Contas",
            source: source("Patrimônio › Contas", MODULE_ROUTES.contas),
            tables: [
              tableFrom(
                "contas-tabela",
                "Contas ativas",
                ["Conta", "Instituição", "Tipo", "Titular", "Saldo"],
                [...overview.accounts].sort((a, b) => b.balance - a.balance),
                (a) => [
                  a.accountName ?? "—",
                  a.institutionName ?? "—",
                  a.accountType,
                  a.clientName ?? "—",
                  formatCurrencyBRL(a.balance),
                ],
                (a) => MODULE_ROUTES.conta(a.id),
              ),
            ],
          }
        : emptySection("contas", "Contas"),
    );
  }

  if (wanted.has("passivos")) {
    sections.push(
      scopedLiabilities.length > 0
        ? {
            id: "passivos",
            title: "Passivos",
            kpis: [
              {
                label: "Total em aberto",
                value: formatCurrencyBRL(
                  scopedLiabilities.reduce((s, l) => s + Number(l.outstandingAmount ?? 0), 0),
                ),
              },
              { label: "Contratos ativos", value: String(scopedLiabilities.length) },
            ],
            source: source("Patrimônio › Passivos", MODULE_ROUTES.passivos),
            tables: [
              tableFrom(
                "passivos-tabela",
                "Passivos em aberto",
                ["Passivo", "Tipo", "Titular", "Saldo devedor", "Vencimento"],
                [...scopedLiabilities].sort(
                  (a, b) => Number(b.outstandingAmount ?? 0) - Number(a.outstandingAmount ?? 0),
                ),
                (l) => [
                  l.name,
                  l.liabilityType ?? "—",
                  l.clientName ?? "—",
                  formatCurrencyBRL(l.outstandingAmount),
                  l.maturityDate ? formatDateOnly(l.maturityDate) : "—",
                ],
                (l) => MODULE_ROUTES.passivo(l.id),
              ),
            ],
          }
        : emptySection("passivos", "Passivos"),
    );
  }

  return sections;
}

async function buildInvestimentos(
  organizationId: string,
  input: BuildReportInput,
  wanted: Set<string>,
): Promise<ReportSection[]> {
  const holdings = scopeHoldings(
    await getInvestmentsDetail(organizationId),
    input.clientId,
    input.institution,
  );

  const total = holdings.reduce((s, h) => s + Number(h.valuation ?? 0), 0);
  const sections: ReportSection[] = [];

  if (wanted.has("kpis")) {
    const institutions = new Set(holdings.map((h) => h.institutionName).filter(Boolean));
    const products = new Set(holdings.map((h) => h.productType).filter(Boolean));
    const biggest = [...holdings].sort(
      (a, b) => Number(b.valuation ?? 0) - Number(a.valuation ?? 0),
    )[0];

    sections.push({
      id: "kpis",
      title: "Indicadores gerais",
      source: source("Patrimônio › Investimentos", MODULE_ROUTES.investimentos),
      kpis: [
        { label: "Valor investido", value: formatCurrencyBRL(total) },
        { label: "Posições", value: String(holdings.length) },
        { label: "Instituições", value: String(institutions.size) },
        { label: "Tipos de produto", value: String(products.size) },
        {
          label: "Maior posição",
          value: biggest ? formatCurrencyBRL(biggest.valuation) : "—",
          sub: biggest ? `${biggest.productName ?? "—"} · ${pct(Number(biggest.valuation ?? 0), total)} da carteira` : null,
        },
      ],
    });
  }

  if (wanted.has("alocacao")) {
    const byType = new Map<string, number>();
    for (const h of holdings) bump(byType, h.productType ?? "Sem classificação", Number(h.valuation ?? 0));

    sections.push(
      byType.size > 0
        ? {
            id: "alocacao",
            title: "Alocação por tipo de produto",
            source: source("Patrimônio › Investimentos", MODULE_ROUTES.investimentos),
            charts: [donut("alocacao-donut", "Composição da carteira", counted(byType))],
            tables: [
              table(
                "alocacao-tabela",
                "Participação por tipo de produto",
                ["Tipo de produto", "Valor", "Participação"],
                counted(byType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, value]) => [label, formatCurrencyBRL(value), pct(value, total)]),
              ),
            ],
          }
        : emptySection("alocacao", "Alocação por tipo de produto"),
    );
  }

  if (wanted.has("ranking")) {
    const byInstitution = new Map<string, number>();
    for (const h of holdings) {
      bump(byInstitution, h.institutionName ?? "Sem instituição", Number(h.valuation ?? 0));
    }

    sections.push(
      byInstitution.size > 0
        ? {
            id: "ranking",
            title: "Ranking por instituição",
            source: source("Patrimônio › Investimentos", MODULE_ROUTES.investimentos),
            charts: [ranking("ranking-barras", "Valor custodiado por instituição", counted(byInstitution))],
            note:
              byInstitution.size === 1
                ? "Concentração total em uma única instituição."
                : `Maior concentração: ${pct(Math.max(...byInstitution.values()), total)} da carteira.`,
          }
        : emptySection("ranking", "Ranking por instituição"),
    );
  }

  if (wanted.has("posicoes")) {
    sections.push(
      holdings.length > 0
        ? {
            id: "posicoes",
            title: "Posições",
            source: source("Patrimônio › Investimentos", MODULE_ROUTES.investimentos),
            tables: [
              tableFrom(
                "posicoes-tabela",
                "Carteira detalhada",
                ["Produto", "Tipo", "Instituição", "Titular", "Valor", "Participação"],
                [...holdings].sort((a, b) => Number(b.valuation ?? 0) - Number(a.valuation ?? 0)),
                (h) => [
                  h.productName ?? "—",
                  h.productType ?? "—",
                  h.institutionName ?? "—",
                  h.clientName ?? "—",
                  formatCurrencyBRL(h.valuation),
                  pct(Number(h.valuation ?? 0), total),
                ],
                (h) => (h.accountId ? MODULE_ROUTES.conta(h.accountId) : null),
                30,
              ),
            ],
          }
        : emptySection("posicoes", "Posições"),
    );
  }

  if (wanted.has("movimentacoes")) {
    const movements = holdings
      .flatMap((h) =>
        h.movements.map((m) => ({
          ...m,
          productName: h.productName,
          clientName: h.clientName,
          institutionName: h.institutionName,
        })),
      )
      .filter((m) =>
        input.periodStart || input.periodEnd
          ? withinPeriod(m.transactionDate, input.periodStart, input.periodEnd)
          : true,
      )
      .sort((a, b) => (a.transactionDate < b.transactionDate ? 1 : -1));

    const byMonth = new Map<string, number>();
    for (const m of movements) bump(byMonth, m.transactionDate.slice(0, 7), Number(m.amount ?? 0));

    sections.push(
      movements.length > 0
        ? {
            id: "movimentacoes",
            title: "Movimentações",
            kpis: [
              { label: "Movimentações no período", value: String(movements.length) },
              {
                label: "Volume movimentado",
                value: formatCurrencyBRL(movements.reduce((s, m) => s + Math.abs(Number(m.amount ?? 0)), 0)),
              },
            ],
            charts:
              byMonth.size >= 2
                ? [
                    {
                      id: "movimentacoes-barras",
                      kind: "bar",
                      title: "Volume movimentado por mês",
                      format: "currency",
                      data: Array.from(byMonth.entries())
                        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
                        .map(([month, value]) => ({ label: formatMonthLabel(month), value })),
                    },
                  ]
                : undefined,
            source: source("Patrimônio › Investimentos", MODULE_ROUTES.investimentos),
            tables: [
              table(
                "movimentacoes-tabela",
                "Movimentações do período",
                ["Data", "Produto", "Operação", "Titular", "Valor"],
                movements.map((m) => [
                  formatDateOnly(m.transactionDate),
                  m.productName ?? "—",
                  m.transactionType,
                  m.clientName ?? "—",
                  formatCurrencyBRL(m.amount),
                ]),
                30,
              ),
            ],
          }
        : emptySection("movimentacoes", "Movimentações"),
    );
  }

  return sections;
}

async function buildCliente(
  organizationId: string,
  input: BuildReportInput,
  wanted: Set<string>,
): Promise<ReportSection[]> {
  if (!input.clientId) {
    return [
      emptySection(
        "cliente",
        "Cliente",
        "Não disponível — este tipo de relatório exige um cliente selecionado.",
      ),
    ];
  }

  const clientId = input.clientId;
  const [profile, history, rawOverview, goals, holdings, contracts, stages] = await Promise.all([
    getClientProfile(organizationId, clientId),
    getClientWealthHistory(organizationId, clientId),
    getWealthOverview(organizationId),
    getGoalsDetail(organizationId),
    getInvestmentsDetail(organizationId),
    getConsortiumContracts(organizationId),
    listOpportunitiesByStage(organizationId),
  ]);

  if (!profile) {
    return [
      emptySection("cliente", "Cliente", "Não disponível — cliente não encontrado nesta organização."),
    ];
  }

  const clientContracts = contracts.filter((c) => c.clientId === clientId);
  const consortiumCredit = clientContracts
    .filter((c) => c.status === "active")
    .reduce((s, c) => s + Number(c.creditAmount ?? 0), 0);

  const overview = scopeOverview(rawOverview, clientId, consortiumCredit);
  const clientHoldings = scopeHoldings(holdings, clientId, input.institution);
  const clientGoals = goals.filter((g) => g.clientId === clientId);
  // Saldo das contas do cliente — mesma parcela usada no patrimônio da
  // lista de clientes e do módulo Patrimônio.
  const investedTotal = overview.investmentsTotal;
  const totalAssets = overview.totalAssets;
  const netWorth = overview.netWorth;

  const sections: ReportSection[] = [];

  if (wanted.has("kpis")) {
    sections.push({
      id: "kpis",
      title: "Indicadores gerais",
      source: source("Ficha do cliente", MODULE_ROUTES.cliente(clientId)),
      kpis: [
        { label: "Patrimônio líquido", value: formatCurrencyBRL(netWorth) },
        { label: "Investimentos", value: formatCurrencyBRL(investedTotal) },
        { label: "Crédito em consórcio", value: formatCurrencyBRL(consortiumCredit) },
        { label: "Passivos", value: formatCurrencyBRL(overview.totalLiabilities) },
        { label: "Contas", value: String(overview.accounts.length) },
        { label: "Metas ativas", value: String(clientGoals.length) },
      ],
    });
  }

  if (wanted.has("evolucao")) {
    const scoped = filterMonthly(history, input.periodStart, input.periodEnd);
    sections.push(
      scoped.length >= 2
        ? {
            id: "evolucao",
            title: "Evolução patrimonial",
            source: source("Patrimônio", MODULE_ROUTES.patrimonio),
            charts: [
              {
                id: "evolucao-linha",
                kind: "line",
                title: "Patrimônio acumulado por mês",
                format: "currency",
                data: scoped.map((p) => ({ label: formatMonthLabel(p.month), value: p.value })),
              },
            ],
          }
        : emptySection(
            "evolucao",
            "Evolução patrimonial",
            "Não disponível — são necessários pelo menos dois meses com movimentação registrada.",
          ),
    );
  }

  if (wanted.has("alocacao")) {
    const byType = new Map<string, number>();
    for (const h of clientHoldings) bump(byType, h.productType ?? "Sem classificação", Number(h.valuation ?? 0));
    if (consortiumCredit > 0) bump(byType, "Consórcio", consortiumCredit);

    sections.push(
      byType.size > 0
        ? {
            id: "alocacao",
            title: "Alocação de ativos",
            source: source("Patrimônio", MODULE_ROUTES.patrimonio),
            charts: [donut("alocacao-donut", "Composição do patrimônio", counted(byType))],
            tables: [
              table(
                "alocacao-tabela",
                "Participação por tipo de ativo",
                ["Tipo de ativo", "Valor", "Participação"],
                counted(byType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, value]) => [label, formatCurrencyBRL(value), pct(value, totalAssets)]),
              ),
            ],
          }
        : emptySection("alocacao", "Alocação de ativos"),
    );
  }

  if (wanted.has("contas")) {
    sections.push(
      overview.accounts.length > 0
        ? {
            id: "contas",
            title: "Contas",
            source: source("Patrimônio › Contas", MODULE_ROUTES.contas),
            tables: [
              tableFrom(
                "contas-tabela",
                "Contas do cliente",
                ["Conta", "Instituição", "Tipo", "Saldo"],
                [...overview.accounts].sort((a, b) => b.balance - a.balance),
                (a) => [
                  a.accountName ?? "—",
                  a.institutionName ?? "—",
                  a.accountType,
                  formatCurrencyBRL(a.balance),
                ],
                (a) => MODULE_ROUTES.conta(a.id),
              ),
            ],
          }
        : emptySection("contas", "Contas"),
    );
  }

  if (wanted.has("metas")) {
    sections.push(
      clientGoals.length > 0
        ? {
            id: "metas",
            title: "Metas",
            charts: [
              ranking(
                "metas-barras",
                "Progresso das metas (%)",
                clientGoals.map((g) => [
                  g.name,
                  g.targetAmount ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
                ]),
                8,
                "percent",
              ),
            ],
            source: source("Patrimônio › Metas", MODULE_ROUTES.metas),
            tables: [
              tableFrom(
                "metas-tabela",
                "Metas em acompanhamento",
                ["Meta", "Objetivo", "Acumulado", "Progresso", "Prazo"],
                clientGoals,
                (g) => [
                  g.name,
                  formatCurrencyBRL(g.targetAmount),
                  formatCurrencyBRL(g.currentAmount),
                  g.targetAmount ? pct(g.currentAmount, g.targetAmount) : "—",
                  g.targetDate ? formatDateOnly(g.targetDate) : "—",
                ],
                (g) => MODULE_ROUTES.meta(g.id),
              ),
            ],
          }
        : emptySection("metas", "Metas"),
    );
  }

  if (wanted.has("consorcios")) {
    sections.push(
      clientContracts.length > 0
        ? {
            id: "consorcios",
            title: "Consórcios",
            source: source("Consórcios › Contratos", MODULE_ROUTES.contratos),
            tables: [
              tableFrom(
                "consorcios-tabela",
                "Contratos do cliente",
                ["Administradora", "Contrato", "Crédito", "Parcelas pagas", "Situação"],
                clientContracts,
                (c) => [
                  c.administratorName ?? "—",
                  c.contractNumber ?? "—",
                  formatCurrencyBRL(c.creditAmount),
                  `${c.paidInstallments} de ${c.totalInstallments}`,
                  contractStatusLabel(c.status),
                ],
                (c) => MODULE_ROUTES.contrato(c.id),
              ),
            ],
          }
        : emptySection("consorcios", "Consórcios"),
    );
  }

  if (wanted.has("passivos")) {
    sections.push(
      overview.liabilities.length > 0
        ? {
            id: "passivos",
            title: "Passivos",
            source: source("Patrimônio › Passivos", MODULE_ROUTES.passivos),
            tables: [
              tableFrom(
                "passivos-tabela",
                "Passivos em aberto",
                ["Passivo", "Tipo", "Saldo devedor", "Vencimento"],
                overview.liabilities,
                (l) => [
                  l.name,
                  l.liabilityType ?? "—",
                  formatCurrencyBRL(l.outstandingAmount),
                  l.maturityDate ? formatDateOnly(l.maturityDate) : "—",
                ],
                (l) => MODULE_ROUTES.passivo(l.id),
              ),
            ],
          }
        : emptySection("passivos", "Passivos"),
    );
  }

  if (wanted.has("oportunidades")) {
    const open = stages
      .flatMap((s) => s.opportunities.map((o) => ({ ...o, stageName: s.name })))
      .filter((o) => o.clientId === clientId && o.status === "open");

    sections.push(
      open.length > 0
        ? {
            id: "oportunidades",
            title: "Oportunidades",
            source: source("Oportunidades", MODULE_ROUTES.oportunidades),
            tables: [
              tableFrom(
                "oportunidades-tabela",
                "Oportunidades em aberto",
                ["Oportunidade", "Etapa", "Valor estimado", "Previsão"],
                open,
                (o) => [
                  o.title,
                  o.stageName,
                  formatCurrencyBRL(o.estimatedValue),
                  o.expectedCloseDate ? formatDateOnly(o.expectedCloseDate) : "—",
                ],
                (o) => MODULE_ROUTES.oportunidade(o.id),
              ),
            ],
          }
        : emptySection("oportunidades", "Oportunidades"),
    );
  }

  if (wanted.has("perfil")) {
    const latest = [...(profile.client_risk_profiles ?? [])].sort((a, b) =>
      a.valid_from < b.valid_from ? 1 : -1,
    )[0];

    sections.push(
      latest
        ? {
            id: "perfil",
            title: "Perfil de risco",
            source: source("Ficha do cliente", MODULE_ROUTES.cliente(clientId)),
            kpis: [
              { label: "Tolerância a risco", value: latest.risk_tolerance },
              { label: "Objetivo", value: latest.investment_objective },
              { label: "Horizonte", value: latest.investment_horizon },
              { label: "Vigente desde", value: formatDateOnly(latest.valid_from) },
              {
                label: "Validade",
                value: latest.valid_until ? formatDateOnly(latest.valid_until) : "Sem prazo definido",
              },
            ],
          }
        : emptySection(
            "perfil",
            "Perfil de risco",
            "Não disponível — o cliente ainda não possui perfil de investidor registrado.",
          ),
    );
  }

  return sections;
}

async function buildConsorcios(
  organizationId: string,
  input: BuildReportInput,
  wanted: Set<string>,
): Promise<ReportSection[]> {
  const [allContracts, allInstallments, allBids] = await Promise.all([
    getConsortiumContracts(organizationId),
    getConsortiumInstallments(organizationId),
    getConsortiumBids(organizationId),
  ]);

  const contracts = allContracts.filter((c) => (input.clientId ? c.clientId === input.clientId : true));
  const contractIds = new Set(contracts.map((c) => c.id));
  const installments = allInstallments.filter((i) => contractIds.has(i.contractId));
  const bids = allBids
    .filter((b) => contractIds.has(b.contractId))
    .filter((b) =>
      input.periodStart || input.periodEnd
        ? withinPeriod(b.bidDate, input.periodStart, input.periodEnd)
        : true,
    );

  const openInstallments = installments.filter((i) => i.status !== "paid" && i.status !== "cancelled");
  const overdue = openInstallments.filter(isEffectivelyOverdue);
  const sections: ReportSection[] = [];

  if (wanted.has("kpis")) {
    const active = contracts.filter((c) => c.status === "active");
    const contemplated = contracts.filter((c) => c.contemplatedAt !== null);

    sections.push({
      id: "kpis",
      title: "Indicadores gerais",
      source: source("Consórcios › Contratos", MODULE_ROUTES.contratos),
      kpis: [
        { label: "Contratos", value: String(contracts.length) },
        { label: "Contratos ativos", value: String(active.length) },
        {
          label: "Crédito total",
          value: formatCurrencyBRL(contracts.reduce((s, c) => s + Number(c.creditAmount ?? 0), 0)),
        },
        { label: "Contemplações", value: String(contemplated.length) },
        { label: "Parcelas em aberto", value: String(openInstallments.length) },
        {
          label: "Parcelas em atraso",
          value: String(overdue.length),
          sub: overdue.length > 0 ? formatCurrencyBRL(overdue.reduce((s, i) => s + Number(i.amount ?? 0), 0)) : null,
        },
      ],
    });
  }

  if (wanted.has("status")) {
    const byStatus = new Map<string, number>();
    for (const c of contracts) bump(byStatus, contractStatusLabel(c.status));

    sections.push(
      byStatus.size > 0
        ? {
            id: "status",
            title: "Contratos por situação",
            source: source("Consórcios › Contratos", MODULE_ROUTES.contratos),
            charts: [
              {
                id: "status-barras",
                kind: "bar",
                title: "Distribuição por situação",
                format: "number",
                data: counted(byStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, value]) => ({ label, value })),
              },
            ],
          }
        : emptySection("status", "Contratos por situação"),
    );
  }

  if (wanted.has("ranking")) {
    const byClient = new Map<string, number>();
    for (const c of contracts) {
      bump(byClient, c.clientName ?? "Sem cliente vinculado", Number(c.creditAmount ?? 0));
    }

    sections.push(
      byClient.size > 0
        ? {
            id: "ranking",
            title: "Crédito por cliente",
            source: source("Consórcios › Contratos", MODULE_ROUTES.contratos),
            charts: [ranking("ranking-barras", "Crédito contratado por cliente", counted(byClient))],
          }
        : emptySection("ranking", "Crédito por cliente"),
    );
  }

  if (wanted.has("contratos")) {
    sections.push(
      contracts.length > 0
        ? {
            id: "contratos",
            title: "Contratos",
            source: source("Consórcios › Contratos", MODULE_ROUTES.contratos),
            tables: [
              tableFrom(
                "contratos-tabela",
                "Carteira de contratos",
                ["Cliente", "Administradora", "Contrato", "Crédito", "Parcelas", "Situação"],
                [...contracts].sort(
                  (a, b) => Number(b.creditAmount ?? 0) - Number(a.creditAmount ?? 0),
                ),
                (c) => [
                  c.clientName ?? "—",
                  c.administratorName ?? "—",
                  c.contractNumber ?? "—",
                  formatCurrencyBRL(c.creditAmount),
                  `${c.paidInstallments} de ${c.totalInstallments}`,
                  contractStatusLabel(c.status),
                ],
                (c) => MODULE_ROUTES.contrato(c.id),
                30,
              ),
            ],
          }
        : emptySection("contratos", "Contratos"),
    );
  }

  if (wanted.has("parcelas")) {
    const scoped = openInstallments.filter((i) =>
      input.periodStart || input.periodEnd
        ? withinPeriod(i.dueDate, input.periodStart, input.periodEnd)
        : true,
    );

    sections.push(
      scoped.length > 0
        ? {
            id: "parcelas",
            title: "Parcelas em aberto",
            kpis: [
              { label: "Parcelas", value: String(scoped.length) },
              {
                label: "Valor em aberto",
                value: formatCurrencyBRL(scoped.reduce((s, i) => s + Number(i.amount ?? 0), 0)),
              },
            ],
            source: source("Consórcios › Parcelas", MODULE_ROUTES.parcelas),
            tables: [
              tableFrom(
                "parcelas-tabela",
                "Parcelas a vencer e vencidas",
                ["Vencimento", "Cliente", "Contrato", "Parcela", "Valor", "Situação"],
                [...scoped].sort((a, b) => ((a.dueDate ?? "") < (b.dueDate ?? "") ? -1 : 1)),
                (i) => [
                  i.dueDate ? formatDateOnly(i.dueDate) : "—",
                  i.clientName ?? "—",
                  i.contractLabel,
                  String(i.installmentNumber),
                  formatCurrencyBRL(i.amount),
                  isEffectivelyOverdue(i) ? "Em atraso" : installmentStatusLabel(i.status),
                ],
                (i) => MODULE_ROUTES.contrato(i.contractId),
                30,
              ),
            ],
          }
        : emptySection("parcelas", "Parcelas em aberto"),
    );
  }

  if (wanted.has("lances")) {
    const byResult = new Map<string, number>();
    for (const b of bids) bump(byResult, bidResultLabel(b.result));

    sections.push(
      bids.length > 0
        ? {
            id: "lances",
            title: "Lances",
            charts: [
              {
                id: "lances-barras",
                kind: "bar",
                title: "Lances por resultado",
                format: "number",
                data: counted(byResult)
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, value]) => ({ label, value })),
              },
            ],
            source: source("Consórcios › Lances", MODULE_ROUTES.lances),
            tables: [
              tableFrom(
                "lances-tabela",
                "Lances registrados",
                ["Data", "Cliente", "Contrato", "Modalidade", "Valor", "Resultado"],
                [...bids].sort((a, b) => ((a.bidDate ?? "") < (b.bidDate ?? "") ? 1 : -1)),
                (b) => [
                  b.bidDate ? formatDateOnly(b.bidDate) : "—",
                  b.clientName ?? "—",
                  b.contractLabel,
                  b.bidType ?? "—",
                  formatCurrencyBRL(b.bidAmount),
                  bidResultLabel(b.result),
                ],
                (b) => MODULE_ROUTES.contrato(b.contractId),
              ),
            ],
          }
        : emptySection("lances", "Lances"),
    );
  }

  return sections;
}

async function buildOperacional(
  organizationId: string,
  input: BuildReportInput,
  wanted: Set<string>,
): Promise<ReportSection[]> {
  const [tasks, leads, stages] = await Promise.all([
    listTasks(organizationId),
    listLeads(organizationId),
    listOpportunitiesByStage(organizationId),
  ]);

  const inPeriod = (value: string | null) =>
    input.periodStart || input.periodEnd ? withinPeriod(value, input.periodStart, input.periodEnd) : true;

  const scopedTasks = tasks.filter((t) => inPeriod(t.createdAt));
  const scopedLeads = leads.filter((l) => inPeriod(l.createdAt));
  const opportunities = stages.flatMap((s) => s.opportunities.map((o) => ({ ...o, stageName: s.name })));
  const scopedOpportunities = opportunities.filter((o) => inPeriod(o.createdAt));

  const openTasks = scopedTasks.filter((t) => isTaskOpen(t.status));
  const now = new Date();
  const overdueTasks = openTasks.filter((t) => t.dueAt !== null && new Date(t.dueAt) < now);
  const sections: ReportSection[] = [];

  if (wanted.has("kpis")) {
    const completed = scopedTasks.filter((t) => t.status === "completed");
    const converted = scopedLeads.filter((l) => l.status === "Convertido");

    sections.push({
      id: "kpis",
      title: "Indicadores gerais",
      source: source("Tarefas", MODULE_ROUTES.tarefas),
      kpis: [
        { label: "Tarefas no período", value: String(scopedTasks.length) },
        {
          label: "Tarefas concluídas",
          value: String(completed.length),
          sub: scopedTasks.length > 0 ? `${pct(completed.length, scopedTasks.length)} de conclusão` : null,
        },
        { label: "Tarefas em atraso", value: String(overdueTasks.length) },
        { label: "Leads no período", value: String(scopedLeads.length) },
        {
          label: "Leads convertidos",
          value: String(converted.length),
          sub: scopedLeads.length > 0 ? `${pct(converted.length, scopedLeads.length)} de conversão` : null,
        },
        {
          label: "Oportunidades abertas",
          value: String(scopedOpportunities.filter((o) => o.status === "open").length),
        },
      ],
    });
  }

  if (wanted.has("tarefas_status")) {
    const byStatus = new Map<string, number>();
    for (const t of scopedTasks) bump(byStatus, STATUS_LABEL[t.status] ?? t.status);

    sections.push(
      byStatus.size > 0
        ? {
            id: "tarefas_status",
            title: "Tarefas por situação",
            source: source("Tarefas", MODULE_ROUTES.tarefas),
            charts: [
              {
                id: "tarefas-status-barras",
                kind: "bar",
                title: "Distribuição das tarefas",
                format: "number",
                data: counted(byStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, value]) => ({ label, value })),
              },
            ],
          }
        : emptySection("tarefas_status", "Tarefas por situação"),
    );
  }

  if (wanted.has("pipeline")) {
    const open = scopedOpportunities.filter((o) => o.status === "open");
    const byStage = new Map<string, number>();
    for (const o of open) bump(byStage, o.stageName, Number(o.estimatedValue ?? 0));

    sections.push(
      open.length > 0
        ? {
            id: "pipeline",
            title: "Pipeline de oportunidades",
            source: source("Oportunidades", MODULE_ROUTES.oportunidades),
            kpis: [
              { label: "Oportunidades abertas", value: String(open.length) },
              {
                label: "Valor em pipeline",
                value: formatCurrencyBRL(open.reduce((s, o) => s + Number(o.estimatedValue ?? 0), 0)),
              },
            ],
            charts: [ranking("pipeline-barras", "Valor por etapa do funil", counted(byStage))],
          }
        : emptySection("pipeline", "Pipeline de oportunidades"),
    );
  }

  if (wanted.has("tarefas_atraso")) {
    sections.push(
      overdueTasks.length > 0
        ? {
            id: "tarefas_atraso",
            title: "Tarefas em atraso",
            source: source("Tarefas", MODULE_ROUTES.tarefas),
            tables: [
              tableFrom(
                "tarefas-atraso-tabela",
                "Pendências vencidas",
                ["Vencimento", "Tarefa", "Responsável", "Cliente", "Prioridade", "Categoria"],
                [...overdueTasks].sort((a, b) => ((a.dueAt ?? "") < (b.dueAt ?? "") ? -1 : 1)),
                (t) => [
                  t.dueAt ? formatDate(t.dueAt) : "—",
                  t.title,
                  t.assignedToName ?? "—",
                  t.clientName ?? "—",
                  PRIORITY_LABEL[t.priority] ?? t.priority,
                  t.category ? (CATEGORY_LABEL[t.category] ?? t.category) : "—",
                ],
                (t) => (t.clientId ? MODULE_ROUTES.cliente(t.clientId) : MODULE_ROUTES.tarefas),
                30,
              ),
            ],
          }
        : emptySection("tarefas_atraso", "Tarefas em atraso", "Nenhuma tarefa em atraso no período."),
    );
  }

  if (wanted.has("oportunidades_abertas")) {
    const open = scopedOpportunities.filter((o) => o.status === "open");

    sections.push(
      open.length > 0
        ? {
            id: "oportunidades_abertas",
            title: "Oportunidades abertas",
            source: source("Oportunidades", MODULE_ROUTES.oportunidades),
            tables: [
              tableFrom(
                "oportunidades-tabela",
                "Negócios em andamento",
                ["Oportunidade", "Etapa", "Cliente / Lead", "Assessor", "Valor", "Previsão"],
                [...open].sort(
                  (a, b) => Number(b.estimatedValue ?? 0) - Number(a.estimatedValue ?? 0),
                ),
                (o) => [
                  o.title,
                  o.stageName,
                  o.clientName ?? o.leadName ?? "—",
                  o.assignedAdvisorName ?? "—",
                  formatCurrencyBRL(o.estimatedValue),
                  o.expectedCloseDate ? formatDateOnly(o.expectedCloseDate) : "—",
                ],
                (o) => MODULE_ROUTES.oportunidade(o.id),
                30,
              ),
            ],
          }
        : emptySection("oportunidades_abertas", "Oportunidades abertas"),
    );
  }

  if (wanted.has("leads_origem")) {
    const bySource = new Map<string, number>();
    for (const l of scopedLeads) bump(bySource, l.source ?? "Sem origem registrada");

    sections.push(
      bySource.size > 0
        ? {
            id: "leads_origem",
            title: "Leads por origem",
            source: source("Leads", MODULE_ROUTES.leads),
            charts: [donut("leads-origem-donut", "Distribuição por canal de origem", counted(bySource), "number")],
            tables: [
              table(
                "leads-origem-tabela",
                "Volume por origem",
                ["Origem", "Leads", "Participação"],
                counted(bySource)
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, value]) => [label, value, pct(value, scopedLeads.length)]),
              ),
            ],
          }
        : emptySection("leads_origem", "Leads por origem"),
    );
  }

  return sections;
}

async function buildExecutivo(
  organizationId: string,
  input: BuildReportInput,
  wanted: Set<string>,
): Promise<ReportSection[]> {
  const [overview, history, stages, clients, contracts] = await Promise.all([
    getWealthOverview(organizationId),
    getWealthHistory(organizationId),
    listOpportunitiesByStage(organizationId),
    listClients(organizationId),
    getConsortiumContracts(organizationId),
  ]);

  const openOpportunities = stages
    .flatMap((s) => s.opportunities.map((o) => ({ ...o, stageName: s.name })))
    .filter((o) => o.status === "open");

  const sections: ReportSection[] = [];

  if (wanted.has("kpis")) {
    sections.push({
      id: "kpis",
      title: "Indicadores gerais",
      source: source("Patrimônio", MODULE_ROUTES.patrimonio),
      kpis: [
        { label: "Patrimônio sob gestão", value: formatCurrencyBRL(overview.netWorth) },
        { label: "Ativos totais", value: formatCurrencyBRL(overview.totalAssets) },
        { label: "Clientes ativos", value: String(clients.filter((c) => c.status === "active").length) },
        { label: "Contratos de consórcio", value: String(contracts.length) },
        { label: "Oportunidades abertas", value: String(openOpportunities.length) },
        {
          label: "Valor em pipeline",
          value: formatCurrencyBRL(
            openOpportunities.reduce((s, o) => s + Number(o.estimatedValue ?? 0), 0),
          ),
        },
      ],
    });
  }

  if (wanted.has("evolucao")) {
    const scoped = filterMonthly(history, input.periodStart, input.periodEnd);
    sections.push(
      scoped.length >= 2
        ? {
            id: "evolucao",
            title: "Evolução patrimonial",
            source: source("Patrimônio", MODULE_ROUTES.patrimonio),
            charts: [
              {
                id: "evolucao-linha",
                kind: "line",
                title: "Patrimônio sob gestão por mês",
                format: "currency",
                data: scoped.map((p) => ({ label: formatMonthLabel(p.month), value: p.value })),
              },
            ],
          }
        : emptySection(
            "evolucao",
            "Evolução patrimonial",
            "Não disponível — são necessários pelo menos dois meses com movimentação registrada.",
          ),
    );
  }

  if (wanted.has("alocacao")) {
    const allocation = overview.allocation.filter((a) => a.value > 0);
    sections.push(
      allocation.length > 0
        ? {
            id: "alocacao",
            title: "Alocação de ativos",
            source: source("Patrimônio", MODULE_ROUTES.patrimonio),
            charts: [
              donut(
                "alocacao-donut",
                "Composição consolidada",
                allocation.map((a) => [a.productType, a.value] as [string, number]),
              ),
            ],
          }
        : emptySection("alocacao", "Alocação de ativos"),
    );
  }

  if (wanted.has("pipeline")) {
    const byStage = new Map<string, number>();
    for (const o of openOpportunities) bump(byStage, o.stageName, Number(o.estimatedValue ?? 0));

    sections.push(
      byStage.size > 0
        ? {
            id: "pipeline",
            title: "Pipeline de oportunidades",
            source: source("Oportunidades", MODULE_ROUTES.oportunidades),
            charts: [ranking("pipeline-barras", "Valor por etapa do funil", counted(byStage))],
          }
        : emptySection("pipeline", "Pipeline de oportunidades"),
    );
  }

  if (wanted.has("top_clientes")) {
    const top = topN(
      [...clients].sort((a, b) => b.netWorth - a.netWorth).filter((c) => c.netWorth > 0),
      10,
    );

    sections.push(
      top.length > 0
        ? {
            id: "top_clientes",
            title: "Principais clientes por patrimônio",
            charts: [
              ranking(
                "top-clientes-barras",
                "Patrimônio líquido por cliente",
                top.map((c) => [c.fullName, c.netWorth] as [string, number]),
                10,
              ),
            ],
            source: source("Clientes", MODULE_ROUTES.clientes),
            tables: [
              tableFrom(
                "top-clientes-tabela",
                "Concentração da carteira",
                ["Cliente", "Assessor", "Patrimônio líquido", "Participação"],
                top,
                (c) => [
                  c.fullName,
                  c.assignedAdvisorName ?? "—",
                  formatCurrencyBRL(c.netWorth),
                  pct(c.netWorth, overview.netWorth),
                ],
                (c) => MODULE_ROUTES.cliente(c.id),
              ),
            ],
          }
        : emptySection("top_clientes", "Principais clientes por patrimônio"),
    );
  }

  return sections;
}

/* ────────────────────────────────────────────────────────────────
 * Entrada pública
 * ──────────────────────────────────────────────────────────────── */

/** Remove do conjunto pedido as seções que não podem ir num documento
 * destinado ao cliente (informação interna da casa). */
export function resolveSections(
  type: ReportType,
  audience: ReportAudience,
  requested: string[],
): string[] {
  const valid = new Set(REPORT_TYPE_SECTIONS[type].map((s) => s.id));
  const blocked = audience === "cliente" ? new Set(INTERNAL_ONLY_SECTIONS[type]) : new Set<string>();
  return requested.filter((id) => valid.has(id) && !blocked.has(id));
}

/**
 * Monta o snapshot completo do relatório. O retorno é gravado como-está
 * em `reports.payload` — reabrir um relatório antigo mostra exatamente
 * o que foi gerado naquele momento, mesmo que os dados tenham mudado
 * depois (rastreabilidade e auditoria).
 */
export async function buildReportPayload(
  organizationId: string,
  input: BuildReportInput,
): Promise<ReportPayload> {
  const sectionIds = resolveSections(input.type, input.audience, input.sections);
  const wanted = new Set(sectionIds);

  let sections: ReportSection[];
  switch (input.type) {
    case "patrimonial":
      sections = await buildPatrimonial(organizationId, input, wanted);
      break;
    case "investimentos":
      sections = await buildInvestimentos(organizationId, input, wanted);
      break;
    case "cliente":
      sections = await buildCliente(organizationId, input, wanted);
      break;
    case "consorcios":
      sections = await buildConsorcios(organizationId, input, wanted);
      break;
    case "operacional":
      sections = await buildOperacional(organizationId, input, wanted);
      break;
    case "executivo":
      sections = await buildExecutivo(organizationId, input, wanted);
      break;
  }

  let clientName: string | null = null;
  if (input.clientId) {
    const profile = await getClientProfile(organizationId, input.clientId);
    clientName = profile?.full_name ?? null;
  }

  const subtitleParts: string[] = [];
  if (input.institution) subtitleParts.push(`Instituição: ${input.institution}`);
  if (input.audience === "cliente") subtitleParts.push("Documento destinado ao cliente");

  return {
    type: input.type,
    title: input.title,
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(" · ") : null,
    clientName,
    periodLabel: buildPeriodLabel(input.periodStart, input.periodEnd),
    generatedAt: new Date().toISOString(),
    sections,
  };
}
