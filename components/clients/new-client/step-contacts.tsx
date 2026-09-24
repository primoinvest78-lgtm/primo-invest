"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

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
  EXTRA_CONTACT_TYPES,
  maskCep,
  maskPhone,
  newId,
  onlyDigits,
  RESIDENCE_TYPES,
  UF_OPTIONS,
  type ExtraContact,
} from "@/lib/utils/client-registration";

type CepStatus = "idle" | "loading" | "found" | "not_found";

export function StepContacts({ state, setState, errors }: StepProps) {
  const { contact, address } = state;
  const isPf = state.personType === "pf";
  const setContact = (patch: Partial<typeof contact>) => patchGroup(setState, "contact", patch);
  const setAddress = (patch: Partial<typeof address>) => patchGroup(setState, "address", patch);
  const [cepStatus, setCepStatus] = useState<CepStatus>("idle");

  /** Preenche o endereço pelo CEP (ViaCEP, serviço público). Falha silenciosa: o preenchimento manual continua. */
  async function lookupCep(value: string) {
    const cep = onlyDigits(value);
    if (cep.length !== 8) return;
    setCepStatus("loading");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) {
        setCepStatus("not_found");
        return;
      }
      setState((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          street: data.logradouro || prev.address.street,
          neighborhood: data.bairro || prev.address.neighborhood,
          city: data.localidade || prev.address.city,
          state: data.uf || prev.address.state,
          country: "Brasil",
        },
      }));
      setCepStatus("found");
    } catch {
      setCepStatus("idle");
    }
  }

  function updateExtra(id: string, patch: Partial<ExtraContact>) {
    setState((prev) => ({
      ...prev,
      extraContacts: prev.extraContacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  const cepHint =
    cepStatus === "found"
      ? "Endereço localizado — confira e complete."
      : cepStatus === "not_found"
        ? "CEP não localizado. Preencha o endereço manualmente."
        : "Digite o CEP para preencher o endereço automaticamente.";

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <SectionTitle title="Contato principal" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField id="contato-email" label="E-mail" required value={contact.email} onChange={(v) => setContact({ email: v.trim() })} inputMode="email" autoComplete="email" error={errors["contact.email"]} />
          <TextField id="contato-celular" label={isPf ? "Celular" : "Telefone"} required value={contact.mobile} onChange={(v) => setContact({ mobile: v })} mask={maskPhone} inputMode="tel" placeholder="(00) 00000-0000" error={errors["contact.mobile"]} />
          {!contact.whatsappSameAsMobile ? (
            <TextField id="contato-whatsapp" label="WhatsApp" value={contact.whatsapp} onChange={(v) => setContact({ whatsapp: v })} mask={maskPhone} inputMode="tel" error={errors["contact.whatsapp"]} />
          ) : null}
        </div>
        <Toggle
          id="contato-whatsapp-igual"
          checked={contact.whatsappSameAsMobile}
          onChange={(checked) => setContact({ whatsappSameAsMobile: checked })}
          label={`WhatsApp é o mesmo número do ${isPf ? "celular" : "telefone"}`}
        />
      </section>

      <section className="space-y-4">
        <SectionTitle title={isPf ? "Endereço residencial" : "Endereço da empresa"} description="Endereço comercial adicional pode ser registrado depois, no perfil do cliente." />
        <div className="grid gap-4 sm:grid-cols-6">
          <div className="relative sm:col-span-2">
            <TextField
              id="endereco-cep"
              label="CEP"
              required
              value={address.postalCode}
              onChange={(v) => {
                setAddress({ postalCode: v });
                if (onlyDigits(v).length === 8) void lookupCep(v);
                else setCepStatus("idle");
              }}
              mask={maskCep}
              inputMode="numeric"
              placeholder="00000-000"
              hint={cepHint}
              error={errors["address.postalCode"]}
            />
            {cepStatus === "loading" ? (
              <Loader2 className="absolute right-2.5 top-[30px] size-4 animate-spin text-primary" aria-label="Buscando CEP" />
            ) : null}
          </div>
          <TextField id="endereco-logradouro" label="Logradouro" required value={address.street} onChange={(v) => setAddress({ street: v })} error={errors["address.street"]} className="sm:col-span-4" />
          <TextField id="endereco-numero" label="Número" required value={address.number} onChange={(v) => setAddress({ number: v })} error={errors["address.number"]} className="sm:col-span-2" />
          <TextField id="endereco-complemento" label="Complemento" value={address.complement} onChange={(v) => setAddress({ complement: v })} className="sm:col-span-2" />
          <TextField id="endereco-bairro" label="Bairro" required value={address.neighborhood} onChange={(v) => setAddress({ neighborhood: v })} error={errors["address.neighborhood"]} className="sm:col-span-2" />
          <TextField id="endereco-cidade" label="Cidade" required value={address.city} onChange={(v) => setAddress({ city: v })} error={errors["address.city"]} className="sm:col-span-3" />
          <SelectField id="endereco-uf" label="Estado" required value={address.state} onChange={(v) => setAddress({ state: v })} options={toOptions(UF_OPTIONS)} error={errors["address.state"]} className="sm:col-span-1" placeholder="UF" />
          <TextField id="endereco-pais" label="País" required value={address.country} onChange={(v) => setAddress({ country: v })} error={errors["address.country"]} className="sm:col-span-2" />
          {isPf ? (
            <SelectField id="endereco-residencia" label="Tipo de residência" value={address.residenceType} onChange={(v) => setAddress({ residenceType: v })} options={toOptions(RESIDENCE_TYPES)} className="sm:col-span-3" />
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle
          title="Contatos adicionais"
          description="Telefone fixo, e-mail secundário, contato de secretária etc."
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  extraContacts: [...prev.extraContacts, { id: newId(), type: "phone", value: "", label: "", notes: "" }],
                }))
              }
            >
              <Plus aria-hidden /> Adicionar contato
            </Button>
          }
        />
        {state.extraContacts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/15 px-4 py-5 text-center text-xs text-card-beige-muted-foreground">
            Nenhum contato adicional.
          </p>
        ) : (
          <div className="space-y-3">
            {state.extraContacts.map((extra, index) => (
              <div key={extra.id} className="grid items-start gap-3 rounded-xl border border-black/10 bg-card/60 p-3 sm:grid-cols-[150px_1fr_1fr_1fr_auto]">
                <SelectField
                  id={`extra-${extra.id}-tipo`}
                  label="Tipo"
                  value={extra.type}
                  onChange={(v) => updateExtra(extra.id, { type: v || "phone", value: "" })}
                  options={EXTRA_CONTACT_TYPES}
                />
                <TextField
                  id={`extra-${extra.id}-valor`}
                  label={extra.type === "email" ? "E-mail" : "Número"}
                  required
                  value={extra.value}
                  onChange={(v) => updateExtra(extra.id, { value: v })}
                  mask={extra.type === "email" ? undefined : maskPhone}
                  inputMode={extra.type === "email" ? "email" : "tel"}
                  error={errors[`extra.${extra.id}.value`]}
                />
                <TextField id={`extra-${extra.id}-rotulo`} label="Identificação" value={extra.label} onChange={(v) => updateExtra(extra.id, { label: v })} placeholder="Ex.: Comercial, Secretária" />
                <TextField id={`extra-${extra.id}-obs`} label="Observação" value={extra.notes} onChange={(v) => updateExtra(extra.id, { notes: v })} />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="sm:mt-6"
                  aria-label={`Remover contato ${index + 1}`}
                  onClick={() => setState((prev) => ({ ...prev, extraContacts: prev.extraContacts.filter((c) => c.id !== extra.id) }))}
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
