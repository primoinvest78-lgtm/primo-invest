"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Feedback, Field, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { openCreditOperation } from "@/lib/actions/consortium-credit";
import { formatCurrencyBRL } from "@/lib/utils/format";

export function CreditOpenDialog({ contemplationId, creditAmount }: { contemplationId: string; creditAmount: number | null }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { pending, errors, message, execute } = useEngineAction();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const updated = String(f.get("updatedCredit") ?? "").trim();
    execute(
      () => openCreditOperation(contemplationId, { updatedCredit: updated ? Number(updated) : null, notes: String(f.get("notes") ?? "") }),
      (r) => {
        setOpen(false);
        const id = (r.data as { id?: string } | undefined)?.id;
        if (id) router.push(`/consorcios/motor/credito/${id}`);
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" />}>Abrir crédito</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir direito ao crédito</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <p className="text-xs text-card-beige-muted-foreground">
            Crédito contratado: {creditAmount !== null ? formatCurrencyBRL(creditAmount) : "não informado"}. Lance e parcela
            embutida vêm do lance vencedor (quando houver). O crédito líquido é calculado — nunca digitado.
          </p>
          <Field label="Crédito atualizado (opcional)" hint="Informe só se houve atualização conforme contrato.">
            <Input name="updatedCredit" type="number" step="0.01" />
          </Field>
          <Field label="Observações">
            <Input name="notes" />
          </Field>
          <Feedback errors={errors} message={message} />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Abrindo…" : "Abrir"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
