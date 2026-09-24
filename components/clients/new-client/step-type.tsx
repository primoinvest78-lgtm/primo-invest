"use client";

import { Building2, Check, UserRound } from "lucide-react";
import { cn } from "cn";

import { SectionTitle } from "@/components/clients/new-client/fields";
import type { StepProps } from "@/components/clients/new-client/types";
import {
  buildDocumentChecklist,
  RELATIONSHIP_TYPES,
  type PersonType,
} from "@/lib/utils/client-registration";

const PERSON_OPTIONS: { value: PersonType; title: string; description: string; icon: typeof UserRound }[] = [
  {
    value: "pf",
    title: "Pessoa Física",
    description: "Indivíduo identificado por CPF — investidor, consorciado ou cliente de relacionamento.",
    icon: UserRound,
  },
  {
    value: "pj",
    title: "Pessoa Jurídica",
    description: "Empresa identificada por CNPJ, com representante legal e quadro societário.",
    icon: Building2,
  },
];

export function StepType({ state, setState, errors }: StepProps) {
  function selectPerson(personType: PersonType) {
    if (personType === state.personType) return;
    // Troca de tipo refaz a lista de documentos (PF e PJ têm exigências diferentes).
    setState((prev) => ({ ...prev, personType, documents: buildDocumentChecklist(personType) }));
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle title="Tipo de cliente" description="Define os campos e a documentação das próximas etapas." />
        <div role="radiogroup" aria-label="Tipo de cliente" className="grid gap-3 sm:grid-cols-2">
          {PERSON_OPTIONS.map((option) => {
            const active = state.personType === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => selectPerson(option.value)}
                className={cn(
                  "group relative flex items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 hover:-translate-y-0.5",
                  active
                    ? "border-primary bg-primary/[0.06] shadow-[0_0_0_1px_var(--primary),0_10px_24px_-12px_rgba(17,5,217,0.45)]"
                    : "border-black/10 bg-card hover:border-primary/50 hover:shadow-md",
                )}
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                    active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-foreground">{option.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-card-beige-muted-foreground">
                    {option.description}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-black/20",
                  )}
                >
                  {active ? <Check className="size-3" aria-hidden /> : null}
                </span>
              </button>
            );
          })}
        </div>
        {errors.personType ? <p className="text-xs font-medium text-destructive">{errors.personType}</p> : null}
      </section>

      <section className="space-y-3">
        <SectionTitle
          title="Tipo de relacionamento"
          description="Pode evoluir depois — um prospect vira cliente, um cliente passa a ser consorciado ou investidor."
        />
        <div role="radiogroup" aria-label="Tipo de relacionamento" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {RELATIONSHIP_TYPES.map((option) => {
            const active = state.relationshipType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setState((prev) => ({ ...prev, relationshipType: option.value }))}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-black/10 bg-card text-foreground hover:border-primary/50",
                )}
              >
                {option.label}
                {active ? <Check className="size-4 shrink-0" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-card-beige-muted-foreground">
          {state.relationshipType === "prospect"
            ? "O cadastro entra com status “Prospect” e não conta como carteira ativa."
            : "O cadastro entra como cliente ativo, com as marcações de relacionamento escolhidas."}
        </p>
      </section>
    </div>
  );
}
