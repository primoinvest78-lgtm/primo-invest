/**
 * Motor de regras da Central de Inteligência — 100% determinístico.
 *
 * Não é uma segunda fonte de dado: a parte de Leads/Oportunidades/
 * Tarefas/Clientes reaproveita literalmente `buildCrmSignals` (o mesmo
 * motor do Hub CRM) e só reclassifica cada sinal na taxonomia pedida
 * aqui (Atenção/Oportunidade/Pendência/Informação). As demais seções
 * (Metas, Passivos, Consórcios, Documentos, Patrimônio, Integrações)
 * usam os MESMOS helpers de classificação que já existem nas telas de
 * cada módulo (`goal-helpers`, `liability-helpers`, `installment-
 * helpers`, `document-helpers`, `wealth-helpers`) — nenhum limiar novo
 * é inventado aqui, só a leitura + rotulagem.
 */

import type { CrmSignal } from "@/lib/crm/signals";
import { buildCrmSignals } from "@/lib/crm/signals";
import type { ClientListItem } from "@/lib/data/clients";
import type { ConsortiumContract, ConsortiumInstallment } from "@/lib/data/consortiums";
import type { VaultDocument } from "@/lib/data/documents";
import type { IntegrationRow } from "@/lib/data/integrations";
import type { LeadListItem } from "@/lib/data/leads";
import type { StageColumn } from "@/lib/data/opportunities";
import type { TaskItem } from "@/lib/data/tasks";
import type { GoalDetail, LiabilityDetail, WealthHistoryPoint, WealthOverview } from "@/lib/data/wealth";
import { integrationStatusLabel } from "@/lib/integrations/catalog";
import { computeGoalStatus, daysRemaining, progressPct } from "@/lib/utils/goal-helpers";
import { daysFromToday, isEffectivelyOverdue } from "@/lib/utils/installment-helpers";
import { daysUntil, isExpired, isExpiringSoon } from "@/lib/utils/document-helpers";
import { monthsToPayoff } from "@/lib/utils/liability-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";
import type { Insight, InsightPriority, InsightType } from "@/lib/intelligence/types";

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * `buildCrmSignals` prefixa cada id por regra (`lead-action-`, `lead-
 * hot-`, `lead-stalled-`, `opp-closing-`, `opp-stalled-`, `task-`,
 * `client-risk-`) — usamos esse prefixo pra decidir o tipo de insight,
 * em vez de recalcular a condição de novo.
 */
function classifyCrmSignal(signal: CrmSignal): { type: InsightType; priority: InsightPriority; suggestedAction: string } {
  if (signal.id.startsWith("lead-action-")) {
    return { type: "pendencia", priority: "alta", suggestedAction: "Concluir a tarefa de próximo passo" };
  }
  if (signal.id.startsWith("lead-hot-")) {
    return { type: "oportunidade", priority: "media", suggestedAction: "Agendar contato" };
  }
  if (signal.id.startsWith("lead-stalled-")) {
    return { type: "atencao", priority: "media", suggestedAction: "Agendar contato" };
  }
  if (signal.id.startsWith("opp-closing-")) {
    return { type: "oportunidade", priority: "alta", suggestedAction: "Abrir oportunidade" };
  }
  if (signal.id.startsWith("opp-stalled-")) {
    return { type: "atencao", priority: "media", suggestedAction: "Abrir oportunidade" };
  }
  if (signal.id.startsWith("task-")) {
    return {
      type: "pendencia",
      priority: signal.severity === "critical" ? "alta" : "media",
      suggestedAction: "Concluir a tarefa",
    };
  }
  if (signal.id.startsWith("client-risk-")) {
    return {
      type: "pendencia",
      priority: signal.severity === "critical" ? "alta" : "media",
      suggestedAction: "Revisar cadastro",
    };
  }
  return { type: "informacao", priority: "baixa", suggestedAction: "Revisar cadastro" };
}

