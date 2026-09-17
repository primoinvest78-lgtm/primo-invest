"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Sempre volta pra tela anterior de verdade (router.back(), histórico
 * do navegador) — não pra uma rota fixa — porque a origem varia: pode
 * ter vindo de um card do Dashboard, do Hub CRM ou da sidebar direto.
 */
export function BackButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-xs font-semibold text-card-beige-muted-foreground transition-colors hover:text-primary"
      }
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Voltar
    </button>
  );
}
