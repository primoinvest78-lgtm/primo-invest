"use client";

import { CalendarClock, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { scheduleReport } from "@/lib/actions/reports";
import type { GeneratorState } from "@/lib/reports/generator-state";
import { formatDateOnly } from "@/lib/reports/period";
import { clampDayOfMonth, computeNextRun } from "@/lib/reports/schedule";
import { SCHEDULE_FREQUENCIES, SCHEDULE_FREQUENCY_LABEL, type ScheduleFrequency } from "@/lib/reports/types";

/**
 * Agenda a recorrência do relatório.
 *
 * A plataforma ainda NÃO tem executor automático — e o diálogo diz isso
 * com todas as letras em vez de deixar o usuário supor que o relatório
 * vai chegar sozinho. O que fica registrado é a recorrência e a próxima
 * data; quando ela chega, o relatório aparece em "Pendentes" na home
 * para ser emitido com um clique.
 */
export function ScheduleDialog({ state }: { state: GeneratorState }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState<ScheduleFrequency>("mensal");
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  const nextRun = computeNextRun(frequency, dayOfMonth);

  function handleSubmit() {
    setError(null);
    startSave(async () => {
      try {
        await scheduleReport({
          ...state,
          frequency,
          dayOfMonth: clampDayOfMonth(dayOfMonth),
          note: note.trim() || null,
        });
        setOpen(false);
        setNote("");
        router.push("/relatorios");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível agendar.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <CalendarClock className="h-3.5 w-3.5" />
        Agendar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar emissão recorrente</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
                Periodicidade
              </label>
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency((v as ScheduleFrequency) ?? "mensal")}
              >
                <SelectTrigger className="w-full">
                  {/* children como função: sem isso a Base UI só resolve o
                      rótulo enquanto o item está montado (dropdown aberto). */}
                  <SelectValue>{() => SCHEDULE_FREQUENCY_LABEL[frequency]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {SCHEDULE_FREQUENCY_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
                Dia do mês
              </label>
              <Input
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
              />
              <p className="mt-1 text-caption text-card-beige-muted-foreground">
                Até 28, para cair no mesmo dia todo mês.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
              Observação
            </label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: enviar ao cliente junto do fechamento do mês."
            />
          </div>

          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
            <p className="text-body-sm font-bold text-foreground">
              Próxima emissão: {formatDateOnly(nextRun)}
            </p>
            <p className="mt-1 text-caption text-card-beige-muted-foreground">
              A emissão não é automática: na data, o relatório aparece em &ldquo;Pendentes&rdquo; no
              Central de Relatórios para ser gerado com um clique — com os dados daquele momento.
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
            {saving ? "Agendando..." : "Agendar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
