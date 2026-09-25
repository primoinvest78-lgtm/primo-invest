import Link from "next/link";

import { DemoRoulette } from "@/components/consortium-engine/demo-roulette";
import { requireActiveMembership } from "@/lib/supabase/session";

/**
 * Treinamento · Roleta — demonstração do sorteio próprio com grupo
 * fictício. Nada é lido nem gravado no banco. Para remover: apagar esta
 * pasta, components/consortium-engine/demo-roulette.tsx,
 * lib/actions/consortium-demo.ts, lib/consortium-engine/demo.ts e o
 * link no cabeçalho de /consorcios/motor.
 */
export default async function TreinamentoRoletaPage() {
  await requireActiveMembership();
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-white/10 p-5 shadow-panel-3d block-navy-3d md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <Link href="/consorcios/motor" className="text-label font-bold uppercase text-primary hover:underline">
            Motor de apuração
          </Link>
          <h1 className="mt-2 text-h1 font-bold tracking-[-0.04em] text-secondary-foreground">Treinamento · Roleta</h1>
          <p className="mt-2 max-w-3xl text-body text-secondary-foreground/75">
            Pratique o sorteio próprio do começo ao fim: selo prévio, roleta, apuração das cotas e conferência. Grupo fictício, sem risco para os dados reais.
          </p>
        </div>
      </section>
      <DemoRoulette />
    </div>
  );
}
