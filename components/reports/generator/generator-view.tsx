"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  CalendarClock,
  Check,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useMemo, useState, useTransition } from "react";

import { ReportDocument } from "@/components/reports/document/report-document";
import { ScheduleDialog } from "@/components/reports/generator/schedule-dialog";
import { TemplateSaveDialog } from "@/components/reports/generator/template-save-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateReport, previewReport } from "@/lib/actions/reports";
import type { ReportFilterOptions, ReportTemplate } from "@/lib/data/reports";
import {
  FILTER_SUPPORT,
  defaultTitleFor,
  toggleSection,
  validate,
  visibleSections,
  withAudience,
  withType,
  type GeneratorState,
} from "@/lib/reports/generator-state";
import { periodPresets } from "@/lib/reports/period";
import {
  INTERNAL_ONLY_TYPES,
  REPORT_AUDIENCE_LABEL,
  REPORT_AUDIENCES,
  REPORT_TYPE_DESCRIPTION,
  REPORT_TYPE_LABEL,
  REPORT_TYPES,
  type ReportPayload,
  type ReportType,
} from "@/lib/reports/types";

const NONE = "none";

const STEPS = [
  { id: 1, label: "Tipo" },
  { id: 2, label: "Recorte" },
  { id: 3, label: "Conteúdo" },
  { id: 4, label: "Prévia" },
] as const;

