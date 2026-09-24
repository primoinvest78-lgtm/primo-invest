"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  FileCheck2,
  FileClock,
  FileText,
  Paperclip,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  SectionTitle,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/clients/new-client/fields";
import type { StepProps } from "@/components/clients/new-client/types";
import {
  DOC_CATEGORIES,
  DOC_REQUIREMENT_LABEL,
  DOC_RESPONSIBLE_OPTIONS,
  DOC_STATUSES,
  isExpiredDate,
  newId,
  suggestedConditionalKeys,
  type DocItem,
  type DocRequirement,
  type DocStatus,
} from "@/lib/utils/client-registration";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx";

const STATUS_STYLE: Record<DocStatus, string> = {
  pendente: "bg-warning/15 text-warning ring-warning/30",
  recebido: "bg-primary/10 text-primary ring-primary/25",
  em_validacao: "bg-info/12 text-info ring-info/25",
  validado: "bg-success/15 text-success ring-success/30",
  rejeitado: "bg-destructive/10 text-destructive ring-destructive/25",
  expirado: "bg-destructive/10 text-destructive ring-destructive/25",
  dispensado: "bg-black/5 text-card-beige-muted-foreground ring-black/10",
};

const GROUPS: { key: string; title: string; description: string; match: (r: DocRequirement) => boolean }[] = [
  {
    key: "cadastro",
    title: "Obrigatórios para cadastro",
    description: "Exigência interna para concluir o cadastro. Podem ficar pendentes e ser solicitados ao cliente.",
    match: (r) => r === "cadastro",
  },
  {
    key: "condicional",
    title: "Condicionais",
    description: "Dependem do perfil (estado civil, cônjuge, renda). Não bloqueiam o cadastro.",
    match: (r) => r === "condicional",
  },
  {
    key: "futuro",
    title: "Para operações futuras e análise",
    description: "Normalmente solicitados quando houver uma operação ou análise específica. Marque só se já quiser pedir.",
    match: (r) => r === "operacao" || r === "analise",
  },
];

export function StatusPill({ status }: { status: DocStatus }) {
  const label = DOC_STATUSES.find((s) => s.value === status)?.label ?? status;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset", STATUS_STYLE[status])}>
      {label}
    </span>
  );
}

export function StepDocuments({ state, setState, errors }: StepProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const suggested = suggestedConditionalKeys(state);
  const docs = state.documents;

  function update(key: string, patch: Partial<DocItem>) {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.key === key ? { ...d, ...patch } : d)),
    }));
  }

  function addCustom() {
    const key = `avulso_${newId()}`;
    setState((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          key,
          name: "",
          category: "outros",
          type: "",
          requirement: "condicional",
          included: true,
          status: "pendente",
          expiresAt: "",
          submittedBy: "cliente",
          validatedBy: "backoffice",
          notes: "",
          file: null,
        },
      ],
    }));
    setExpanded(key);
  }

  const included = docs.filter((d) => d.included);
  const counters = DOC_CATEGORIES.map((c) => ({
    ...c,
    total: included.filter((d) => d.category === c.value).length,
    received: included.filter((d) => d.category === c.value && (d.file || ["recebido", "em_validacao", "validado"].includes(d.status))).length,
  })).filter((c) => c.total > 0);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {counters.map((c, i) => (
          <motion.div
            key={c.value}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-black/10 bg-card px-3 py-2.5 transition-shadow hover:shadow-md"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-card-beige-muted-foreground">{c.label}</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
              {c.received}
              <span className="text-xs font-semibold text-card-beige-muted-foreground">/{c.total}</span>
            </p>
          </motion.div>
        ))}
      </section>

      {GROUPS.map((group) => {
        const items = docs.filter((d) => group.match(d.requirement));
        if (items.length === 0) return null;
        return (
          <section key={group.key} className="space-y-3">
            <SectionTitle
              title={group.title}
              description={group.description}
              action={
                group.key === "condicional" ? (
                  <Button type="button" size="sm" variant="outline" onClick={addCustom}>
                    <Plus aria-hidden /> Outro documento
                  </Button>
                ) : undefined
              }
            />
            <ul className="space-y-2">
              {items.map((doc) => (
                <DocumentRow
                  key={doc.key}
                  doc={doc}
                  suggested={suggested.includes(doc.key)}
                  expanded={expanded === doc.key}
                  onToggleExpand={() => setExpanded((cur) => (cur === doc.key ? null : doc.key))}
                  onChange={(patch) => update(doc.key, patch)}
                  onRemove={
                    doc.key.startsWith("avulso_")
                      ? () => setState((prev) => ({ ...prev, documents: prev.documents.filter((d) => d.key !== doc.key) }))
                      : undefined
                  }
                  errors={errors}
                />
              ))}
            </ul>
          </section>
        );
      })}

      <p className="text-xs text-card-beige-muted-foreground">
        Cada documento marcado vira uma solicitação na Central de Documentos, vinculada ao cliente. Outros documentos
        podem ser solicitados a qualquer momento depois do cadastro.
      </p>
    </div>
  );
}

