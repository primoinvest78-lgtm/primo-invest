"use client";

import { Info } from "lucide-react";

import {
  ChipGroup,
  MoneyField,
  SectionTitle,
  SelectField,
  TextAreaField,
  TextField,
  toOptions,
} from "@/components/clients/new-client/fields";
import { patchGroup, type StepProps } from "@/components/clients/new-client/types";
import {
  FUNDS_ORIGIN_OPTIONS,
  INCOME_SOURCE_OPTIONS,
  maskCnpj,
  maskMoney,
  PROFESSIONAL_STATUS_OPTIONS,
  RISK_CLASSIFICATION_OPTIONS,
} from "@/lib/utils/client-registration";

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function StepProfile({ state, setState, errors }: StepProps) {
  const p = state.profile;
  const c = state.compliance;
  const isPf = state.personType === "pf";
  const set = (patch: Partial<typeof p>) => patchGroup(setState, "profile", patch);
  const setCompliance = (patch: Partial<typeof c>) => patchGroup(setState, "compliance", patch);

  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-xl border border-primary/25 bg-primary/[0.05] px-4 py-3 text-xs leading-relaxed text-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>
          Perfil cadastral inicial, informado pelo cliente. <strong>Não é análise de crédito</strong> — a aptidão para
          operações específicas é avaliada em fluxo próprio, quando houver uma operação.
        </p>
      </div>

      {isPf ? (
        <section className="space-y-4">
          <SectionTitle title="Perfil profissional" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField id="perfil-situacao" label="Situação profissional" value={p.professionalStatus} onChange={(v) => set({ professionalStatus: v })} options={toOptions(PROFESSIONAL_STATUS_OPTIONS)} />
            <TextField id="perfil-empresa" label="Empresa" value={p.company} onChange={(v) => set({ company: v })} />
            <TextField id="perfil-cnpj" label="CNPJ da empresa" value={p.companyCnpj} onChange={(v) => set({ companyCnpj: v })} mask={maskCnpj} inputMode="numeric" error={errors["profile.companyCnpj"]} />
            <TextField id="perfil-cargo" label="Cargo" value={p.role} onChange={(v) => set({ role: v })} />
            <TextField id="perfil-tempo" label="Tempo de atividade" value={p.activityTime} onChange={(v) => set({ activityTime: v })} placeholder="Ex.: 5 anos" />
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionTitle title="Perfil financeiro" description={isPf ? "Valores mensais, exceto patrimônio." : "Faturamento e patrimônio da empresa foram informados na identificação."} />
        {isPf ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MoneyField id="perfil-renda" label="Renda mensal" value={p.monthlyIncome} onChange={(v) => set({ monthlyIncome: v })} mask={maskMoney} />
            <MoneyField id="perfil-outras" label="Outras rendas" value={p.otherIncome} onChange={(v) => set({ otherIncome: v })} mask={maskMoney} />
            <MoneyField id="perfil-familiar" label="Renda familiar" value={p.familyIncome} onChange={(v) => set({ familyIncome: v })} mask={maskMoney} />
            <MoneyField id="perfil-patrimonio" label="Patrimônio estimado" value={p.estimatedNetWorth} onChange={(v) => set({ estimatedNetWorth: v })} mask={maskMoney} />
          </div>
        ) : null}
        <ChipGroup label="Fonte de renda" options={INCOME_SOURCE_OPTIONS} selected={p.incomeSources} onToggle={(v) => set({ incomeSources: toggle(p.incomeSources, v) })} />
        {isPf ? (
          <ChipGroup label="Fonte dos recursos" options={FUNDS_ORIGIN_OPTIONS} selected={p.fundsOrigins} onToggle={(v) => set({ fundsOrigins: toggle(p.fundsOrigins, v) })} hint="Origem dos recursos que o cliente pretende movimentar." />
        ) : null}
      </section>

      <section className="space-y-4">
        <SectionTitle title="Conformidade" description="Uso interno da casa. Pode ser completado pela área de conformidade depois." />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField id="compliance-risco" label="Classificação de risco" value={c.riskClassification} onChange={(v) => setCompliance({ riskClassification: v })} options={toOptions(RISK_CLASSIFICATION_OPTIONS)} />
          <TextField id="compliance-beneficiario" label="Beneficiário final" value={c.beneficialOwner} onChange={(v) => setCompliance({ beneficialOwner: v })} hint={isPf ? "Quando os recursos pertencerem a terceiro." : "Pessoa física que controla a empresa, quando aplicável."} />
          <TextAreaField id="compliance-origem" label="Origem dos recursos (detalhe)" value={c.fundsOriginDetail} onChange={(v) => setCompliance({ fundsOriginDetail: v })} />
          <TextAreaField id="compliance-obs" label="Observações de conformidade" value={c.notes} onChange={(v) => setCompliance({ notes: v })} />
        </div>
      </section>
    </div>
  );
}
