"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { StepContacts } from "@/components/clients/new-client/step-contacts";
import { StepDocuments } from "@/components/clients/new-client/step-documents";
import { StepFamily } from "@/components/clients/new-client/step-family";
import { StepIdentification } from "@/components/clients/new-client/step-identification";
import { StepProfile } from "@/components/clients/new-client/step-profile";
import { StepReview } from "@/components/clients/new-client/step-review";
import { StepType } from "@/components/clients/new-client/step-type";
import {
  attachRegistrationDocument,
  checkClientDuplicates,
  createClientRegistration,
  type DuplicateMatch,
  type RegistrationPayload,
} from "@/lib/actions/clients";
import { createClient } from "@/lib/supabase/client";
import {
  clientDisplayName,
  clientDocument,
  createInitialState,
  DOC_CATEGORY_TO_CENTER,
  STEPS,
  suggestedConditionalKeys,
  validateAll,
  validateStep,
  type FieldErrors,
  type RegistrationState,
} from "@/lib/utils/client-registration";

const DRAFT_KEY = "primo:novo-cliente:rascunho";
const REVIEW_STEP = STEPS.length - 1;

type Phase = "form" | "saving" | "done";

/** Estado sem arquivos — é o que vai pro rascunho local e pra ação de servidor. */
function serializable(state: RegistrationState): RegistrationPayload {
  return {
    ...state,
    documents: state.documents.map((d) => ({ ...d, file: null, hasFile: !!d.file })),
  };
}

function readDraft(): RegistrationState | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state: RegistrationPayload; step: number };
    return { ...parsed.state, documents: parsed.state.documents.map((d) => ({ ...d, file: null })) };
  } catch {
    return null;
  }
}

/** Mesmo padrão de caminho do Cofre Digital (vault-upload-dialog). */
function buildStoragePath(organizationId: string, fileName: string) {
  const safeName = fileName.normalize("NFD").replace(/[^\w.-]+/g, "_");
  return `${organizationId}/cofre/${Date.now()}-${safeName}`;
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* armazenamento indisponível — nada a limpar */
  }
}