function StepBar({ step, onGo }: { step: number; onGo: (n: number) => void }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {STEPS.map((s) => {
        const done = s.id < step;
        const active = s.id === step;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onGo(s.id)}
              className={[
                "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-body-sm font-semibold transition-all duration-200",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : done
                    ? "border-primary/40 text-foreground hover:border-primary"
                    : "border-border text-card-beige-muted-foreground hover:border-primary/40",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  active || done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {done ? <Check className="h-3 w-3" /> : s.id}
              </span>
              {s.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
      {children}
    </label>
  );
}

export function GeneratorView({
  initial,
  options,
  templates,
  canUseInternalTypes,
}: {
  initial: GeneratorState;
  options: ReportFilterOptions;
  templates: ReportTemplate[];
  /** Falso para perfis sem acesso a Operacional e Executivo. */
  canUseInternalTypes: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<GeneratorState>(initial);
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState<ReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewing, startPreview] = useTransition();
  const [generating, startGenerate] = useTransition();

  const availableTypes = useMemo(
    () => REPORT_TYPES.filter((t) => canUseInternalTypes || !INTERNAL_ONLY_TYPES.includes(t)),
    [canUseInternalTypes],
  );

  const sectionOptions = visibleSections(state.type, state.audience);
  const presets = useMemo(() => periodPresets(), []);
  const validation = validate(state);
  const selectedClient = options.clients.find((c) => c.id === state.clientId) ?? null;

  function update(next: GeneratorState) {
    setState(next);
    // Qualquer mudança invalida a prévia: mostrar prévia velha ao lado de
    // parâmetros novos é a forma mais fácil de gerar o documento errado.
    setPreview(null);
    setError(null);
  }

  function handleType(type: ReportType) {
    update(withType(state, type));
  }

  function handleClient(value: string) {
    const id = value === NONE ? null : value;
    const client = options.clients.find((c) => c.id === id) ?? null;
    const wasDefault = REPORT_TYPES.some(
      (t) => defaultTitleFor(t) === state.title || defaultTitleFor(t, selectedClient?.fullName) === state.title,
    );
    update({
      ...state,
      clientId: id,
      title: wasDefault ? defaultTitleFor(state.type, client?.fullName ?? null) : state.title,
    });
  }

  function applyTemplate(template: ReportTemplate) {
    update({
      type: template.type,
      title: template.title,
      audience: template.config.audience,
      clientId: template.config.clientId,
      periodStart: null,
      periodEnd: null,
      institution: template.config.institution,
      sections: template.config.sections,
    });
    setStep(2);
  }

  function runPreview() {
    if (!validation.ok) {
      setError(validation.reason);
      return;
    }
    setError(null);
    startPreview(async () => {
      try {
        const result = await previewReport(state);
        setPreview(result);
        setStep(4);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível montar a prévia.");
      }
    });
  }

  function runGenerate() {
    if (!validation.ok) {
      setError(validation.reason);
      return;
    }
    startGenerate(async () => {
      try {
        const { id } = await generateReport(state);
        router.push(`/relatorios/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível gerar o relatório.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="card-premium rounded-2xl p-5">
        <StepBar step={step} onGo={setStep} />
      </div>

      {error ? (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-body-sm font-semibold text-destructive"
        >
          {error}
        </motion.p>
      ) : null}

      {/* ── 1 · TIPO ────────────────────────────────────────────── */}
      {step === 1 ? (
        <div className="space-y-5">
          {templates.length > 0 ? (
            <section className="card-premium rounded-2xl p-5 md:p-6">
              <h3 className="text-h2 font-bold text-foreground">Começar de um modelo</h3>
              <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
                Modelos guardam tipo, público e seções — o recorte de período você escolhe agora.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {templates.slice(0, 6).map((template, index) => (
                  <motion.button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
                    whileHover={{ y: -2 }}
                    className="card-premium rounded-2xl p-4 text-left transition-all duration-200"
                  >
                    <p className="text-label font-bold uppercase text-primary">
                      {REPORT_TYPE_LABEL[template.type]}
                    </p>
                    <p className="mt-2 text-body font-bold text-foreground">{template.title}</p>
                    <p className="mt-1 text-caption text-card-beige-muted-foreground">
                      {template.config.sections.length}{" "}
                      {template.config.sections.length === 1 ? "seção" : "seções"}
                      {template.usageCount > 0 ? ` · usado ${template.usageCount}x` : ""}
                    </p>
                  </motion.button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {availableTypes.map((type, index) => {
              const active = state.type === type;
              return (
                <motion.button
                  key={type}
                  type="button"
                  onClick={() => handleType(type)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                  whileHover={{ y: -3 }}
                  className={[
                    "card-premium rounded-2xl p-5 text-left transition-all duration-200",
                    active ? "ring-2 ring-primary" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    {active ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-h2 font-bold text-foreground">{REPORT_TYPE_LABEL[type]}</p>
                  <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
                    {REPORT_TYPE_DESCRIPTION[type]}
                  </p>
                </motion.button>
              );
            })}
          </section>

          <div className="flex justify-end">
            <Button size="lg" onClick={() => setStep(2)}>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* ── 2 · RECORTE ─────────────────────────────────────────── */}
      {step === 2 ? (
        <div className="space-y-5">
          <section className="card-premium space-y-4 rounded-2xl p-5 md:p-6">
            <div>
              <h3 className="text-h2 font-bold text-foreground">Identificação</h3>
              <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
                É este título que aparece na capa do documento.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel>Título do relatório</FieldLabel>
                <Input
                  value={state.title}
                  onChange={(e) => update({ ...state, title: e.target.value })}
                  placeholder="Ex.: Relatório Patrimonial — 1º semestre"
                />
              </div>

              <div>
                <FieldLabel>Público</FieldLabel>
                <Select
                  value={state.audience}
                  onValueChange={(v) =>
                    update(withAudience(state, v === "cliente" ? "cliente" : "interno"))
                  }
                  disabled={INTERNAL_ONLY_TYPES.includes(state.type)}
                >
                  <SelectTrigger className="w-full">
                    {/* children como função: sem isso a Base UI só resolve
                        o rótulo enquanto o SelectItem está montado no DOM
                        (dropdown aberto) — fechado, mostra o valor cru
                        ("cliente" em vez de "Cliente"). */}
                    <SelectValue>{() => REPORT_AUDIENCE_LABEL[state.audience]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_AUDIENCES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {REPORT_AUDIENCE_LABEL[a]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-caption text-card-beige-muted-foreground">
                  {INTERNAL_ONLY_TYPES.includes(state.type)
                    ? "Este tipo é sempre interno — expõe a operação da casa."
                    : state.audience === "cliente"
                      ? "Seções internas (pipeline, ranking entre clientes) ficam fora do documento."
                      : "Documento completo, com as informações internas da casa."}
                </p>
              </div>

              {FILTER_SUPPORT.client[state.type] ? (
                <div>
                  <FieldLabel>
                    Cliente {FILTER_SUPPORT.requiresClient[state.type] ? "(obrigatório)" : "(opcional)"}
                  </FieldLabel>
                  <Select value={state.clientId ?? NONE} onValueChange={(v) => handleClient(v ?? NONE)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o cliente">
                        {() =>
                          state.clientId
                            ? (selectedClient?.fullName ?? state.clientId)
                            : FILTER_SUPPORT.requiresClient[state.type]
                              ? "Selecione o cliente"
                              : "Toda a carteira"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {!FILTER_SUPPORT.requiresClient[state.type] ? (
                        <SelectItem value={NONE}>Toda a carteira</SelectItem>
                      ) : null}
                      {options.clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.fullName}
                          {c.householdName ? ` · ${c.householdName}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedClient?.advisorName ? (
                    <p className="mt-1 text-caption text-card-beige-muted-foreground">
                      Assessor responsável: {selectedClient.advisorName}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {FILTER_SUPPORT.institution[state.type] && options.institutions.length > 0 ? (
                <div>
                  <FieldLabel>Instituição</FieldLabel>
                  <Select
                    value={state.institution ?? NONE}
                    onValueChange={(v) => update({ ...state, institution: v === NONE ? null : v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas">
                        {() => (state.institution ? state.institution : "Todas as instituições")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Todas as instituições</SelectItem>
                      {options.institutions.map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          </section>

          {FILTER_SUPPORT.period[state.type] ? (
            <section className="card-premium space-y-4 rounded-2xl p-5 md:p-6">
              <div>
                <h3 className="text-h2 font-bold text-foreground">Período</h3>
                <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
                  Recorta movimentações, parcelas, lances e registros criados no intervalo. Saldos e
                  posições são sempre a posição de hoje — e o documento diz isso.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => {
                  const active = state.periodStart === preset.start && state.periodEnd === preset.end;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        update({ ...state, periodStart: preset.start, periodEnd: preset.end })
                      }
                      className={[
                        "rounded-xl border px-3 py-1.5 text-body-sm font-semibold transition-all duration-200",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-card-beige-muted-foreground hover:border-primary/50 hover:text-foreground",
                      ].join(" ")}
                    >
                      {preset.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => update({ ...state, periodStart: null, periodEnd: null })}
                  className={[
                    "rounded-xl border px-3 py-1.5 text-body-sm font-semibold transition-all duration-200",
                    !state.periodStart && !state.periodEnd
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-card-beige-muted-foreground hover:border-primary/50 hover:text-foreground",
                  ].join(" ")}
                >
                  Sem recorte
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Data inicial</FieldLabel>
                  <Input
                    type="date"
                    value={state.periodStart ?? ""}
                    onChange={(e) => update({ ...state, periodStart: e.target.value || null })}
                  />
                </div>
                <div>
                  <FieldLabel>Data final</FieldLabel>
                  <Input
                    type="date"
                    value={state.periodEnd ?? ""}
                    onChange={(e) => update({ ...state, periodEnd: e.target.value || null })}
                  />
                </div>
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button size="lg" onClick={() => setStep(3)}>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* ── 3 · CONTEÚDO ────────────────────────────────────────── */}
      {step === 3 ? (
        <div className="space-y-5">
          <section className="card-premium space-y-4 rounded-2xl p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-h2 font-bold text-foreground">Seções do documento</h3>
                <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
                  Cada seção traz os indicadores, gráficos e tabelas daquele assunto. Seção sem dado
                  entra declarada como &ldquo;Não disponível&rdquo; — nunca com número inventado.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => update({ ...state, sections: sectionOptions.map((s) => s.id) })}
                >
                  Marcar todas
                </Button>
                <Button variant="outline" size="sm" onClick={() => update({ ...state, sections: [] })}>
                  Limpar
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sectionOptions.map((section, index) => {
                const active = state.sections.includes(section.id);
                return (
                  <motion.button
                    key={section.id}
                    type="button"
                    onClick={() => update(toggleSection(state, section.id))}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: index * 0.03, ease: "easeOut" }}
                    whileHover={{ y: -2 }}
                    className={[
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                      active
                        ? "border-primary bg-primary/[0.07]"
                        : "border-border hover:border-primary/50",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-transparent",
                      ].join(" ")}
                    >
                      {active ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span className="min-w-0 truncate text-body-sm font-semibold text-foreground">
                      {section.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </section>

          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex flex-wrap gap-2">
              <TemplateSaveDialog state={state} />
              <Button size="lg" onClick={runPreview} disabled={previewing}>
                {previewing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {previewing ? "Montando prévia..." : "Ver prévia"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── 4 · PRÉVIA ──────────────────────────────────────────── */}
      {step === 4 ? (
        <div className="space-y-5">
          <section className="card-premium rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-label font-bold uppercase text-primary">Prévia</p>
                <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
                  É exatamente este documento que será gerado — mesmo componente, mesmos dados.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep(3)}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Ajustar
                </Button>
                <Button variant="outline" size="sm" onClick={runPreview} disabled={previewing}>
                  {previewing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Atualizar
                </Button>
                <ScheduleDialog state={state} />
                <TemplateSaveDialog state={state} />
                <Button size="sm" onClick={runGenerate} disabled={generating || !preview}>
                  {generating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <BookmarkPlus className="h-3.5 w-3.5" />
                  )}
                  {generating ? "Gerando..." : "Gerar relatório"}
                </Button>
              </div>
            </div>
          </section>

          {preview ? (
            <ReportDocument payload={preview} />
          ) : (
            <div className="card-premium rounded-2xl p-8 text-center">
              <CalendarClock className="mx-auto h-8 w-8 text-card-beige-muted-foreground" />
              <p className="mt-3 text-body text-card-beige-muted-foreground">
                Prévia ainda não montada. Use &ldquo;Atualizar&rdquo; para carregar.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
