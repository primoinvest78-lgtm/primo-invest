"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/system/status-page";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">
        <StatusPage
          eyebrow="Primo Invest"
          code="Manutenção"
          title="Estamos ajustando alguns detalhes"
          description="Nossa equipe já foi notificada e está trabalhando pra normalizar essa página o quanto antes. Enquanto isso, que tal um desafio rápido?"
          action={<Button size="lg" onClick={reset}>Tentar novamente</Button>}
          supportCode={error.digest}
        />
      </body>
    </html>
  );
}
