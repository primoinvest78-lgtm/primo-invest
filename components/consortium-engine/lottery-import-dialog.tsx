"use client";

import { useState, type FormEvent } from "react";

import { Feedback, Field, NativeSelect, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { importLotteryResult } from "@/lib/actions/consortium-engine";

/**
 * Importação MANUAL do resultado publicado pela fonte oficial. Nada é
 * gerado aqui: o operador transcreve e informa a referência; outra
 * pessoa (governança) confere contra a fonte e verifica.
 */
export function LotteryImportDialog() {
  const [open, setOpen] = useState(false);
  const [digits, setDigits] = useState(5);
  const { pending, errors, message, execute } = useEngineAction();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const prizes = [1, 2, 3, 4, 5].map((i) => String(f.get(`prize${i}`) ?? "").trim());
    execute(
      () =>
        importLotteryResult({
          source: String(f.get("source")) as "FEDERAL_LOTTERY",
          contestNumber: String(f.get("contestNumber") ?? ""),
          drawDate: String(f.get("drawDate") ?? ""),
          prizes,
          prizeDigits: digits,
          sourceReference: String(f.get("sourceReference") ?? ""),
          evidenceNotes: String(f.get("evidenceNotes") ?? ""),
        }),
      (r) => {
        if (!r.message?.startsWith("Registrado como INVÁLIDO")) setOpen(false);
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Importar resultado</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar resultado oficial</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <p className="rounded-lg bg-black/5 px-3 py-2 text-xs text-card-beige-muted-foreground">
            Transcreva exatamente como publicado pela fonte oficial, com zeros à esquerda. O resultado só poderá ser usado
            depois de verificado por governança.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Fonte">
              <NativeSelect
                name="source"
                defaultValue="FEDERAL_LOTTERY"
                options={[
                  { value: "FEDERAL_LOTTERY", label: "Loteria Federal" },
                  { value: "OTHER_REGULATED_SOURCE", label: "Outra fonte regulada" },
                ]}
              />
            </Field>
            <Field label="Dígitos por prêmio">
              <Input type="number" min={3} max={8} value={digits} onChange={(e) => setDigits(Number(e.target.value) || 5)} />
            </Field>
            <Field label="Concurso">
              <Input name="contestNumber" inputMode="numeric" required />
            </Field>
            <Field label="Data da extração">
              <Input name="drawDate" type="date" required />
            </Field>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Field key={i} label={`${i}º prêmio`}>
                <Input
                  name={`prize${i}`}
                  inputMode="numeric"
                  pattern={`\\d{${digits}}`}
                  maxLength={digits}
                  required
                  className="font-mono"
                />
              </Field>
            ))}
          </div>
          <Field label="Referência da fonte" hint="Link, número da publicação ou documento consultado.">
            <Input name="sourceReference" required />
          </Field>
          <Field label="Evidência" hint="Como e onde foi conferido (ex.: comprovante anexado ao Cofre Digital).">
            <Input name="evidenceNotes" />
          </Field>
          <Feedback errors={errors} message={message} />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Importando…" : "Importar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
