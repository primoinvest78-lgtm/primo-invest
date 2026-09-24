"use client";

import { useState } from "react";

import { ActionButton, EmptyState, Feedback, Field, NativeSelect, Section, StatusBadge, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  autoPrepareAssembly,
  crossCheckLotterySources,
  fetchLotteryFromOfficialSource,
  generateInternalReport,
  runMonitoringScanAction,
} from "@/lib/actions/consortium-intelligence";
import type { AutomationRow } from "@/lib/data/consortium-intelligence";

const JOB_LABEL: Record<string, string> = {
  LOTTERY_FETCH: "Coleta do resultado oficial",
  LOTTERY_CROSS_CHECK: "Conferência com a fonte oficial",
  MONITORING_SCAN: "Varredura de monitoramento",
  REPRODUCTION_SWEEP: "Reprodução em lote",
  ASSEMBLY_PREPARATION: "Preparação automática",
  INTERNAL_REPORT: "Relatório interno",
  RULE_EXTRACTION: "Extração de regra",
};
const TRIGGER_LABEL: Record<string, string> = { MANUAL: "manual", ON_VIEW: "ao abrir a página", SCHEDULED: "agendada" };
const STATUS_LABEL: Record<string, string> = { SUCCESS: "Sucesso", PARTIAL: "Parcial", FAILED: "Falhou" };

export function AutomationPanel({ assemblies, runs }: { assemblies: { value: string; label: string }[]; runs: AutomationRow[] }) {
  const [contest, setContest] = useState("");
  const [digits, setDigits] = useState(5);
  const [assemblyId, setAssemblyId] = useState(assemblies[0]?.value ?? "");
  const report = useEngineAction();
  const [reportLines, setReportLines] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Resultado oficial" subtitle="Coleta da API pública da CAIXA. Entra como PENDENTE, com conteúdo bruto guardado — a verificação continua humana.">
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Concurso (vazio = último)">
                <Input value={contest} onChange={(e) => setContest(e.target.value)} inputMode="numeric" />
              </Field>
              <Field label="Algarismos por prêmio" hint="A API publica 6 posições; o zero à esquerda é removido e registrado.">
                <Input type="number" min={3} max={8} value={digits} onChange={(e) => setDigits(Number(e.target.value) || 5)} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton label="Coletar da fonte oficial" action={() => fetchLotteryFromOfficialSource(contest, digits)} />
              <ActionButton label="Conferir resultados verificados" variant="outline" action={() => crossCheckLotterySources()} />
            </div>
          </div>
        </Section>

        <Section title="Monitoramento e assembleias" subtitle="Varredura completa (reproduz todos os cálculos) e preparação automática até a apuração. Homologação é sempre humana.">
          <div className="space-y-3">
            <ActionButton label="Executar varredura agora" action={() => runMonitoringScanAction()} />
            {assemblies.length ? (
              <>
                <Field label="Assembleia">
                  <NativeSelect value={assemblyId} onChange={setAssemblyId} options={assemblies} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    label="Preparar e apurar automaticamente"
                    confirm="Avança a assembleia enquanto os insumos forem inequívocos e executa a apuração. Para na primeira ambiguidade. Não homologa."
                    action={() => autoPrepareAssembly(assemblyId)}
                  />
                  <Button size="sm" variant="outline" disabled={report.pending} onClick={() => report.execute(() => generateInternalReport(assemblyId), (r) => setReportLines(r.data?.lines ?? []))}>
                    {report.pending ? "Gerando…" : "Relatório interno"}
                  </Button>
                </div>
                <Feedback errors={report.errors} />
                {reportLines.length ? (
                  <div className="space-y-1 rounded-xl border border-black/10 bg-black/5 p-3 text-xs">
                    {reportLines.map((l, i) => (
                      <p key={i} className={i === 0 ? "font-bold" : ""}>
                        {l}
                      </p>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </Section>
      </div>

      <Section title="Log de automações" subtitle="Toda automação fica registrada — imutável.">
        {runs.length === 0 ? (
          <EmptyState>Nenhuma automação executada.</EmptyState>
        ) : (
          <div className="space-y-2">
            {runs.map((r) => (
              <div key={r.id} className="rounded-xl border border-black/10 px-3 py-2 text-sm transition-colors hover:bg-black/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{JOB_LABEL[r.job] ?? r.job}</p>
                  <StatusBadge status={r.status === "SUCCESS" ? "COMPLETED" : r.status === "FAILED" ? "INVALID" : "PENDING"} label={STATUS_LABEL[r.status]} />
                </div>
                <p className="text-xs">{r.summary}</p>
                <p className="text-[11px] text-card-beige-muted-foreground">
                  {new Date(r.startedAt).toLocaleString("pt-BR")} · {TRIGGER_LABEL[r.triggerKind] ?? r.triggerKind} · {r.createdByName ?? "sistema"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