function DocumentRow({
  doc,
  suggested,
  expanded,
  onToggleExpand,
  onChange,
  onRemove,
  errors,
}: {
  doc: DocItem;
  suggested: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (patch: Partial<DocItem>) => void;
  onRemove?: () => void;
  errors: StepProps["errors"];
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const category = DOC_CATEGORIES.find((c) => c.value === doc.category)?.label;
  const effectiveStatus: DocStatus = doc.file && doc.status === "pendente" ? "recebido" : doc.status;
  const isCustom = doc.key.startsWith("avulso_");
  const locked = doc.requirement === "cadastro";
  const Icon = doc.file ? FileCheck2 : doc.included ? FileClock : FileText;

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setFileError("Arquivo acima de 15 MB.");
      return;
    }
    setFileError(null);
    onChange({ file, included: true });
  }

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl border transition-all duration-200",
        doc.included ? "border-black/10 bg-card shadow-sm hover:border-primary/40" : "border-dashed border-black/15 bg-transparent",
      )}
    >
      <div className="flex flex-wrap items-center gap-3 px-3 py-2.5 sm:flex-nowrap">
        <input
          type="checkbox"
          checked={doc.included}
          disabled={locked}
          onChange={(e) => onChange({ included: e.target.checked })}
          aria-label={`Solicitar ${doc.name || "documento"}`}
          className="size-4 shrink-0 accent-[var(--primary)] disabled:opacity-60"
          title={locked ? "Obrigatório para cadastro — use o status “Dispensado” se não se aplicar." : undefined}
        />
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", doc.included ? "bg-primary/10 text-primary" : "bg-black/5 text-card-beige-muted-foreground")}>
          <Icon className="size-4" aria-hidden />
        </span>
        <button type="button" onClick={onToggleExpand} className="min-w-0 flex-1 text-left" aria-expanded={expanded}>
          <span className="flex flex-wrap items-center gap-1.5">
            <span className={cn("text-sm font-semibold", doc.included ? "text-foreground" : "text-card-beige-muted-foreground")}>
              {doc.name || "Novo documento"}
            </span>
            {suggested && !doc.included ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                <Sparkles className="size-3" aria-hidden /> Sugerido pelo perfil
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-xs text-card-beige-muted-foreground">
            {[category, doc.type, DOC_REQUIREMENT_LABEL[doc.requirement]].filter(Boolean).join(" · ")}
            {doc.file ? ` · ${doc.file.name}` : ""}
          </span>
        </button>
        {doc.included ? <StatusPill status={effectiveStatus} /> : null}
        <Button type="button" size="icon-sm" variant="ghost" onClick={onToggleExpand} aria-label={expanded ? "Recolher detalhes" : "Ver detalhes"}>
          <ChevronDown className={cn("transition-transform", expanded && "rotate-180")} aria-hidden />
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid gap-3 border-t border-black/10 bg-black/[0.02] p-3 sm:grid-cols-2 lg:grid-cols-3">
              {isCustom ? (
                <>
                  <TextField id={`doc-${doc.key}-nome`} label="Nome do documento" required value={doc.name} onChange={(v) => onChange({ name: v })} error={errors[`doc.${doc.key}.name`]} />
                  <SelectField id={`doc-${doc.key}-categoria`} label="Categoria" required value={doc.category} onChange={(v) => onChange({ category: (v || "outros") as DocItem["category"] })} options={DOC_CATEGORIES} />
                  <TextField id={`doc-${doc.key}-tipo`} label="Tipo" value={doc.type} onChange={(v) => onChange({ type: v })} />
                </>
              ) : null}
              <SelectField
                id={`doc-${doc.key}-status`}
                label="Status"
                required
                value={doc.status}
                onChange={(v) => onChange({ status: (v || "pendente") as DocStatus, included: true })}
                options={DOC_STATUSES}
              />
              <TextField
                id={`doc-${doc.key}-validade`}
                label="Data de validade"
                type="date"
                value={doc.expiresAt}
                onChange={(v) => onChange({ expiresAt: v, ...(v && isExpiredDate(v) ? { status: "expirado" as DocStatus } : {}) })}
                hint="Quando aplicável (CNH, comprovantes com prazo)."
                error={errors[`doc.${doc.key}.expiresAt`]}
              />
              <SelectField id={`doc-${doc.key}-envio`} label="Responsável pelo envio" value={doc.submittedBy} onChange={(v) => onChange({ submittedBy: v })} options={DOC_RESPONSIBLE_OPTIONS} />
              <SelectField id={`doc-${doc.key}-validacao`} label="Responsável pela validação" value={doc.validatedBy} onChange={(v) => onChange({ validatedBy: v })} options={DOC_RESPONSIBLE_OPTIONS} />
              <TextAreaField id={`doc-${doc.key}-obs`} label="Observações" value={doc.notes} onChange={(v) => onChange({ notes: v })} className="sm:col-span-2" />

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-card-beige-muted-foreground">
                  Arquivo <span className="font-medium normal-case tracking-normal text-card-beige-muted-foreground/70">(opcional — pode ser enviado depois)</span>
                </p>
                <input
                  ref={fileInput}
                  type="file"
                  accept={ACCEPTED}
                  className="sr-only"
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {doc.file ? (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/[0.05] px-3 py-2 text-xs">
                    <Paperclip className="size-3.5 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">{doc.file.name}</span>
                    <span className="text-card-beige-muted-foreground">{(doc.file.size / 1024 / 1024).toFixed(1)} MB</span>
                    <Button type="button" size="icon-xs" variant="ghost" aria-label="Remover arquivo" onClick={() => onChange({ file: null })}>
                      <X aria-hidden />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      pickFile(e.dataTransfer.files?.[0]);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-black/20 px-3 py-3 text-xs font-semibold text-card-beige-muted-foreground transition-colors hover:border-primary hover:bg-primary/[0.04] hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Paperclip className="size-3.5" aria-hidden /> Anexar ou arrastar arquivo (PDF, imagem ou Word, até 15 MB)
                  </button>
                )}
                {fileError ? <p className="text-xs font-medium text-destructive">{fileError}</p> : null}
              </div>

              {onRemove ? (
                <div className="sm:col-span-2 lg:col-span-3">
                  <Button type="button" size="sm" variant="destructive" onClick={onRemove}>
                    <Trash2 aria-hidden /> Remover documento
                  </Button>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}
