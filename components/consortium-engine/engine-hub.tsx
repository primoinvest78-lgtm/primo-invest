"use client";

import Link from "next/link";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssemblyCreateDialog } from "@/components/consortium-engine/assembly-create-dialog";
import { AuditTimeline } from "@/components/consortium-engine/audit-timeline";
import { CreditOpenDialog } from "@/components/consortium-engine/credit-open-dialog";
import { GroupCreateDialog } from "@/components/consortium-engine/group-create-dialog";
import { LotteryImportDialog } from "@/components/consortium-engine/lottery-import-dialog";
import { LotteryVerify } from "@/components/consortium-engine/lottery-verify";
import { RuleFormDialog } from "@/components/consortium-engine/rule-form-dialog";
import {
  EmptyState,
  Hash,
  Section,
  Stat,
  StatusBadge,
  tableClass,
  tdClass,
  thClass,
  trClass,
} from "@/components/consortium-engine/ui";
import { CREDIT_STATUS_LABEL } from "@/lib/consortium-engine/credit.ts";
import {
  CONTEMPLATION_METHOD_LABEL,
  GROUP_STATUS_LABEL,
  labelOf,
  LOTTERY_STATUS_LABEL,
  RULE_STATUS_LABEL,
  SOURCE_LABEL,
} from "@/lib/consortium-engine/labels.ts";
import { ASSEMBLY_STATUS_LABEL } from "@/lib/consortium-engine/state-machine.ts";
import type { CreditOperation } from "@/lib/data/consortium-credit";
import type {
  EngineAssembly,
  EngineEvent,
  EngineGroup,
  EngineLotteryResult,
  EngineRule,
} from "@/lib/data/consortium-engine";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

const GOVERN = ["admin", "manager", "compliance"];

