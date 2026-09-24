"use client";

import { useState, type FormEvent } from "react";

import { Feedback, Field, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createEngineGroup } from "@/lib/actions/consortium-engine";

function num(form: FormData, name: string): number | null {
  const raw = String(form.get(name) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function GroupCreateDialog() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1000);
  const [start, setStart] = useState(1);
  const { pending, errors, message, execute } = useEngineAction();
  const end = start + count - 1;
  const suggestedDigits = Math.max(String(end % 10 === 0 && end >= 10 ? end - 1 : end).length, 1);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    execute(
      () =>
        createEngineGroup({
          administratorName: String(f.get("administratorName") ?? ""),
          groupCode: String(f.get("groupCode") ?? ""),
          productType: String(f.get("productType") ?? ""),
          quotaCount: count,
          numberStart: start,
          displayDigits: num(f, "displayDigits") ?? suggestedDigits,
          creditAmount: num(f, "creditAmount"),
          regulationReference: String(f.get("regulationReference") ?? ""),
          notes: String(f.get("notes") ?? ""),
          constitutedAt: String(f.get("constitutedAt") ?? "") || null,
          participantsCount: num(f, "participantsCount"),
          termMonths: num(f, "termMonths"),
          installmentAmount: num(f, "installmentAmount"),
          adjustmentIndex: String(f.get("adjustmentIndex") ?? ""),
          adminFeePercentage: num(f, "adminFeePercentage"),
          reserveFundPercentage: num(f, "reserveFundPercentage"),
          insuranceRequired: f.get("insuranceRequired") === "on",
        }),
      () => setOpen(false),
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Novo grupo</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo grupo de consórcio</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Administradora">
              <Input name="administratorName" required />
            </Field>
            <Field label="Código do grupo">
              <Input name="groupCode" required />
            </Field>
            <Field label="Produto">
              <Input name="productType" placeholder="Imóvel, veículo…" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Quantidade de cotas">
              <Input type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} required />
            </Field>
            <Field label="Número inicial">
              <Input type="number" min={0} value={start} onChange={(e) => setStart(Number(e.target.value) || 0)} required />
            </Field>
            <Field label="Dígitos de exibição" hint={`Faixa: ${String(start).padStart(suggestedDigits, "0")} a ${String(end).padStart(suggestedDigits, "0")}`}>
              <Input name="displayDigits" type="number" min={1} max={8} placeholder={String(suggestedDigits)} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Valor do crédito">
              <Input name="creditAmount" type="number" step="0.01" />
            </Field>
            <Field label="Valor da parcela">
              <Input name="installmentAmount" type="number" step="0.01" />
            </Field>
            <Field label="Prazo (meses)">
              <Input name="termMonths" type="number" min={1} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Data de constituição">
              <Input name="constitutedAt" type="date" />
            </Field>
            <Field label="Participantes">
              <Input name="participantsCount" type="number" min={0} />
            </Field>
            <Field label="Índice de reajuste">
              <Input name="adjustmentIndex" placeholder="INCC, IPCA…" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Taxa de administração (%)">
              <Input name="adminFeePercentage" type="number" step="0.01" />
            </Field>
            <Field label="Fundo de reserva (%)">
              <Input name="reserveFundPercentage" type="number" step="0.01" />
            </Field>
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input type="checkbox" name="insuranceRequired" /> Seguro obrigatório
            </label>
          </div>
          <Field label="Referência do regulamento" hint="Documento e cláusulas que regem o grupo.">
            <Input name="regulationReference" />
          </Field>
          <Field label="Observações">
            <Input name="notes" />
          </Field>
          <Feedback errors={errors} message={message} />
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Criar grupo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
