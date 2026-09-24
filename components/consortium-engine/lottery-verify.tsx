"use client";

import { useState } from "react";

import { Feedback, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { markLotteryInvalid, verifyLotteryResult } from "@/lib/actions/consortium-engine";

/** Conferência humana: redigitar o 1º prêmio visto NA FONTE oficial. */
export function LotteryVerify({ resultId }: { resultId: string }) {
  const [value, setValue] = useState("");
  const [invalidReason, setInvalidReason] = useState("");
  const [mode, setMode] = useState<"idle" | "verify" | "invalid">("idle");
  const { pending, errors, message, execute } = useEngineAction();

  if (mode === "idle") {
    return (
      <div className="flex gap-2">
        <Button size="xs" onClick={() => setMode("verify")}>
          Verificar
        </Button>
        <Button size="xs" variant="outline" onClick={() => setMode("invalid")}>
          Invalidar
        </Button>
      </div>
    );
  }

  return (
    <div className="w-56 space-y-2">
      {mode === "verify" ? (
        <>
          <Input
            placeholder="1º prêmio conforme a fonte"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="font-mono"
          />
          <Button size="xs" disabled={pending || !value} onClick={() => execute(() => verifyLotteryResult(resultId, value))}>
            {pending ? "Verificando…" : "Confirmar conferência"}
          </Button>
        </>
      ) : (
        <>
          <Input placeholder="Motivo" value={invalidReason} onChange={(e) => setInvalidReason(e.target.value)} />
          <Button size="xs" variant="destructive" disabled={pending} onClick={() => execute(() => markLotteryInvalid(resultId, invalidReason))}>
            Marcar inválido
          </Button>
        </>
      )}
      <Button size="xs" variant="ghost" onClick={() => setMode("idle")}>
        Cancelar
      </Button>
      <Feedback errors={errors} message={message} />
    </div>
  );
}