export function NewClientWizard({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<RegistrationState>(() => createInitialState());
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [checking, setChecking] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [progress, setProgress] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ clientId: string; name: string; failedUploads: string[] } | null>(null);
  const suggestionsApplied = useRef<Set<string>>(new Set());
  const bodyRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState(1);

  const pristine = useMemo(() => JSON.stringify(serializable(createInitialState(state.personType))), [state.personType]);
  const dirty = JSON.stringify(serializable(state)) !== pristine || state.documents.some((d) => d.file);

  // Rascunho local (sem arquivos): conveniência pra não perder o preenchimento se o modal fechar.
  useEffect(() => {
    if (!open || phase !== "form" || !dirty) return;
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ state: serializable(state), step }));
        setDraftSavedAt(new Date());
      } catch {
        /* armazenamento indisponível — segue sem rascunho */
      }
    }, 800);
    return () => window.clearTimeout(id);
  }, [state, step, open, phase, dirty]);

  function reset() {
    setState(createInitialState());
    setStep(0);
    setVisited(0);
    setErrors({});
    setDuplicates([]);
    setPhase("form");
    setSubmitError(null);
    setResult(null);
    setDraftSavedAt(null);
    suggestionsApplied.current = new Set();
  }

  function openWizard() {
    reset();
    setDraftAvailable(readDraft() !== null);
    setOpen(true);
  }

  function restoreDraft() {
    const draft = readDraft();
    if (draft) {
      setState(draft);
      setVisited(REVIEW_STEP - 1);
    }
    setDraftAvailable(false);
  }

  function requestClose() {
    if (phase === "saving") return;
    if (phase === "form" && dirty) {
      setConfirmDiscard(true);
      return;
    }
    setOpen(false);
  }

  function discard() {
    clearDraft();
    setConfirmDiscard(false);
    setOpen(false);
    reset();
  }

  function scrollTop() {
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goTo(target: number) {
    setDirection(target > step ? 1 : -1);
    setErrors({});
    setStep(target);
    setVisited((v) => Math.max(v, target));
    scrollTop();
  }

  /** Entrando em Documentos: marca uma única vez os condicionais sugeridos pelo perfil. */
  function applySuggestions(current: RegistrationState): RegistrationState {
    const keys = suggestedConditionalKeys(current).filter((k) => !suggestionsApplied.current.has(k));
    if (keys.length === 0) return current;
    keys.forEach((k) => suggestionsApplied.current.add(k));
    return {
      ...current,
      documents: current.documents.map((d) => (keys.includes(d.key) ? { ...d, included: true } : d)),
    };
  }

  async function next() {
    const stepErrors = validateStep(step, state);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      const first = Object.keys(stepErrors)[0];
      requestAnimationFrame(() => {
        const el = bodyRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
        el?.focus();
        if (!el && first) scrollTop();
      });
      return;
    }

    // Duplicidade consultada no banco ao sair da identificação e dos contatos.
    if (step === 1 || step === 2) {
      setChecking(true);
      try {
        const found = await checkClientDuplicates({
          document: clientDocument(state),
          email: step === 2 ? state.contact.email : "",
        });
        setDuplicates((prev) => {
          const others = prev.filter((d) => (step === 1 ? d.field !== "documento" : d.field !== "email"));
          return [...others, ...found.filter((d) => (step === 1 ? d.field === "documento" : d.field === "email"))];
        });
        const docDup = found.find((d) => d.field === "documento");
        if (step === 1 && docDup) {
          setErrors({
            [state.personType === "pf" ? "pf.cpf" : "pj.cnpj"]: `Já cadastrado para ${docDup.clientName}. Abra o perfil existente em vez de duplicar.`,
          });
          setChecking(false);
          return;
        }
      } catch {
        // Consulta indisponível: segue — a ação de servidor confere de novo ao concluir.
      }
      setChecking(false);
    }

    if (step + 1 === 5) setState((prev) => applySuggestions(prev));
    goTo(step + 1);
  }

  async function submit(allowDuplicate = false) {
    const blocking = validateAll(state);
    if (blocking.length > 0) {
      goTo(blocking[0].step);
      setErrors(blocking[0].errors);
      return;
    }

    setPhase("saving");
    setSubmitError(null);
    setProgress("Gravando cadastro...");

    try {
      const response = await createClientRegistration(serializable(state), { allowDuplicate });
      if (!response.ok) {
        if (response.duplicates) setDuplicates(response.duplicates);
        setSubmitError(response.error);
        setPhase("form");
        return;
      }

      const failedUploads: string[] = [];
      const withFiles = state.documents.filter((d) => d.included && d.file);
      if (withFiles.length > 0) {
        const supabase = createClient();
        let index = 0;
        for (const doc of withFiles) {
          index += 1;
          setProgress(`Enviando documentos (${index} de ${withFiles.length})...`);
          const requestId = response.requests.find((r) => r.key === doc.key)?.requestId;
          const file = doc.file as File;
          try {
            if (!requestId) throw new Error("Solicitação não encontrada.");
            const storagePath = buildStoragePath(organizationId, file.name);
            const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file);
            if (uploadError) throw uploadError;
            await attachRegistrationDocument({
              clientId: response.clientId,
              requestId,
              name: doc.name,
              category: DOC_CATEGORY_TO_CENTER[doc.category],
              storagePath,
              fileSize: file.size,
              mimeType: file.type,
              expiresAt: doc.expiresAt || null,
            });
          } catch {
            failedUploads.push(doc.name);
          }
        }
      }

      clearDraft();
      setResult({ clientId: response.clientId, name: clientDisplayName(state), failedUploads });
      setPhase("done");
      router.refresh();
    } catch {
      setSubmitError("Não foi possível concluir o cadastro. Verifique a conexão e tente novamente.");
      setPhase("form");
    }
  }

  const stepErrorFlags = useMemo(() => {
    const flags = new Set<number>();
    if (step === REVIEW_STEP) validateAll(state).forEach((b) => flags.add(b.step));
    return flags;
  }, [state, step]);

  const pct = Math.round((step / REVIEW_STEP) * 100);
  const emailOnlyDuplicate = duplicates.length > 0 && duplicates.every((d) => d.field === "email");
  const stepProps = { state, setState, errors };

  return (
    <>
      <Button
        type="button"
        onClick={openWizard}
        className="h-10 gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_8px_20px_-8px_rgba(17,5,217,0.6)] transition-all hover:-translate-y-0.5 hover:bg-primary/90"
      >
        <Plus className="size-4" aria-hidden /> Novo cliente
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose();
          else setOpen(true);
        }}
      >
        <DialogContent
          showCloseButton={phase !== "saving"}
          className="flex max-h-[94vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:text-secondary-foreground [&>[data-slot=dialog-close]]:hover:bg-white/10 [&>[data-slot=dialog-close]]:hover:text-secondary-foreground"
        >
          {/* Cabeçalho + etapas */}
          <header className="block-navy-3d shrink-0 rounded-none border-0 px-5 pb-4 pt-5 md:px-7">
            <div className="flex items-start gap-3 pr-8">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-secondary-foreground">
                <UserPlus className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-bold tracking-tight text-secondary-foreground">Novo cliente</DialogTitle>
                <DialogDescription className="text-xs text-secondary-foreground/70">
                  {phase === "done"
                    ? "Cadastro concluído."
                    : `Etapa ${step + 1} de ${STEPS.length} · ${STEPS[step].label}`}
                  {draftSavedAt && phase === "form" ? (
                    <span className="ml-2 inline-flex items-center gap-1 text-secondary-foreground/60">
                      <Save className="size-3" aria-hidden /> rascunho salvo neste navegador
                    </span>
                  ) : null}
                </DialogDescription>
              </div>
            </div>

            {phase !== "done" ? (
              <>
                <ol className="mt-4 flex items-center gap-1 overflow-x-auto pb-1" aria-label="Etapas do cadastro">
                  {STEPS.map((s, i) => {
                    const done = i < step;
                    const current = i === step;
                    const reachable = i <= visited && phase === "form";
                    const hasError = stepErrorFlags.has(i);
                    return (
                      <li key={s.key} className="flex min-w-0 flex-1 items-center gap-1">
                        <button
                          type="button"
                          disabled={!reachable || current}
                          onClick={() => goTo(i)}
                          aria-current={current ? "step" : undefined}
                          className={cn(
                            "group flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                            reachable && !current && "hover:bg-white/10",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                              hasError
                                ? "bg-destructive text-white"
                                : current
                                  ? "bg-white text-secondary shadow-[0_0_0_4px_rgba(255,255,255,0.18)]"
                                  : done
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-white/10 text-secondary-foreground/60",
                            )}
                          >
                            {hasError ? "!" : done ? <Check className="size-3.5" aria-hidden /> : i + 1}
                          </span>
                          <span
                            className={cn(
                              "hidden truncate text-xs font-semibold lg:block",
                              current ? "text-secondary-foreground" : "text-secondary-foreground/60",
                            )}
                          >
                            {s.label}
                          </span>
                        </button>
                        {i < STEPS.length - 1 ? (
                          <span className={cn("h-px min-w-3 flex-1 transition-colors", i < step ? "bg-primary" : "bg-white/15")} aria-hidden />
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do cadastro">
                  <motion.div className="h-full rounded-full bg-white" animate={{ width: `${Math.max(pct, 4)}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                </div>
              </>
            ) : null}
          </header>

          {/* Corpo */}
          <div ref={bodyRef} className="relative min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-7">
            {draftAvailable && phase === "form" && !dirty ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/25 bg-primary/[0.05] px-4 py-2.5 text-xs">
                <span className="font-medium text-foreground">Há um cadastro não concluído salvo neste navegador (sem os arquivos anexados).</span>
                <span className="flex gap-2">
                  <Button type="button" size="xs" variant="ghost" onClick={() => { clearDraft(); setDraftAvailable(false); }}>
                    Descartar
                  </Button>
                  <Button type="button" size="xs" onClick={restoreDraft}>
                    Continuar rascunho
                  </Button>
                </span>
              </div>
            ) : null}

            {phase === "done" && result ? (
              <SuccessPanel
                result={result}
                onOpenProfile={() => {
                  setOpen(false);
                  router.push(`/clientes/${result.clientId}`);
                }}
                onNew={reset}
                onClose={() => setOpen(false)}
              />
            ) : (
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -24 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {step === 0 ? <StepType {...stepProps} /> : null}
                  {step === 1 ? <StepIdentification {...stepProps} /> : null}
                  {step === 2 ? <StepContacts {...stepProps} /> : null}
                  {step === 3 ? <StepProfile {...stepProps} /> : null}
                  {step === 4 ? <StepFamily {...stepProps} /> : null}
                  {step === 5 ? <StepDocuments {...stepProps} /> : null}
                  {step === 6 ? <StepReview {...stepProps} onEdit={goTo} duplicates={duplicates} /> : null}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Confirmação de descarte (sem alerta nativo do navegador) */}
            <AnimatePresence>
              {confirmDiscard ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10 flex items-center justify-center bg-card-beige/80 p-6 backdrop-blur-sm"
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="descartar-titulo"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 8 }}
                    animate={{ scale: 1, y: 0 }}
                    className="card-premium w-full max-w-sm rounded-2xl p-5"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
                      <div>
                        <p id="descartar-titulo" className="text-sm font-bold text-foreground">Descartar este cadastro?</p>
                        <p className="mt-1 text-xs text-card-beige-muted-foreground">
                          Os dados preenchidos e o rascunho salvo serão apagados. Se preferir, feche mantendo o rascunho
                          (arquivos anexados não ficam salvos).
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDiscard(false)}>
                        Continuar editando
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setConfirmDiscard(false);
                          setOpen(false);
                        }}
                      >
                        Fechar e manter rascunho
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={discard}>
                        Descartar
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Rodapé */}
          {phase !== "done" ? (
            <footer className="shrink-0 border-t border-black/10 bg-black/[0.03] px-5 py-3 md:px-7">
              {submitError ? (
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive" role="alert">
                  <span>{submitError}</span>
                  {emailOnlyDuplicate ? (
                    <Button type="button" size="xs" variant="outline" onClick={() => submit(true)}>
                      Concluir mesmo assim
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="ghost" onClick={requestClose} disabled={phase === "saving"}>
                  Cancelar
                </Button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  {step > 0 ? (
                    <Button type="button" variant="outline" onClick={() => goTo(step - 1)} disabled={phase === "saving"}>
                      <ArrowLeft aria-hidden /> Voltar
                    </Button>
                  ) : null}
                  {step < REVIEW_STEP ? (
                    <Button type="button" onClick={next} disabled={checking} className="min-w-32">
                      {checking ? <Loader2 className="animate-spin" aria-hidden /> : null}
                      {checking ? "Verificando..." : "Avançar"}
                      {!checking ? <ArrowRight aria-hidden /> : null}
                    </Button>
                  ) : (
                    <Button type="button" onClick={() => submit(false)} disabled={phase === "saving"} className="min-w-44">
                      {phase === "saving" ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
                      {phase === "saving" ? progress : "Concluir cadastro"}
                    </Button>
                  )}
                </div>
              </div>
            </footer>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SuccessPanel({
  result,
  onOpenProfile,
  onNew,
  onClose,
}: {
  result: { clientId: string; name: string; failedUploads: string[] };
  onOpenProfile: () => void;
  onNew: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 py-10 text-center"
    >
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
        className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success shadow-[0_0_0_8px_color-mix(in_oklab,var(--success)_10%,transparent)]"
      >
        <CheckCircle2 className="size-8" aria-hidden />
      </motion.span>
      <div>
        <p className="text-lg font-bold text-foreground">{result.name} cadastrado com sucesso</p>
        <p className="mt-1 max-w-md text-sm text-card-beige-muted-foreground">
          Contatos, endereço, núcleo familiar, ficha cadastral e solicitações de documentos foram registrados.
        </p>
      </div>
      {result.failedUploads.length > 0 ? (
        <div className="max-w-md rounded-xl border border-warning/35 bg-warning/[0.08] px-4 py-3 text-left text-xs">
          <p className="font-bold text-foreground">Alguns arquivos não foram enviados</p>
          <p className="mt-0.5 text-card-beige-muted-foreground">
            As solicitações foram criadas; envie estes arquivos pelo perfil do cliente: {result.failedUploads.join(", ")}.
          </p>
        </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="ghost" onClick={onClose}>
          Fechar
        </Button>
        <Button type="button" variant="outline" onClick={onNew}>
          <Plus aria-hidden /> Cadastrar outro
        </Button>
        <Button type="button" onClick={onOpenProfile}>
          Abrir perfil do cliente <ArrowRight aria-hidden />
        </Button>
      </div>
    </motion.div>
  );
}
