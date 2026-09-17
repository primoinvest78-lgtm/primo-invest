import { Sparkles } from "lucide-react";

import { buildExecutiveSummaryInput } from "@/lib/reports/intelligence";
import type { ReportPayload } from "@/lib/reports/types";

/**
 * Onde o Resumo Executivo por IA vai aparecer quando o modelo for
 * plugado — hoje mostra só o estado "em preparação", nunca um resumo
 * fabricado (ver `lib/reports/intelligence.ts`).
 *
 * Chama `buildExecutiveSummaryInput` mesmo sem gerar nada: é a prova de
 * que o material factual já está pronto — só falta a geração em si.
 * Fica fora da impressão: é um indicador de roadmap da tela, não parte
 * do documento que circula.
 */
export function ExecutiveSummarySlot({ payload }: { payload: ReportPayload }) {
  const input = buildExecutiveSummaryInput(payload);

  return (
    <section
      data-print-hide
      className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] p-5 md:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Em preparação</p>
          <h3 className="mt-1 text-body font-bold text-foreground">Resumo Executivo por IA</h3>
          <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
            Quando disponível, vai narrar em texto — sempre a partir dos {input.facts.length}{" "}
            {input.facts.length === 1 ? "indicador deste documento" : "indicadores deste documento"},
            nunca de suposição — as principais mudanças, a evolução patrimonial, pontos de atenção,
            oportunidades e movimentações relevantes do período.
          </p>
        </div>
      </div>
    </section>
  );
}