function fromCrmSignals(signals: CrmSignal[]): Insight[] {
  const sourceModule = { lead: "leads", opportunity: "oportunidades", task: "tarefas", client: "clientes" } as const;

  return signals.map((signal) => {
    const { type, priority, suggestedAction } = classifyCrmSignal(signal);
    return {
      key: `crm:${signal.id}`,
      title: signal.title,
      type,
      priority,
      status: "aberto",
      sourceModule: sourceModule[signal.kind],
      // O href do sinal do CRM é um atalho pro cliente quando a tarefa tem
      // um — aqui "origem" precisa ser o quadro de Tarefas mesmo, já que
      // "Ver cliente" (abaixo) cobre o outro caso.
      sourceHref: signal.kind === "task" ? "/tarefas" : signal.href,
      clientId: signal.clientId,
      clientName: signal.clientName,
      reason: signal.reason,
      dataUsed: [
        { label: "Responsável", value: signal.ownerName ?? "—" },
        { label: "Referência", value: formatDate(signal.sortKey) },
      ],
      date: signal.sortKey,
      suggestedAction,
    };
  });
}

function fromGoals(goals: GoalDetail[]): Insight[] {
  const insights: Insight[] = [];

  for (const goal of goals) {
    const status = computeGoalStatus(goal);
    if (status === "concluida") continue;

    const days = daysRemaining(goal);
    const pct = progressPct(goal);
    const dataUsed = [
      { label: "Progresso", value: `${pct.toFixed(0)}%` },
      { label: "Valor atual", value: formatCurrencyBRL(goal.currentAmount) },
      { label: "Valor alvo", value: goal.targetAmount ? formatCurrencyBRL(goal.targetAmount) : "Não definido" },
      { label: "Prazo", value: goal.targetDate ? formatDate(goal.targetDate) : "Sem prazo" },
    ];
    const sourceHref = "/patrimonio/metas";

    if (days !== null && days < 0) {
      insights.push({
        key: `goals:overdue-${goal.id}`,
        title: goal.name,
        type: "pendencia",
        priority: "alta",
        status: "aberto",
        sourceModule: "metas",
        sourceHref,
        clientId: goal.clientId,
        clientName: goal.clientName,
        reason: `Meta passou do prazo com ${pct.toFixed(0)}% concluído.`,
        dataUsed,
        date: goal.targetDate as string,
        suggestedAction: "Agendar contato para revisar a meta",
      });
    } else if (status === "em_risco") {
      insights.push({
        key: `goals:at-risk-${goal.id}`,
        title: goal.name,
        type: "atencao",
        priority: "alta",
        status: "aberto",
        sourceModule: "metas",
        sourceHref,
        clientId: goal.clientId,
        clientName: goal.clientName,
        reason: `Meta em risco: ritmo de aporte está bem abaixo do necessário para o prazo (${pct.toFixed(0)}% concluído).`,
        dataUsed,
        date: goal.targetDate ?? goal.createdAt,
        suggestedAction: "Agendar contato para revisar a meta",
      });
    } else if (status === "atencao") {
      insights.push({
        key: `goals:behind-${goal.id}`,
        title: goal.name,
        type: "atencao",
        priority: "media",
        status: "aberto",
        sourceModule: "metas",
        sourceHref,
        clientId: goal.clientId,
        clientName: goal.clientName,
        reason: `Progresso abaixo do ritmo esperado para o prazo (${pct.toFixed(0)}% concluído).`,
        dataUsed,
        date: goal.targetDate ?? goal.createdAt,
        suggestedAction: "Agendar contato para revisar a meta",
      });
    }
  }

  return insights;
}

