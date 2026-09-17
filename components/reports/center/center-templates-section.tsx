"use client";

import { LayoutTemplate, Loader2, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteReportTemplate, registerTemplateUsage } from "@/lib/actions/reports";
import type { ReportTemplate } from "@/lib/data/reports";
import { generatorHref } from "@/lib/reports/generator-state";
import { REPORT_AUDIENCE_LABEL, REPORT_TYPE_LABEL } from "@/lib/reports/types";

export function CenterTemplatesSection({ templates }: { templates: ReportTemplate[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startAction] = useTransition();

  /** Abre o gerador já no modelo e contabiliza o uso (alimenta "mais usados"). */
  function openWithTemplate(template: ReportTemplate) {
    setBusyId(template.id);
    startAction(async () => {
      try {
        await registerTemplateUsage(template.id, template.usageCount);
      } catch {
        // Contador é secundário: falhar aqui não pode impedir a emissão.
      } finally {
        setBusyId(null);
        router.push(
          generatorHref({
            tipo: template.type,
            cliente: template.config.clientId,
            instituicao: template.config.institution,
            publico: template.config.audience,
          }),
        );
      }
    });
  }

  function remove(template: ReportTemplate) {
    setError(null);
    setBusyId(template.id);
    startAction(async () => {
      try {
        await deleteReportTemplate(template.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível remover o modelo.");
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">
            Reutilização
          </p>
          <h3 className="mt-1 text-h2 font-bold text-foreground">Modelos</h3>
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-body-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}

      {templates.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border px-5 py-8 text-center">
          <LayoutTemplate className="mx-auto h-7 w-7 text-card-beige-muted-foreground" />
          <p className="mt-3 text-body font-bold text-foreground">Nenhum modelo salvo ainda</p>
          <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
            Ao configurar um relatório no gerador, use &ldquo;Salvar modelo&rdquo; para repetir a
            mesma estrutura nas próximas emissões.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template, index) => {
            const busy = busyId === template.id && pending;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
                whileHover={{ y: -3 }}
                className="card-premium flex flex-col rounded-2xl p-4 transition-all duration-200"
              >
                <p className="text-label font-bold uppercase text-primary">
                  {REPORT_TYPE_LABEL[template.type]}
                </p>
                <p className="mt-2 text-body font-bold text-foreground">{template.title}</p>

                {template.config.description ? (
                  <p className="mt-1 line-clamp-2 text-body-sm text-card-beige-muted-foreground">
                    {template.config.description}
                  </p>
                ) : null}

                <p className="mt-2 text-caption text-card-beige-muted-foreground">
                  {REPORT_AUDIENCE_LABEL[template.config.audience]} ·{" "}
                  {template.config.sections.length}{" "}
                  {template.config.sections.length === 1 ? "seção" : "seções"}
                  {template.usageCount > 0 ? ` · usado ${template.usageCount}x` : ""}
                </p>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <Button size="sm" onClick={() => openWithTemplate(template)} disabled={busy}>
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    Usar modelo
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remover modelo"
                    onClick={() => remove(template)}
                    disabled={busy}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
