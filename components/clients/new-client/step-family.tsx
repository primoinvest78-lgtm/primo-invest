"use client";

import { Building2, HeartHandshake, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SectionTitle,
  SelectField,
  TextField,
  toOptions,
  Toggle,
} from "@/components/clients/new-client/fields";
import { patchGroup, type StepProps } from "@/components/clients/new-client/types";
import {
  FAMILY_RELATIONSHIPS,
  maskCpf,
  maskPhone,
  newId,
  PROPERTY_REGIME_OPTIONS,
  type FamilyMember,
} from "@/lib/utils/client-registration";

export function StepFamily({ state, setState, errors }: StepProps) {
  if (state.personType === "pj") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/15 px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <Building2 className="size-5" aria-hidden />
        </span>
        <p className="text-sm font-bold text-foreground">Núcleo familiar não se aplica a pessoa jurídica</p>
        <p className="max-w-md text-xs text-card-beige-muted-foreground">
          Os vínculos da empresa (representante legal, sócios e beneficiários) foram registrados na etapa de
          identificação. Avance para a documentação.
        </p>
      </div>
    );
  }

  const { family } = state;
  const sp = family.spouse;
  const isStable = state.pf.maritalStatus === "uniao_estavel";
  const spouseLabel = isStable ? "Companheiro(a)" : "Cônjuge";
  const setSpouse = (patch: Partial<typeof sp>) =>
    patchGroup(setState, "family", { spouse: { ...sp, ...patch } });

  function updateMember(id: string, patch: Partial<FamilyMember>) {
    patchGroup(setState, "family", {
      members: family.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-card-beige-muted-foreground">
        Os membros formam o núcleo familiar do cliente. Quem já estiver cadastrado com o mesmo CPF é vinculado — sem
        criar cadastro duplicado.
      </p>

      <section className="space-y-4">
        <SectionTitle title={`${spouseLabel}`} />
        <Toggle
          id="familia-conjuge"
          checked={family.hasSpouse}
          onChange={(checked) => patchGroup(setState, "family", { hasSpouse: checked })}
          label={`Registrar cônjuge ou companheiro(a)`}
          description={
            state.pf.maritalStatus === "casado" || isStable
              ? "Sugerido pelo estado civil informado."
              : "Estado civil informado não indica cônjuge — ative só se aplicável."
          }
        />
        {family.hasSpouse ? (
          <div className="grid gap-4 rounded-xl border border-black/10 bg-card/60 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField id="conjuge-nome" label="Nome" required value={sp.name} onChange={(v) => setSpouse({ name: v })} error={errors["spouse.name"]} className="sm:col-span-2" />
            <TextField id="conjuge-cpf" label="CPF" value={sp.cpf} onChange={(v) => setSpouse({ cpf: v })} mask={maskCpf} inputMode="numeric" error={errors["spouse.cpf"]} />
            <TextField id="conjuge-nascimento" label="Data de nascimento" type="date" value={sp.birthDate} onChange={(v) => setSpouse({ birthDate: v })} error={errors["spouse.birthDate"]} />
            <TextField id="conjuge-profissao" label="Profissão" value={sp.profession} onChange={(v) => setSpouse({ profession: v })} />
            <TextField id="conjuge-telefone" label="Telefone" value={sp.phone} onChange={(v) => setSpouse({ phone: v })} mask={maskPhone} inputMode="tel" error={errors["spouse.phone"]} />
            <TextField id="conjuge-email" label="E-mail" value={sp.email} onChange={(v) => setSpouse({ email: v.trim() })} inputMode="email" error={errors["spouse.email"]} />
            {state.pf.maritalStatus === "casado" || isStable ? (
              <SelectField id="conjuge-regime" label="Regime de bens" value={sp.propertyRegime} onChange={(v) => setSpouse({ propertyRegime: v })} options={toOptions(PROPERTY_REGIME_OPTIONS)} className="sm:col-span-2" />
            ) : null}
            <div className="flex items-start gap-2 rounded-lg bg-secondary/[0.06] p-3 text-xs text-card-beige-muted-foreground sm:col-span-2 lg:col-span-3">
              <HeartHandshake className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {isStable
                ? "A declaração de união estável e o documento do(a) companheiro(a) já foram sugeridos na etapa Documentos."
                : "A certidão de casamento e o documento do cônjuge já foram sugeridos na etapa Documentos."}
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <SectionTitle
          title="Dependentes e outros membros"
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                patchGroup(setState, "family", {
                  members: [...family.members, { id: newId(), relationship: "", name: "", cpf: "", birthDate: "" }],
                })
              }
            >
              <Plus aria-hidden /> Adicionar membro
            </Button>
          }
        />
        {family.members.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/15 px-4 py-5 text-center text-xs text-card-beige-muted-foreground">
            Nenhum dependente ou membro adicionado.
          </p>
        ) : (
          <div className="space-y-3">
            {family.members.map((member, index) => (
              <div key={member.id} className="grid items-start gap-3 rounded-xl border border-black/10 bg-card/60 p-3 sm:grid-cols-[160px_1.5fr_1fr_1fr_auto]">
                <SelectField id={`membro-${member.id}-vinculo`} label="Vínculo" required value={member.relationship} onChange={(v) => updateMember(member.id, { relationship: v })} options={toOptions(FAMILY_RELATIONSHIPS)} error={errors[`member.${member.id}.relationship`]} />
                <TextField id={`membro-${member.id}-nome`} label="Nome" required value={member.name} onChange={(v) => updateMember(member.id, { name: v })} error={errors[`member.${member.id}.name`]} />
                <TextField id={`membro-${member.id}-cpf`} label="CPF" value={member.cpf} onChange={(v) => updateMember(member.id, { cpf: v })} mask={maskCpf} inputMode="numeric" error={errors[`member.${member.id}.cpf`]} />
                <TextField id={`membro-${member.id}-nascimento`} label="Nascimento" type="date" value={member.birthDate} onChange={(v) => updateMember(member.id, { birthDate: v })} error={errors[`member.${member.id}.birthDate`]} />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="sm:mt-6"
                  aria-label={`Remover membro ${index + 1}`}
                  onClick={() => patchGroup(setState, "family", { members: family.members.filter((m) => m.id !== member.id) })}
                >
                  <Trash2 className="text-destructive" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
