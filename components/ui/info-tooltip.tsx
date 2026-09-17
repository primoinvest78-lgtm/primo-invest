"use client"

import { Info } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Ícone de informação com tooltip — usado ao lado de botões/campos complexos
 * para explicar o que a funcionalidade faz (regra de usabilidade do sistema).
 */
export function InfoTooltip({
  children,
  className,
  iconClassName,
}: {
  children: React.ReactNode
  className?: string
  /** Sobrescreve a cor do ícone — use algo como "text-white/50 hover:text-white" em fundos escuros (navy). */
  iconClassName?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        className={className}
        aria-label="Mais informações"
        render={
          <button type="button">
            <Info className={iconClassName ?? "h-3.5 w-3.5 text-muted-foreground transition-colors hover:text-primary"} />
          </button>
        }
      />
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  )
}
