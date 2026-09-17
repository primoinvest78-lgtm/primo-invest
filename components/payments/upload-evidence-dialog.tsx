"use client";

import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitPaymentEvidence } from "@/lib/actions/payments";
import { createClient } from "@/lib/supabase/client";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, type PaymentMethod } from "@/lib/payments/types";

const RESULT_HINT: Record<string, string> = {
  conciliado: "Alta confiança — baixa automática já aplicada na parcela.",
  aguardando_revisao: "Confiança média — enviado para a fila de revisão.",
  excecao: "Baixa confiança — registrado como exceção para revisão.",
  duplicado: "Identificador de transação já usado em outro comprovante — marcado como duplicado.",
};

export function UploadEvidenceDialog({ organizationId, clientNames }: { organizationId: string; clientNames: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Selecione o comprovante.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    const form = new FormData(event.currentTarget);

    try {
      const supabase = createClient();
      const storagePath = `${organizationId}/pagamentos/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file);
      if (uploadError) throw uploadError;

      const amountRaw = String(form.get("amount") ?? "").replace(",", ".");

      const response = await submitPaymentEvidence({
        storagePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        amount: amountRaw ? Number(amountRaw) : null,
        date: String(form.get("date") ?? "") || null,
        time: String(form.get("time") ?? "") || null,
        method,
        bank: String(form.get("bank") ?? "") || null,
        beneficiary: String(form.get("beneficiary") ?? "") || null,
        transactionId: String(form.get("transactionId") ?? "") || null,
        clientHint: String(form.get("clientHint") ?? "") || null,
        notes: String(form.get("notes") ?? "") || null,
      });

      setResult({ status: response.status });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch {
      setError("Não foi possível enviar o comprovante. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
          setResult(null);
        }
      }}
    >
      <DialogTrigger render={<Button />}>
        <Upload className="h-4 w-4" />
        Enviar comprovante
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar comprovante de pagamento</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <p className="text-body-sm font-semibold text-foreground">
              Status: {PAYMENT_STATUS_LABEL[result.status as keyof typeof PAYMENT_STATUS_LABEL] ?? result.status}
            </p>
            <p className="text-body-sm text-card-beige-muted-foreground">
              {RESULT_HINT[result.status] ?? "Comprovante registrado."}
            </p>
            <DialogFooter>
              <Button
                onClick={() => {
                  setResult(null);
                }}
                variant="outline"
              >
                Enviar outro
              </Button>
              <Button onClick={() => setOpen(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              ref={inputRef}
              type="file"
              required
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">Valor</label>
                <Input name="amount" type="text" inputMode="decimal" placeholder="0,00" />
              </div>
              <div>
                <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">Método</label>
                <Select value={method} onValueChange={(v) => setMethod((v as PaymentMethod) ?? "pix")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{() => PAYMENT_METHOD_LABEL[method]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {PAYMENT_METHOD_LABEL[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">Data</label>
                <Input name="date" type="date" />
              </div>
              <div>
                <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">Hora</label>
                <Input name="time" type="time" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
                Cliente (nome ou CPF/CNPJ)
              </label>
              <Input name="clientHint" list="payments-client-list" placeholder="Como identificar o cliente" />
              <datalist id="payments-client-list">
                {clientNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">Banco</label>
                <Input name="bank" placeholder="Opcional" />
              </div>
              <div>
                <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
                  Beneficiário
                </label>
                <Input name="beneficiary" placeholder="Opcional" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
                Identificador da transação
              </label>
              <Input name="transactionId" placeholder="Opcional — usado para detectar duplicidade" />
            </div>

            <Textarea name="notes" placeholder="Observações (opcional)" rows={2} />

            {error ? <p className="text-body-sm font-semibold text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Enviar e processar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
