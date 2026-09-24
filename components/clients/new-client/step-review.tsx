"use client";

import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Pencil, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/clients/new-client/step-documents";
import type { StepProps } from "@/components/clients/new-client/types";
import type { DuplicateMatch } from "@/lib/actions/clients";
import {
  clientDisplayName,
  clientDocument,
  MARITAL_STATUS_OPTIONS,
  RELATIONSHIP_TYPES,
  softPendencies,
  STEPS,
  validateAll,
  type DocStatus,
} from "@/lib/utils/client-registration";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <dt className="shrink-0 text-xs text-card-beige-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

function Card({
  title,
  step,
  onEdit,
  index,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  index: number;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="rounded-xl border border-black/10 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <header className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-primary">{title}</h3>
        <Button type="button" size="xs" variant="ghost" onClick={() => onEdit(step)} aria-label={`Editar ${title.toLowerCase()}`}>
          <Pencil aria-hidden /> Editar
        </Button>
      </header>
      <dl className="divide-y divide-black/5">{children}</dl>
    </motion.section>
  );
}

export function StepReview({
  state,
  onEdit,
  duplicates,
}: StepProps & { onEdit: (step: number) => void; duplicates: DuplicateMatch[] }) {
  const isPf = state.personType === "pf";
  const blocking = validateAll(state);
  const soft = softPendencies(state);
  const relationship = RELATIONSHIP_TYPES.find((r) => r.value === state.relationshipType)?.label;
  const marital = MARITAL_STATUS_OPTIONS.find((m) => m.value === state.pf.maritalStatus)?.label;

  const included = state.documents.filter((d) => d.included);
  const effective = (status: DocStatus, hasFile: boolean): DocStatus => (hasFile && status === "pendente" ? "recebido" : status);
  const received = included.filter((d) => ["recebido", "em_validacao", "validado"].includes(effective(d.status, !!d.file)));
  const pending = included.filter((d) => effective(d.status, !!d.file) === "pendente");
  const conditional = state.documents.filter((d) => d.requirement !== "cadastro" && !d.included);

  const familyCount = (state.family.hasSpouse ? 1 : 0) + state.family.members.length;
  const ready = blocking.length === 0;
  const documentDuplicate = duplicates.some((d) => d.field === "documento");

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex items-start gap-3 rounded-xl border px-4 py-3",
          ready && !documentDuplicate
            ? "border-success/35 bg-success/[0.08]"
            : "border-destructive/30 bg-destructive/[0.06]",
        )}
        role="status"
      >
        {ready && !documentDuplicate ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
        ) : (
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
        )}
        <div className="min-w-0 text-sm">
          <p className="font-bold text-foreground">
            {documentDuplicate
              ? "CPF/CNPJ já cadastrado"
              : ready
                ? "Cadastro pronto para conclusão"
                : `Existem ${blocking.reduce((n, b) => n + Object.keys(b.errors).length, 0)} informações obrigatórias pendentes`}
          </p>
          {!ready ? (
            <ul className="mt-1 space-y-0.5 text-xs text-card-beige-muted-foreground">
              {blocking.map((b) => (
                <li key={b.step}>
                  <button type="button" className="font-semibold text-primary underline-offset-2 hover:underline" onClick={() => onEdit(b.step)}>
                    {STEPS[b.step].label}
                  </button>{" "}
                  — {Object.values(b.errors)[0]}
                </li>
              ))}
            </ul>
          ) : null}
          {duplicates.length > 0 ? (
            <ul className="mt-1 space-y-0.5 text-xs text-card-beige-muted-foreground">
              {duplicates.map((d) => (
                <li key={`${d.field}-${d.clientId}`}>
                  {d.field === "documento" ? "Mesmo CPF/CNPJ" : "Mesmo e-mail"} de{" "}
                  <a href={`/clientes/${d.clientId}`} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
                    {d.clientName}
                  </a>
                  {d.field === "email" ? " — permitido (ex.: e-mail compartilhado), confirme se é intencional." : "."}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </motion.div>

      {soft.length > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-warning/35 bg-warning/[0.08] px-4 py-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
          <div className="text-sm">
            <p className="font-bold text-foreground">
              {soft.length === 1 ? "1 informação complementar em aberto" : `${soft.length} informações complementares em aberto`}
            </p>
            <p className="text-xs text-card-beige-muted-foreground">Não impedem a conclusão — podem ser completadas no perfil do cliente.</p>
            <ul className="mt-1 list-inside list-disc text-xs text-card-beige-muted-foreground">
              {soft.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Identificação" step={1} onEdit={onEdit} index={0}>
          <Row label="Nome" value={clientDisplayName(state)} />
          <Row label={isPf ? "CPF" : "CNPJ"} value={clientDocument(state)} />
          <Row label="Tipo" value={isPf ? "Pessoa física" : "Pessoa jurídica"} />
          <Row label="Relacionamento" value={relationship} />
          {isPf ? <Row label="Estado civil" value={marital} /> : <Row label="Representante" value={state.pj.repName} />}
        </Card>
        <Card title="Contato" step={2} onEdit={onEdit} index={1}>
          <Row label="E-mail" value={state.contact.email} />
          <Row label={isPf ? "Celular" : "Telefone"} value={state.contact.mobile} />
          <Row label="WhatsApp" value={state.contact.whatsappSameAsMobile ? state.contact.mobile : state.contact.whatsapp} />
          <Row label="Contatos adicionais" value={state.extraContacts.length || "Nenhum"} />
        </Card>
        <Card title="Endereço" step={2} onEdit={onEdit} index={2}>
          <Row label="Cidade/Estado" value={state.address.city && `${state.address.city}/${state.address.state}`} />
          <Row label="Logradouro" value={state.address.street && `${state.address.street}, ${state.address.number}`} />
          <Row label="CEP" value={state.address.postalCode} />
        </Card>
        <Card title="Perfil" step={3} onEdit={onEdit} index={3}>
          {isPf ? <Row label="Profissão" value={state.pf.profession || state.profile.professionalStatus} /> : <Row label="Atividade" value={state.pj.mainActivity} />}
          <Row label={isPf ? "Renda mensal" : "Faturamento"} value={isPf ? state.profile.monthlyIncome && `R$ ${state.profile.monthlyIncome}` : state.pj.revenue && `R$ ${state.pj.revenue}`} />
          <Row label="Patrimônio" value={isPf ? state.profile.estimatedNetWorth && `R$ ${state.profile.estimatedNetWorth}` : state.pj.netWorth && `R$ ${state.pj.netWorth}`} />
          <Row label="Classificação de risco" value={state.compliance.riskClassification} />
        </Card>
        <Card title="Família" step={4} onEdit={onEdit} index={4}>
          {isPf ? (
            <>
              <Row label="Relacionamentos cadastrados" value={familyCount} />
              {state.family.hasSpouse ? <Row label={state.pf.maritalStatus === "uniao_estavel" ? "Companheiro(a)" : "Cônjuge"} value={state.family.spouse.name} /> : null}
              {state.family.members.map((m) => (
                <Row key={m.id} label={m.relationship || "Membro"} value={m.name} />
              ))}
            </>
          ) : (
            <Row label="Sócios/beneficiários" value={state.pj.partners.length} />
          )}
        </Card>
        <Card title="Documentos" step={5} onEdit={onEdit} index={5}>
          <Row label="Recebidos" value={received.length} />
          <Row label="Pendentes (serão solicitados)" value={pending.length} />
          <Row label="Condicionais não solicitados" value={conditional.length} />
          <div className="flex flex-wrap gap-1.5 pt-2">
            {included.slice(0, 6).map((d) => (
              <span key={d.key} className="inline-flex items-center gap-1 text-[11px] text-card-beige-muted-foreground">
                <StatusPill status={effective(d.status, !!d.file)} />
                <span className="max-w-[140px] truncate">{d.name}</span>
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
