import { Sparkles } from "lucide-react";

import { buildIntelligenceDigest } from "@/lib/intelligence/ai";
import type { Insight } from "@/lib/intelligence/types";

/**
 * Onde a narrativa por IA da Central de Inteligência vai aparecer
 * quando o modelo for plugado — hoje mostra só o estado "em
 * preparação" (ver `lib/intelligence/ai.ts`). Nunca narrativa
 * fabricada, nunca "IA detectou" sem IA real conectada.
 */
export function AiNarrativeSlot({ insights }: { insights: Insight[] }) {
  const digest = buildIntelligenceDigest(insights);

  return (
    <section className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Em preparação</p>
          <h3 className="mt-1 text-body font-bold text-foreground">Leitura narrada por IA</h3>
          <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
            Hoje todo insight acima vem de regra determinística, nunca de um modelo — por isso não existe
            &ldquo;resumo por IA&rdquo; ainda. Quando um modelo for plugado, vai narrar em texto — sempre a partir dos{" "}
            {digest.totalInsights} {digest.totalInsights === 1 ? "insight real aberto" : "insights reais abertos"}
            {" "}listados acima — os principais riscos, oportunidades e o que priorizar primeiro. Toda saída
            futura será marcada como gerada por IA e vai depender de confirmação humana, igual às ações de hoje.
          </p>
        </div>
      </div>
    </section>
  );
}
