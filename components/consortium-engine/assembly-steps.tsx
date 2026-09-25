"use client";

import { useState, type FormEvent } from "react";

import { ActionButton, Feedback, Field, NativeSelect, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  attachBidsToAssembly,
  executeAssemblyBids,
  executeAssemblyDraw,
  homologateAssembly,
  lockAssembly,
  lockAssemblyEligibility,
  lockAssemblyLottery,
  prepareAssemblyDraw,
  sendAssemblyToHomologation,
  startAssemblyPreparation,
} from "@/lib/actions/consortium-engine";
import { BID_TYPE_LABEL, formatQuota } from "@/lib/consortium-engine/labels.ts";
import type { EngineAssembly, EngineGroup, EngineLotteryResult, EngineRule } from "@/lib/data/consortium-engine";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

type Attachable = { id: string; quotaNumber: number; bidType: string; bidPercentage: number | null; bidAmount: number | null; embeddedAmount: number | null; bidDate: string };

const BID_WORD: Record<string, string> = { livre: "FREE_BID", fixo: "FIXED_BID", embutido: "EMBEDDED_BID" };

function ResourcesForm({ assembly, group }: { assembly: EngineAssembly; group: EngineGroup }) {
  const { pending, errors, message, execute } = useEngineAction();
  const numOrNull = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : Number(s);
  };
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    execute(() =>
      prepareAssemblyDraw(assembly.id, {
        commonFundBalance: numOrNull(f.get("common")),
        reserveFundBalance: numOrNull(f.get("reserve")),
        reserveFundUsable: f.get("reserveUsable") === "on",
        creditAmount: numOrNull(f.get("credit")),
        plannedDrawContemplations: Number(f.get("planned") ?? 1),
      }),
    );
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Saldo do fundo comum" hint="Recursos disponíveis para contemplação.">
          <Input name="common" type="number" step="0.01" defaultValue={assembly.commonFundBalance ?? ""} required />
        </Field>
        <Field label="Valor do crédito">
          <Input name="credit" type="number" step="0.01" defaultValue={assembly.creditAmount ?? group.creditAmount ?? ""} required />
        </Field>
        <Field label="Fundo de reserva">
          <Input name="reserve" type="number" step="0.01" defaultValue={assembly.reserveFundBalance ?? ""} />
        </Field>
        <Field label="Contemplações previstas">
          <Input name="planned" type="number" min={0} defaultValue={assembly.plannedDrawContemplations} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="reserveUsable" defaultChecked={assembly.reserveFundUsable} /> Usar fundo de reserva nesta assembleia (só vale se a regra permitir)
      </label>
      <p className="text-xs text-card-beige-muted-foreground">
        Ao preparar, a regra (com hash) e os recursos ficam congelados. A quantidade de contemplações sai de recursos ÷ crédito, limitada
        ao previsto.
      </p>
      <Feedback errors={errors} message={message} />
      <Button type="submit" disabled={pending}>
        {pending ? "Congelando…" : "Congelar regra e recursos"}
      </Button>
    </form>
  );
}

function AttachBids({ assemblyId, attachable, digits }: { assemblyId: string; attachable: Attachable[]; digits: number }) {
  const [selected, setSelected] = useState<string[]>([]);
  const { pending, errors, message, execute } = useEngineAction();
  if (attachable.length === 0) return <p className="text-xs text-card-beige-muted-foreground">Nenhum lance em aberto de cotas deste grupo.</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold">Lances em aberto (módulo Lances) de cotas deste grupo:</p>
      {attachable.map((b) => (
        <label key={b.id} className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-1.5 text-sm transition-colors hover:bg-black/5">
          <input
            type="checkbox"
            checked={selected.includes(b.id)}
            onChange={(e) => setSelected((s) => (e.target.checked ? [...s, b.id] : s.filter((x) => x !== b.id)))}
          />
          Cota {formatQuota(b.quotaNumber, digits)} · {BID_TYPE_LABEL[BID_WORD[b.bidType] ?? ""] ?? b.bidType} ·{" "}
          {b.bidPercentage !== null ? `${b.bidPercentage}%` : b.bidAmount !== null ? formatCurrencyBRL(b.bidAmount) : "—"}
          {b.embeddedAmount ? ` · embutido ${formatCurrencyBRL(b.embeddedAmount)}` : ""} · {formatDate(b.bidDate)}
        </label>
      ))}
      <Button size="sm" variant="outline" disabled={pending || selected.length === 0} onClick={() => execute(() => attachBidsToAssembly(assemblyId, selected), () => setSelected([]))}>
        Vincular à assembleia
      </Button>
      <Feedback errors={errors} message={message} />
    </div>
  );
}