export function EngineHub(props: {
  role: string;
  groups: EngineGroup[];
  rules: EngineRule[];
  lottery: EngineLotteryResult[];
  assemblies: EngineAssembly[];
  events: EngineEvent[];
  credits: CreditOperation[];
  pendingCredit: { id: string; assemblyId: string; quotaNumber: number; method: string; creditAmount: number | null; homologatedAt: string | null }[];
  inProgress: number;
}) {
  const { groups, rules, lottery, assemblies, events, credits, pendingCredit, inProgress, role } = props;
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const canGovern = GOVERN.includes(role);
  const pendingLottery = lottery.filter((l) => l.verificationStatus === "PENDING").length;
  const creditsOpen = credits.filter((c) => !["CLOSED", "CANCELLED", "USED"].includes(c.status)).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Grupos" value={String(groups.length)} delay={0} />
        <Stat label="Assembleias em andamento" value={String(inProgress)} delay={0.05} />
        <Stat label="Regras publicadas" value={String(rules.filter((r) => r.status === "PUBLISHED").length)} delay={0.1} />
        <Stat
          label="Resultados a verificar"
          value={String(pendingLottery)}
          tone={pendingLottery > 0 ? "warning" : "default"}
          delay={0.15}
        />
        <Stat label="Créditos em andamento" value={String(creditsOpen)} hint={`${pendingCredit.length} contemplação(ões) sem crédito aberto`} delay={0.2} />
      </div>

      <Tabs defaultValue="assembleias">
        <div className="overflow-x-auto pb-1">
          <TabsList>
            <TabsTrigger value="assembleias">Assembleias</TabsTrigger>
            <TabsTrigger value="grupos">Grupos</TabsTrigger>
            <TabsTrigger value="regras">Regras</TabsTrigger>
            <TabsTrigger value="loteria">Resultado oficial</TabsTrigger>
            <TabsTrigger value="credito">Crédito</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="assembleias">
          <Section
            title="Assembleias"
            subtitle="Ciclo: agendada → elegibilidade → resultado oficial → apuração → lances → homologação → travada."
            actions={groups.length ? <AssemblyCreateDialog groups={groups} /> : null}
          >
            {assemblies.length === 0 ? (
              <EmptyState>{groups.length ? "Nenhuma assembleia cadastrada." : "Cadastre um grupo antes de criar assembleias."}</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>Assembleia</th>
                      <th className={thClass}>Grupo</th>
                      <th className={thClass}>Data</th>
                      <th className={thClass}>Previstas</th>
                      <th className={thClass}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assemblies.map((a) => {
                      const g = groupById.get(a.groupId);
                      return (
                        <tr key={a.id} className={trClass}>
                          <td className={tdClass}>
                            <Link href={`/consorcios/motor/assembleias/${a.id}`} className="font-semibold text-foreground hover:text-primary">
                              Nº {a.assemblyNumber}
                            </Link>
                          </td>
                          <td className={tdClass}>{g ? `${g.administratorName} · ${g.groupCode}` : "—"}</td>
                          <td className={tdClass}>{formatDate(a.assemblyDate)}</td>
                          <td className={tdClass}>{a.plannedDrawContemplations}</td>
                          <td className={tdClass}>
                            <StatusBadge status={a.status} label={ASSEMBLY_STATUS_LABEL[a.status]} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="grupos">
          <Section
            title="Grupos"
            subtitle="Administradora, faixa numérica, crédito e parâmetros do grupo."
            actions={<GroupCreateDialog />}
          >
            {groups.length === 0 ? (
              <EmptyState>Nenhum grupo cadastrado.</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>Grupo</th>
                      <th className={thClass}>Administradora</th>
                      <th className={thClass}>Cotas</th>
                      <th className={thClass}>Crédito</th>
                      <th className={thClass}>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => (
                      <tr key={g.id} className={trClass}>
                        <td className={tdClass}>
                          <Link href={`/consorcios/motor/grupos/${g.id}`} className="font-semibold text-foreground hover:text-primary">
                            {g.groupCode}
                          </Link>
                          {g.productType ? <span className="block text-xs text-card-beige-muted-foreground">{g.productType}</span> : null}
                        </td>
                        <td className={tdClass}>{g.administratorName}</td>
                        <td className={tdClass}>
                          {g.quotaCount}{" "}
                          <span className="text-xs text-card-beige-muted-foreground">
                            ({String(g.numbering.numberStart).padStart(g.numbering.displayDigits, "0")} a{" "}
                            {String(g.numbering.numberEnd).padStart(g.numbering.displayDigits, "0")})
                          </span>
                        </td>
                        <td className={tdClass}>{g.creditAmount !== null ? formatCurrencyBRL(g.creditAmount) : "—"}</td>
                        <td className={tdClass}>
                          <StatusBadge status={g.status} label={labelOf(GROUP_STATUS_LABEL, g.status)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="regras">
          <Section
            title="Regras de apuração"
            subtitle="Versionadas. Rascunho → revisão → aprovação → publicação. Regra publicada nunca é alterada: cria-se nova versão."
            actions={<RuleFormDialog groups={groups} />}
          >
            {rules.length === 0 ? (
              <EmptyState>Nenhuma regra cadastrada. Cadastre a regra conforme o regulamento do grupo.</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>Regra</th>
                      <th className={thClass}>Versão</th>
                      <th className={thClass}>Administradora</th>
                      <th className={thClass}>Vigência</th>
                      <th className={thClass}>Hash</th>
                      <th className={thClass}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r) => (
                      <tr key={r.id} className={trClass}>
                        <td className={tdClass}>
                          <Link href={`/consorcios/motor/regras/${r.id}`} className="font-semibold text-foreground hover:text-primary">
                            {r.name}
                          </Link>
                          <span className="block text-xs text-card-beige-muted-foreground">{r.ruleKey}</span>
                        </td>
                        <td className={tdClass}>v{r.version}</td>
                        <td className={tdClass}>{r.administratorName}</td>
                        <td className={tdClass}>
                          {formatDate(r.effectiveFrom)} a {r.effectiveUntil ? formatDate(r.effectiveUntil) : "indeterminado"}
                        </td>
                        <td className={tdClass}>
                          <Hash value={r.ruleHash} />
                        </td>
                        <td className={tdClass}>
                          <StatusBadge status={r.status} label={labelOf(RULE_STATUS_LABEL, r.status)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="loteria">
          <Section
            title="Resultado oficial"
            subtitle="Importado e conferido contra a fonte oficial. Depois de verificado, fica congelado com hash."
            actions={<LotteryImportDialog />}
          >
            {lottery.length === 0 ? (
              <EmptyState>Nenhum resultado importado.</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>Concurso</th>
                      <th className={thClass}>Data</th>
                      <th className={thClass}>Prêmios</th>
                      <th className={thClass}>Referência</th>
                      <th className={thClass}>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lottery.map((l) => (
                      <tr key={l.id} className={trClass}>
                        <td className={tdClass}>
                          <span className="font-semibold">{l.contestNumber}</span>
                          <span className="block text-xs text-card-beige-muted-foreground">{labelOf(SOURCE_LABEL, l.source)}</span>
                        </td>
                        <td className={tdClass}>{formatDate(l.drawDate)}</td>
                        <td className={tdClass}>
                          <span className="font-mono text-xs">{l.prizes.join(" · ")}</span>
                          <span className="block">
                            <Hash value={l.contentHash} label="hash" />
                          </span>
                        </td>
                        <td className={tdClass}>
                          <span className="text-xs">{l.sourceReference ?? "—"}</span>
                          {l.validationErrors.length ? (
                            <span className="block text-xs text-destructive">{l.validationErrors.join(" ")}</span>
                          ) : null}
                        </td>
                        <td className={tdClass}>
                          <div className="space-y-2">
                            <StatusBadge status={l.verificationStatus} label={labelOf(LOTTERY_STATUS_LABEL, l.verificationStatus)} />
                            {l.verificationStatus === "PENDING" && canGovern ? <LotteryVerify resultId={l.id} /> : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="credito">
          <div className="space-y-6">
            {pendingCredit.length > 0 ? (
              <Section title="Contemplações homologadas sem crédito aberto" subtitle="Contemplação dá direito ao crédito — a liberação é um fluxo próprio.">
                <div className="space-y-2">
                  {pendingCredit.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-black/5 px-3.5 py-3">
                      <div className="text-sm">
                        <span className="font-semibold">Cota {p.quotaNumber}</span> · {labelOf(CONTEMPLATION_METHOD_LABEL, p.method)} ·{" "}
                        {p.creditAmount !== null ? formatCurrencyBRL(p.creditAmount) : "crédito não informado"}
                        <Link href={`/consorcios/motor/assembleias/${p.assemblyId}`} className="ml-2 text-xs font-semibold text-accent hover:underline">
                          ver assembleia
                        </Link>
                      </div>
                      <CreditOpenDialog contemplationId={p.id} creditAmount={p.creditAmount} />
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}
            <Section title="Operações de crédito" subtitle="Documentação → análise → garantia → aprovação → crédito disponível → utilização.">
              {credits.length === 0 ? (
                <EmptyState>Nenhuma operação de crédito.</EmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th className={thClass}>Cota</th>
                        <th className={thClass}>Crédito líquido</th>
                        <th className={thClass}>Utilizado</th>
                        <th className={thClass}>Saldo</th>
                        <th className={thClass}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {credits.map((c) => (
                        <tr key={c.id} className={trClass}>
                          <td className={tdClass}>
                            <Link href={`/consorcios/motor/credito/${c.id}`} className="font-semibold text-foreground hover:text-primary">
                              Cota {c.quotaLabel ?? c.quotaNumber ?? "—"}
                            </Link>
                            <span className="block text-xs text-card-beige-muted-foreground">
                              {c.administratorName} · {c.groupCode} {c.holderLabel ? `· ${c.holderLabel}` : ""}
                            </span>
                          </td>
                          <td className={tdClass}>{formatCurrencyBRL(c.netAvailableCredit)}</td>
                          <td className={tdClass}>{formatCurrencyBRL(c.usedCredit)}</td>
                          <td className={tdClass}>{formatCurrencyBRL(c.remainingCredit)}</td>
                          <td className={tdClass}>
                            <StatusBadge status={c.status} label={CREDIT_STATUS_LABEL[c.status]} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="auditoria">
          <Section title="Auditoria do motor" subtitle="Eventos encadeados por hash — cada um referencia o anterior. Não podem ser alterados nem apagados.">
            <AuditTimeline events={events} />
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
