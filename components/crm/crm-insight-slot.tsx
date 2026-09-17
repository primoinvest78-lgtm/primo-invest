import { Sparkles } from "lucide-react";

import { buildCrmDigest } from "@/lib/crm/intelligence";
import type { CrmSignalBundle } from "@/lib/crm/signals";

/**
 * Onde a narrativa por IA do Hub CRM vai aparecer quando o modelo for
 * plugado — hoje mostra só o estado "em preparação" (ver
 * `lib/crm/intelligence.ts`), nunca uma narrativa fabricada.
 */
export function CrmInsightSlot({ bundle }: { bundle: CrmSignalBundle }) {
  const digest = buildCrmDigest(bundle);

  return (
    <section className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-label font-bold uppercase text-primary">Em preparação</p>
          <h3 className="mt-1 text-body font-bold text-foreground">Leitura do book por IA</h3>
          <p className="mt-1 text-body-sm text-card-beige-muted-foreground">
            Quando disponível, vai narrar em texto — sempre a partir dos {digest.totalSignals}{" "}
            {digest.totalSignals === 1 ? "sinal real deste book" : "sinais reais deste book"}, nunca de
            suposição — os principais riscos, oportunidades e o que priorizar primeiro hoje.
          </p>
        </div>
      </div>
    </section>
  );
}
