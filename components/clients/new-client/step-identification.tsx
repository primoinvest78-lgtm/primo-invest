"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  MoneyField,
  SectionTitle,
  SelectField,
  TextField,
  toOptions,
} from "@/components/clients/new-client/fields";
import { patchGroup, type StepProps } from "@/components/clients/new-client/types";
import {
  FUNDS_ORIGIN_OPTIONS,
  hasSpouseByMaritalStatus,
  ID_DOCUMENT_TYPES,
  MARITAL_STATUS_OPTIONS,
  maskCnpj,
  maskCpf,
  maskCpfOrCnpj,
  maskMoney,
  maskPhone,
  newId,
  SEX_OPTIONS,
  UF_OPTIONS,
  type MaritalStatus,
  type Partner,
} from "@/lib/utils/client-registration";

export function StepIdentification(props: StepProps) {
  return props.state.personType === "pf" ? <PersonIdentification {...props} /> : <CompanyIdentification {...props} />;
}

function PersonIdentification({ state, setState, errors }: StepProps) {
  const pf = state.pf;
  const set = (patch: Partial<typeof pf>) => patchGroup(setState, "pf", patch);

  function setMarital(value: string) {
    const maritalStatus = value as MaritalStatus;
    setState((prev) => ({
      ...prev,
      pf: { ...prev.pf, maritalStatus },
      // Casado/união estável já abre o bloco de cônjuge na etapa Família.
      family: { ...prev.family, hasSpouse: hasSpouseByMaritalStatus(maritalStatus) || (prev.family.hasSpouse && !!prev.family.spouse.name) },
    }));
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <SectionTitle title="Dados pessoais" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="pf-nome" label="Nome completo" required value={pf.fullName} onChange={(v) => set({ fullName: v })} error={errors["pf.fullName"]} autoComplete="name" className="sm:col-span-2" />
          <TextField id="pf-nome-social" label="Nome social" value={pf.socialName} onChange={(v) => set({ socialName: v })} hint="Como o cliente prefere ser chamado." />
          <TextField id="pf-cpf" label="CPF" required value={pf.cpf} onChange={(v) => set({ cpf: v })} mask={maskCpf} inputMode="numeric" placeholder="000.000.000-00" error={errors["pf.cpf"]} />
          <TextField id="pf-nascimento" label="Data de nascimento" required type="date" value={pf.birthDate} onChange={(v) => set({ birthDate: v })} error={errors["pf.birthDate"]} />
          <SelectField id="pf-sexo" label="Sexo" value={pf.sex} onChange={(v) => set({ sex: v })} options={toOptions(SEX_OPTIONS)} />
          <TextField id="pf-nacionalidade" label="Nacionalidade" value={pf.nationality} onChange={(v) => set({ nationality: v })} />
          <TextField id="pf-naturalidade" label="Naturalidade" value={pf.birthplace} onChange={(v) => set({ birthplace: v })} placeholder="Cidade/UF de nascimento" />
          <SelectField id="pf-estado-civil" label="Estado civil" required value={pf.maritalStatus} onChange={setMarital} options={MARITAL_STATUS_OPTIONS} error={errors["pf.maritalStatus"]} />
          <TextField id="pf-profissao" label="Profissão" value={pf.profession} onChange={(v) => set({ profession: v })} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Documento de identificação" description="RG, CNH, passaporte ou outro documento oficial com foto." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField id="pf-doc-tipo" label="Tipo de documento" value={pf.idDocType} onChange={(v) => set({ idDocType: v })} options={toOptions(ID_DOCUMENT_TYPES)} />
          <TextField id="pf-doc-numero" label="Número" value={pf.idDocNumber} onChange={(v) => set({ idDocNumber: v })} />
          <TextField id="pf-doc-orgao" label="Órgão emissor" value={pf.idDocIssuer} onChange={(v) => set({ idDocIssuer: v.toUpperCase() })} placeholder="SSP, DETRAN, PF..." />
          <SelectField id="pf-doc-uf" label="UF" value={pf.idDocUf} onChange={(v) => set({ idDocUf: v })} options={toOptions(UF_OPTIONS)} />
          <TextField id="pf-doc-emissao" label="Data de emissão" type="date" value={pf.idDocIssueDate} onChange={(v) => set({ idDocIssueDate: v })} error={errors["pf.idDocIssueDate"]} />
        </div>
      </section>
    </div>
  );
}