function fromLiabilities(liabilities: LiabilityDetail[]): Insight[] {
  const insights: Insight[] = [];
  const now = Date.now();
  const sourceHref = "/patrimonio/passivos";

  for (const liability of liabilities) {
    const dataUsed = [
      { label: "Saldo devedor", value: formatCurrencyBRL(liability.outstandingAmount) },
      { label: "Parcela mensal", value: liability.monthlyPayment ? formatCurrencyBRL(liability.monthlyPayment) : "Não informada" },
      { label: "Vencimento", value: liability.maturityDate ? formatDate(liability.maturityDate) : "Não informado" },
      { label: "Status", value: liability.status },
    ];

    if (liability.maturityDate) {
      const daysToMaturity = Math.round((new Date(liability.maturityDate).getTime() - now) / DAY_MS);
      if (daysToMaturity < 0 && liability.status === "active") {
        insights.push({
          key: `liabilities:overdue-${liability.id}`,
          title: liability.name,
          type: "pendencia",
          priority: "alta",
          status: "aberto",
          sourceModule: "passivos",
          sourceHref,
          clientId: liability.clientId,
          clientName: liability.clientName,
          reason: "Vencimento cadastrado no passado e o passivo ainda está ativo — verificar status junto ao cliente.",
          dataUsed,
          date: liability.maturityDate,
          suggestedAction: "Revisar cadastro",
        });
      } else if (daysToMaturity >= 0 && daysToMaturity <= 90) {
        insights.push({
          key: `liabilities:maturity-${liability.id}`,
          title: liability.name,
          type: "atencao",
          priority: daysToMaturity <= 30 ? "alta" : "media",
          status: "aberto",
          sourceModule: "passivos",
          sourceHref,
          clientId: liability.clientId,
          clientName: liability.clientName,
          reason: `Vencimento em ${daysToMaturity} ${daysToMaturity === 1 ? "dia" : "dias"}.`,
          dataUsed,
          date: liability.maturityDate,
          suggestedAction: "Agendar contato",
        });
      }
    }

    const months = monthsToPayoff(liability);
    if (months !== null && months <= 3) {
      insights.push({
        key: `liabilities:near-payoff-${liability.id}`,
        title: liability.name,
        type: "oportunidade",
        priority: "media",
        status: "aberto",
        sourceModule: "passivos",
        sourceHref,
        clientId: liability.clientId,
        clientName: liability.clientName,
        reason: `Perto da quitação (${months.toFixed(1)} meses restantes no ritmo atual) — capacidade de investimento deve aumentar em breve.`,
        dataUsed,
        date: liability.updatedAt ?? liability.createdAt,
        suggestedAction: "Agendar contato",
      });
    }
  }

  return insights;
}

function fromInstallments(installments: ConsortiumInstallment[], contracts: ConsortiumContract[]): Insight[] {
  const insights: Insight[] = [];

  for (const installment of installments) {
    const label = `${installment.contractLabel} · parcela ${installment.installmentNumber}`;
    const dataUsed = [
      { label: "Valor", value: installment.amount ? formatCurrencyBRL(installment.amount) : "Não informado" },
      { label: "Vencimento", value: installment.dueDate ? formatDate(installment.dueDate) : "Não informado" },
      { label: "Status", value: installment.status },
    ];

    if (isEffectivelyOverdue(installment)) {
      const days = Math.abs(daysFromToday(installment.dueDate as string));
      insights.push({
        key: `installments:overdue-${installment.id}`,
        title: label,
        type: "pendencia",
        priority: "alta",
        status: "aberto",
        sourceModule: "consorcios",
        sourceHref: `/consorcios/contratos/${installment.contractId}`,
        clientId: installment.clientId,
        clientName: installment.clientName,
        reason: `Parcela em atraso há ${days} ${days === 1 ? "dia" : "dias"}.`,
        dataUsed,
        date: installment.dueDate as string,
        suggestedAction: "Solicitar contato para regularização",
      });
    } else if (installment.status === "pending" && installment.dueDate) {
      const days = daysFromToday(installment.dueDate);
      if (days >= 0 && days <= 15) {
        insights.push({
          key: `installments:due-soon-${installment.id}`,
          title: label,
          type: "atencao",
          priority: "media",
          status: "aberto",
          sourceModule: "consorcios",
          sourceHref: `/consorcios/contratos/${installment.contractId}`,
          clientId: installment.clientId,
          clientName: installment.clientName,
          reason: `Vencimento em ${days} ${days === 1 ? "dia" : "dias"}.`,
          dataUsed,
          date: installment.dueDate,
          suggestedAction: "Agendar contato",
        });
      }
    }
  }

  for (const contract of contracts) {
    const remaining = Math.max(contract.totalInstallments - contract.paidInstallments, 0);
    if (remaining > 0 && remaining <= 3 && contract.status === "active") {
      insights.push({
        key: `installments:closing-${contract.id}`,
        title: `${contract.administratorName ?? "—"} · ${contract.contractNumber ?? "—"}`,
        type: "oportunidade",
        priority: "media",
        status: "aberto",
        sourceModule: "consorcios",
        sourceHref: `/consorcios/contratos/${contract.id}`,
        clientId: contract.clientId,
        clientName: contract.clientName,
        reason: `Contrato perto do encerramento: faltam ${remaining} ${remaining === 1 ? "parcela" : "parcelas"} — momento de falar sobre contemplação ou novo contrato.`,
        dataUsed: [
          { label: "Parcelas pagas", value: `${contract.paidInstallments}/${contract.totalInstallments}` },
          { label: "Crédito", value: contract.creditAmount ? formatCurrencyBRL(contract.creditAmount) : "Não informado" },
        ],
        date: contract.updatedAt ?? contract.createdAt,
        suggestedAction: "Agendar contato",
      });
    }
  }

  return insights;
}