export function AssemblySteps({
  assembly,
  group,
  canGovern,
  publishedRules,
  verifiedLottery,
  attachable,
  bidsCount,
  bidsEnabled,
  ruleSource,
}: {
  assembly: EngineAssembly;
  group: EngineGroup;
  canGovern: boolean;
  publishedRules: EngineRule[];
  verifiedLottery: EngineLotteryResult[];
  attachable: Attachable[];
  bidsCount: number;
  bidsEnabled: boolean;
  ruleSource: string | null;
}) {
  const [ruleId, setRuleId] = useState(publishedRules[0]?.id ?? "");
  const [lotteryId, setLotteryId] = useState(verifiedLottery[0]?.id ?? "");
  const s = assembly.status;
  const d = group.numbering.displayDigits;

  switch (s) {
    case "SCHEDULED":
      return <ActionButton label="Iniciar preparação" action={() => startAssemblyPreparation(assembly.id)} />;
    case "PREPARING":
      return publishedRules.length === 0 ? (
        <p className="text-sm text-amber-700">
          Nenhuma regra PUBLICADA para {group.administratorName}. Cadastre e publique a regra do regulamento antes de continuar.
        </p>
      ) : (
        <div className="space-y-3">
          <Field label="Regra aplicável (publicada)">
            <NativeSelect
              value={ruleId}
              onChange={setRuleId}
              options={publishedRules.map((r) => ({ value: r.id, label: `${r.name} v${r.version} (${r.ruleKey})` }))}
            />
          </Field>
          <p className="text-xs text-card-beige-muted-foreground">
            Congela a situação de cada cota nesta data (ativa, adimplente, já contemplada, excluída). A apuração nunca usa o estado atual.
          </p>
          <ActionButton label="Travar elegibilidade" action={() => lockAssemblyEligibility(assembly.id, ruleId)} disabled={!ruleId} />
        </div>
      );
    case "ELIGIBILITY_LOCKED":
      if (ruleSource === "OWN_DRAW") {
        return (
          <p className="text-sm text-card-beige-muted-foreground">
            Esta regra usa <strong>sorteio próprio</strong>. Faça o sorteio no painel <strong>Roleta</strong>, logo abaixo. O resultado é travado nesta assembleia automaticamente.
          </p>
        );
      }
      return verifiedLottery.length === 0 ? (
        <p className="text-sm text-amber-700">Nenhum resultado oficial VERIFICADO. Importe e verifique o resultado na aba Resultado oficial.</p>
      ) : (
        <div className="space-y-3">
          <Field label="Resultado oficial (verificado)">
            <NativeSelect
              value={lotteryId}
              onChange={setLotteryId}
              options={verifiedLottery.map((l) => ({ value: l.id, label: `Concurso ${l.contestNumber} · ${formatDate(l.drawDate)} · ${l.prizes[0]}` }))}
            />
          </Field>
          <ActionButton label="Travar resultado oficial" action={() => lockAssemblyLottery(assembly.id, lotteryId)} disabled={!lotteryId} />
        </div>
      );
    case "LOTTERY_LOCKED":
      return <ResourcesForm assembly={assembly} group={group} />;
    case "DRAW_READY":
      return (
        <ActionButton
          label="Executar apuração do sorteio"
          confirm="Executar a apuração com a regra, o resultado oficial, a elegibilidade e os recursos congelados?"
          action={() => executeAssemblyDraw(assembly.id)}
        />
      );
    case "DRAW_COMPLETED":
      return (
        <div className="space-y-4">
          {bidsEnabled ? (
            <>
              <AttachBids assemblyId={assembly.id} attachable={attachable} digits={d} />
              <p className="text-xs">{bidsCount} lance(s) vinculado(s) a esta assembleia.</p>
              <ActionButton
                label="Apurar lances"
                confirm="Congelar os lances vinculados e apurar com os recursos restantes do sorteio?"
                action={() => executeAssemblyBids(assembly.id)}
              />
            </>
          ) : (
            <p className="text-xs text-card-beige-muted-foreground">A regra não prevê contemplação por lance.</p>
          )}
          {!bidsEnabled || bidsCount === 0 ? (
            <ActionButton label="Enviar para homologação" variant="outline" action={() => sendAssemblyToHomologation(assembly.id)} />
          ) : null}
        </div>
      );
    case "BID_PROCESSING":
      return <ActionButton label="Enviar para homologação" action={() => sendAssemblyToHomologation(assembly.id)} />;
    case "HOMOLOGATION":
    case "RETIFIED":
      return canGovern ? (
        <ActionButton
          label={s === "RETIFIED" ? "Homologar retificação" : "Homologar resultado"}
          confirm="Homologar as contemplações apuradas? Isso NÃO libera crédito — abre o direito ao crédito."
          action={() => homologateAssembly(assembly.id)}
        />
      ) : (
        <p className="text-sm">Aguardando homologação por governança (admin, gestor ou compliance).</p>
      );
    case "COMPLETED":
      return canGovern ? (
        <ActionButton label="Travar assembleia" variant="outline" confirm="Travar a assembleia? Depois disso, só retificação." action={() => lockAssembly(assembly.id)} />
      ) : (
        <p className="text-sm">Homologada.</p>
      );
    case "LOCKED":
      return <p className="text-sm">Assembleia travada. Qualquer correção segue pelo fluxo de retificação.</p>;
    default:
      return null;
  }
}