function CompanyIdentification({ state, setState, errors }: StepProps) {
  const pj = state.pj;
  const set = (patch: Partial<typeof pj>) => patchGroup(setState, "pj", patch);

  function updatePartner(id: string, patch: Partial<Partner>) {
    set({ partners: pj.partners.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <SectionTitle title="Dados da empresa" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="pj-razao" label="Razão social" required value={pj.legalName} onChange={(v) => set({ legalName: v })} error={errors["pj.legalName"]} className="sm:col-span-2" />
          <TextField id="pj-fantasia" label="Nome fantasia" value={pj.tradeName} onChange={(v) => set({ tradeName: v })} />
          <TextField id="pj-cnpj" label="CNPJ" required value={pj.cnpj} onChange={(v) => set({ cnpj: v })} mask={maskCnpj} inputMode="numeric" placeholder="00.000.000/0000-00" error={errors["pj.cnpj"]} />
          <TextField id="pj-constituicao" label="Data de constituição" type="date" value={pj.foundationDate} onChange={(v) => set({ foundationDate: v })} error={errors["pj.foundationDate"]} />
          <TextField id="pj-natureza" label="Natureza jurídica" value={pj.legalNature} onChange={(v) => set({ legalNature: v })} placeholder="Ex.: Sociedade Limitada" />
          <TextField id="pj-cnae" label="CNAE" value={pj.cnae} onChange={(v) => set({ cnae: v })} placeholder="0000-0/00" />
          <TextField id="pj-atividade" label="Atividade principal" value={pj.mainActivity} onChange={(v) => set({ mainActivity: v })} />
          <TextField id="pj-site" label="Site" value={pj.website} onChange={(v) => set({ website: v })} inputMode="url" placeholder="www.empresa.com.br" error={errors["pj.website"]} />
          <MoneyField id="pj-faturamento" label="Faturamento anual" value={pj.revenue} onChange={(v) => set({ revenue: v })} mask={maskMoney} />
          <MoneyField id="pj-patrimonio" label="Patrimônio" value={pj.netWorth} onChange={(v) => set({ netWorth: v })} mask={maskMoney} />
          <SelectField id="pj-fonte" label="Fonte dos recursos" value={pj.fundsOrigin} onChange={(v) => set({ fundsOrigin: v })} options={toOptions(FUNDS_ORIGIN_OPTIONS)} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Representante legal" description="Pessoa que responde pela empresa neste relacionamento." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField id="pj-rep-nome" label="Nome" required value={pj.repName} onChange={(v) => set({ repName: v })} error={errors["pj.repName"]} />
          <TextField id="pj-rep-cpf" label="CPF" required value={pj.repCpf} onChange={(v) => set({ repCpf: v })} mask={maskCpf} inputMode="numeric" error={errors["pj.repCpf"]} />
          <TextField id="pj-rep-cargo" label="Cargo" value={pj.repRole} onChange={(v) => set({ repRole: v })} />
          <TextField id="pj-rep-email" label="E-mail" value={pj.repEmail} onChange={(v) => set({ repEmail: v })} inputMode="email" error={errors["pj.repEmail"]} />
          <TextField id="pj-rep-telefone" label="Telefone" value={pj.repPhone} onChange={(v) => set({ repPhone: v })} mask={maskPhone} inputMode="tel" error={errors["pj.repPhone"]} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle
          title="Sócios e beneficiários"
          description="Quadro societário e beneficiários finais, quando aplicável."
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => set({ partners: [...pj.partners, { id: newId(), name: "", document: "", share: "", role: "" }] })}
            >
              <Plus aria-hidden /> Adicionar sócio
            </Button>
          }
        />
        {pj.partners.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/15 px-4 py-5 text-center text-xs text-card-beige-muted-foreground">
            Nenhum sócio adicionado.
          </p>
        ) : (
          <div className="space-y-3">
            {pj.partners.map((partner, index) => (
              <div key={partner.id} className="rounded-xl border border-black/10 bg-card/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground">Sócio {index + 1}</p>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remover sócio ${index + 1}`}
                    onClick={() => set({ partners: pj.partners.filter((p) => p.id !== partner.id) })}
                  >
                    <Trash2 className="text-destructive" aria-hidden />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <TextField id={`socio-${partner.id}-nome`} label="Nome" required value={partner.name} onChange={(v) => updatePartner(partner.id, { name: v })} error={errors[`partner.${partner.id}.name`]} className="sm:col-span-2" />
                  <TextField id={`socio-${partner.id}-doc`} label="CPF/CNPJ" value={partner.document} onChange={(v) => updatePartner(partner.id, { document: v })} mask={maskCpfOrCnpj} inputMode="numeric" error={errors[`partner.${partner.id}.document`]} />
                  <TextField id={`socio-${partner.id}-part`} label="Participação (%)" value={partner.share} onChange={(v) => updatePartner(partner.id, { share: v.replace(/[^\d,.]/g, "") })} inputMode="decimal" error={errors[`partner.${partner.id}.share`]} />
                  <TextField id={`socio-${partner.id}-cargo`} label="Cargo" value={partner.role} onChange={(v) => updatePartner(partner.id, { role: v })} className="sm:col-span-2" />
                </div>
              </div>
            ))}
            {errors["pj.partners"] ? <p className="text-xs font-medium text-destructive">{errors["pj.partners"]}</p> : null}
          </div>
        )}
      </section>
    </div>
  );
}