function fromDocuments(documents: VaultDocument[], clientsWithoutDocs: { id: string; fullName: string }[]): Insight[] {
  const insights: Insight[] = [];

  for (const doc of documents) {
    if (doc.status !== "active" || !doc.expiresAt) continue;

    const dataUsed = [
      { label: "Categoria", value: doc.category ?? "Não categorizado" },
      { label: "Vencimento", value: formatDate(doc.expiresAt) },
    ];

    if (isExpired(doc)) {
      insights.push({
        key: `documents:expired-${doc.id}`,
        title: doc.name,
        type: "pendencia",
        priority: "alta",
        status: "aberto",
        sourceModule: "documentos",
        sourceHref: "/documentos/cofre",
        clientId: doc.clientId,
        clientName: doc.clientName,
        reason: "Documento vencido.",
        dataUsed,
        date: doc.expiresAt,
        suggestedAction: "Solicitar documento atualizado",
      });
    } else if (isExpiringSoon(doc)) {
      const days = daysUntil(doc.expiresAt);
      insights.push({
        key: `documents:expiring-${doc.id}`,
        title: doc.name,
        type: "atencao",
        priority: days <= 7 ? "alta" : "media",
        status: "aberto",
        sourceModule: "documentos",
        sourceHref: "/documentos/cofre",
        clientId: doc.clientId,
        clientName: doc.clientName,
        reason: `Vence em ${days} ${days === 1 ? "dia" : "dias"}.`,
        dataUsed,
        date: doc.expiresAt,
        suggestedAction: "Solicitar documento atualizado",
      });
    }
  }

  for (const client of clientsWithoutDocs) {
    insights.push({
      key: `documents:missing-${client.id}`,
      title: client.fullName,
      type: "pendencia",
      priority: "baixa",
      status: "aberto",
      sourceModule: "documentos",
      sourceHref: `/clientes/${client.id}`,
      clientId: client.id,
      clientName: client.fullName,
      reason: "Cliente ativo sem nenhum documento cadastrado no cofre.",
      dataUsed: [{ label: "Documentos no cofre", value: "0" }],
      date: new Date().toISOString(),
      suggestedAction: "Solicitar documento",
    });
  }

  return insights;
}

