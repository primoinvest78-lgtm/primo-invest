"use client";

import { BookmarkPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveReportTemplate } from "@/lib/actions/reports";
import type { GeneratorState } from "@/lib/reports/generator-state";
import { REPORT_AUDIENCE_LABEL, REPORT_TYPE_LABEL } from "@/lib/reports/types";

/**
 * Salva a configuração atual como modelo reutilizável.
 *
 * O modelo guarda tipo, público, seções, cliente e instituição — mas
 * NÃO guarda o período: um "Relatório Patrimonial Executivo" salvo em
 * março não deve reemitir para sempre o intervalo de março.
 */
export function TemplateSaveDialog({ state }: { state: GeneratorState }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(state.title);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  function handleSubmit() {
    setError(null);
    startSave(async () => {
      try {
        await saveReportTemplate({
          type: state.type,
          title: title.trim() || state.title,
          audience: state.audience,
          sections: state.sections,
          clientId: state.clientId,
          institution: state.institution,
          description: description.trim() || null,
        });
        setOpen(false);
        setDescription("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível salvar o modelo.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <BookmarkPlus className="h-3.5 w-3.5" />
        Salvar modelo
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar como modelo</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
              Nome do modelo
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Relatório Patrimonial Executivo"
            />
          </div>

          <div>
            <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
              Para que serve
            </label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: fechamento mensal enviado à diretoria."
            />
          </div>

          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-body-sm text-card-beige-muted-foreground">
            <p>
              <span className="font-bold text-foreground">{REPORT_TYPE_LABEL[state.type]}</span> ·{" "}
              {REPORT_AUDIENCE_LABEL[state.audience]} · {state.sections.length}{" "}
              {state.sections.length === 1 ? "seção" : "seções"}
            </p>
            <p className="mt-1 text-caption">
              O período não é guardado no modelo — você escolhe o recorte a cada emissão.
            </p>
          </div>

          {error ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-body-sm font-semibold text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Salvando..." : "Salvar modelo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
