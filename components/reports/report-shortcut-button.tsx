import { FileBarChart } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { generatorHref } from "@/lib/reports/generator-state";
import type { ReportAudience, ReportType } from "@/lib/reports/types";

/**
 * Atalho "Gerar relatório" espalhado pelos outros módulos.
 *
 * É a porta de ENTRADA do Report Center a partir de onde o trabalho
 * acontece: o assessor está olhando a ficha de um cliente e leva aquele
 * recorte inteiro pro gerador em um clique, em vez de ir até
 * /relatorios e selecionar tudo de novo.
 *
 * Componente de servidor de propósito — é só um link com querystring,
 * não precisa de estado nem de JavaScript no cliente.
 */
export function ReportShortcutButton({
  type,
  clientId = null,
  institution = null,
  audience,
  label = "Gerar relatório",
  variant = "outline",
  size = "sm",
  className,
}: {
  type: ReportType;
  clientId?: string | null;
  institution?: string | null;
  audience?: ReportAudience;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      nativeButton={false}
      render={
        <Link
          href={generatorHref({
            tipo: type,
            cliente: clientId,
            instituicao: institution,
            publico: audience,
          })}
        />
      }
    >
      <FileBarChart className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