function fromWealth(overview: WealthOverview, history: WealthHistoryPoint[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date().toISOString();

  if (overview.netWorth > 0) {
    const liquidPct = (overview.liquidTotal / overview.netWorth) * 100;
    if (liquidPct < 5) {
      insights.push({
        key: "wealth:low-liquidity",
        title: "Liquidez baixa no book",
        type: "atencao",
        priority: "media",
        status: "aberto",
        sourceModule: "patrimonio",
        sourceHref: "/patrimonio",
        clientId: null,
        clientName: null,
        reason: `Apenas ${liquidPct.toFixed(1)}% do patrimônio líquido total está em caixa/liquidez.`,
        dataUsed: [
          { label: "Total líquido", value: formatCurrencyBRL(overview.liquidTotal) },
          { label: "Patrimônio líquido", value: formatCurrencyBRL(overview.netWorth) },
        ],
        date: now,
        suggestedAction: "Revisar carteira",
      });
    }
  }

  if (overview.totalAssets > 0) {
    for (const entry of overview.allocation) {
      const pct = (entry.value / overview.totalAssets) * 100;
      if (pct >= 60) {
        insights.push({
          key: `wealth:concentration-${entry.productType}`,
          title: `Concentração em ${entry.productType}`,
          type: "atencao",
          priority: "media",
          status: "aberto",
          sourceModule: "patrimonio",
          sourceHref: "/patrimonio/investimentos",
          clientId: null,
          clientName: null,
          reason: `${pct.toFixed(0)}% dos ativos do book estão concentrados em "${entry.productType}".`,
          dataUsed: [
            { label: "Valor em " + entry.productType, value: formatCurrencyBRL(entry.value) },
            { label: "Total em ativos", value: formatCurrencyBRL(overview.totalAssets) },
          ],
          date: now,
          suggestedAction: "Revisar carteira",
        });
      }
    }
  }

  if (history.length >= 2) {
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    if (prev.value > 0) {
      const change = ((last.value - prev.value) / prev.value) * 100;
      if (change <= -10) {
        insights.push({
          key: `wealth:drop-${last.month}`,
          title: "Queda relevante no patrimônio do book",
          type: "atencao",
          priority: "alta",
          status: "aberto",
          sourceModule: "patrimonio",
          sourceHref: "/patrimonio",
          clientId: null,
          clientName: null,
          reason: `Queda de ${Math.abs(change).toFixed(1)}% no patrimônio total entre ${prev.month} e ${last.month}.`,
          dataUsed: [
            { label: prev.month, value: formatCurrencyBRL(prev.value) },
            { label: last.month, value: formatCurrencyBRL(last.value) },
          ],
          date: now,
          suggestedAction: "Revisar carteira",
        });
      }
    }
  }

  if (overview.lastUpdatedAt && Date.now() - new Date(overview.lastUpdatedAt).getTime() > 90 * DAY_MS) {
    insights.push({
      key: "wealth:stale-data",
      title: "Posições de investimento desatualizadas",
      type: "informacao",
      priority: "baixa",
      status: "aberto",
      sourceModule: "patrimonio",
      sourceHref: "/patrimonio/investimentos",
      clientId: null,
      clientName: null,
      reason: "Nenhuma posição de investimento foi atualizada nos últimos 90 dias.",
      dataUsed: [{ label: "Última atualização", value: formatDate(overview.lastUpdatedAt) }],
      date: overview.lastUpdatedAt,
      suggestedAction: "Revisar carteira",
    });
  }

  return insights;
}

function fromIntegrations(integrations: IntegrationRow[]): Insight[] {
  const insights: Insight[] = [];

  for (const row of integrations) {
    const hasProblem = row.status === "error" || row.errorRunCount > 0 || row.openAlertCount > 0;
    if (!hasProblem) continue;

    insights.push({
      key: `integrations:problem-${row.id}`,
      title: row.name,
      type: "pendencia",
      priority: row.status === "error" ? "alta" : "media",
      status: "aberto",
      sourceModule: "integracoes",
      sourceHref: `/integracoes/${row.id}`,
      clientId: null,
      clientName: null,
      reason: `Status "${integrationStatusLabel(row.status)}" com ${row.errorRunCount} ${row.errorRunCount === 1 ? "execução com erro" : "execuções com erro"} e ${row.openAlertCount} ${row.openAlertCount === 1 ? "alerta aberto" : "alertas abertos"}.`,
      dataUsed: [
        { label: "Status", value: integrationStatusLabel(row.status) },
        { label: "Execuções com erro", value: String(row.errorRunCount) },
        { label: "Alertas abertos", value: String(row.openAlertCount) },
      ],
      date: row.updatedAt,
      suggestedAction: "Revisar integração",
    });
  }

  return insights;
}

export function buildIntelligenceInsights(input: {
  leads: LeadListItem[];
  stages: StageColumn[];
  tasks: TaskItem[];
  clients: ClientListItem[];
  goals: GoalDetail[];
  liabilities: LiabilityDetail[];
  installments: ConsortiumInstallment[];
  contracts: ConsortiumContract[];
  documents: VaultDocument[];
  clientsWithoutDocs: { id: string; fullName: string }[];
  wealthOverview: WealthOverview;
  wealthHistory: WealthHistoryPoint[];
  integrations: IntegrationRow[];
}): Insight[] {
  const crmSignals = buildCrmSignals({
    leads: input.leads,
    stages: input.stages,
    tasks: input.tasks,
    clients: input.clients,
  });

  return [
    ...fromCrmSignals(crmSignals.signals),
    ...fromGoals(input.goals),
    ...fromLiabilities(input.liabilities),
    ...fromInstallments(input.installments, input.contracts),
    ...fromDocuments(input.documents, input.clientsWithoutDocs),
    ...fromWealth(input.wealthOverview, input.wealthHistory),
    ...fromIntegrations(input.integrations),
  ];
}
