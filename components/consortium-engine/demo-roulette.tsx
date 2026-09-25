"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";

import { NumberRoulette } from "@/components/consortium-engine/own-draw-panel";
import { Feedback, Field, Section, Stat } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runDemoDraw, type DemoDrawResult } from "@/lib/actions/consortium-demo";
import { DEMO_GROUP, demoSituation, demoSummary } from "@/lib/consortium-engine/demo.ts";
import { formatQuota, labelOf, NUMBER_TYPE_LABEL, OUTCOME_LABEL, REASON_LABEL, VIA_LABEL } from "@/lib/consortium-engine/labels.ts";
import { deriveOwnDrawNumbers, sha256Hex, verifyOwnDraw, type OwnDrawVerification } from "@/lib/consortium-engine/own-draw.ts";
import { formatCurrencyBRL } from "@/lib/utils/format";

type Round = {
  n: number;
  seed: string;
  commitment: string;
  sealedAt: string;
  phrase: string;
  entropy: string | null;
  prizes: string[] | null;
  result: Extract<DemoDrawResult, { ok: true }> | null;
};

type HistoryItem = { n: number; prizes: string[]; quotas: string[] };

const SITUATION_LABEL = { UP_TO_DATE: "Em dia", DELINQUENT: "Inadimplente", CONTEMPLATED: "Já contemplada" } as const;

function randomSeedHex(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function StepCard({ n, title, state, children }: { n: number; title: string; state: "done" | "active" | "waiting"; children: React.ReactNode }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: n * 0.05 }}
      className={`card-premium rounded-2xl p-4 transition-all hover:-translate-y-0.5 ${state === "active" ? "ring-2 ring-primary" : ""} ${state === "waiting" ? "opacity-60" : ""}`}
    >
      <p className="mb-2 flex items-center gap-2 text-sm font-bold">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${state === "done" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          {state === "done" ? "✓" : n}
        </span>
        {title}
      </p>
      <div className="space-y-2 text-xs text-card-beige-muted-foreground">{children}</div>
    </motion.div>
  );
}

export function DemoRoulette() {
  const summary = demoSummary();
  const [round, setRound] = useState<Round | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [phrase, setPhrase] = useState("");
  const [play, setPlay] = useState(false);
  const [check, setCheck] = useState<{ kind: "real" | "fraud"; v: OwnDrawVerification; fake?: string[] } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [pending, startTransition] = useTransition();

  const sealed = Boolean(round);
  const drawn = Boolean(round?.prizes);
  const today = new Date().toISOString().slice(0, 10);

  async function seal() {
    const seed = randomSeedHex();
    setRound({ n: roundNumber, seed, commitment: await sha256Hex(seed), sealedAt: new Date().toISOString(), phrase: "", entropy: null, prizes: null, result: null });
    setCheck(null);
    setErrors([]);
  }

  function spin() {
    if (!round) return;
    setErrors([]);
    startTransition(async () => {
      const entropy = `${phrase.trim() || "sem frase"} | ${new Date().toISOString()}`;
      const prizes = await deriveOwnDrawNumbers(round.seed, entropy, 5, 5);
      const result = await runDemoDraw(prizes, today);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setRound({ ...round, phrase: phrase.trim(), entropy, prizes, result });
      setPlay(true);
      setHistory((h) => [{ n: round.n, prizes, quotas: result.contemplations.map((c) => c.quotaLabel) }, ...h]);
    });
  }

  async function verify(fraud: boolean) {
    if (!round?.prizes || !round.entropy) return;
    let prizes = round.prizes;
    if (fraud) {
      // Troca o último algarismo do 1º prêmio: simula alguém adulterando o resultado.
      const first = prizes[0];
      const last = (Number(first.slice(-1)) + 1) % 10;
      prizes = [first.slice(0, -1) + last, ...prizes.slice(1)];
    }
    const v = await verifyOwnDraw({ commitmentHash: round.commitment, revealedSeed: round.seed, publicEntropy: round.entropy, prizes, prizeDigits: 5 });
    setCheck({ kind: fraud ? "fraud" : "real", v, fake: fraud ? prizes : undefined });
  }

  function newRound() {
    setRound(null);
    setPhrase("");
    setPlay(false);
    setCheck(null);
    setErrors([]);
    setRoundNumber((n) => n + 1);
  }

  const result = round?.result ?? null;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm"
      >
        <strong>Modo demonstração.</strong> Grupo fictício, nada é gravado e você pode fazer quantas rodadas quiser. Na operação real, o segredo fica guardado no
        banco de dados e cada assembleia tem um único sorteio, que não pode ser refeito.
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Cotas do grupo" value={String(summary.total)} />
        <Stat label="Aptas" value={String(summary.eligible)} tone="success" delay={0.03} />
        <Stat label="Inadimplentes" value={String(summary.delinquent)} tone="danger" delay={0.06} />
        <Stat label="Já contempladas" value={String(summary.contemplated)} delay={0.09} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          Rodada {roundNumber} · grupo {DEMO_GROUP.code} · {DEMO_GROUP.plannedContemplations} contemplações por sorteio · crédito de{" "}
          {formatCurrencyBRL(DEMO_GROUP.creditAmount)}
        </p>
        <Button variant="outline" onClick={newRound} disabled={pending || play || !sealed}>
          Nova rodada
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StepCard n={1} title="Selo prévio" state={sealed ? "done" : "active"}>
          <p>O sistema sorteia um segredo e guarda só a marca dele. A partir daqui, ninguém consegue escolher nem trocar o resultado.</p>
          {sealed ? (
            <p className="font-semibold text-primary">✓ Selo registrado às {timeLabel(round!.sealedAt)}</p>
          ) : (
            <Button size="sm" onClick={seal}>
              Registrar selo prévio
            </Button>
          )}
        </StepCard>

        <StepCard n={2} title="Sorteio na roleta" state={drawn ? "done" : sealed ? "active" : "waiting"}>
          <p>Os participantes dizem uma frase qualquer. Ela entra no cálculo junto com o segredo e o horário.</p>
          {sealed && !drawn ? (
            <>
              <Field label="Frase pública (opcional)">
                <Input id="demo-phrase" value={phrase} maxLength={200} onChange={(e) => setPhrase(e.target.value)} placeholder="Ex.: bom dia a todos" />
              </Field>
              <Button size="sm" onClick={spin} disabled={pending}>
                {pending ? "Sorteando…" : "Girar a roleta"}
              </Button>
            </>
          ) : drawn ? (
            <p className="font-semibold text-primary">✓ Sorteado{round!.phrase ? ` com a frase “${round!.phrase}”` : ""}</p>
          ) : null}
        </StepCard>

        <StepCard n={3} title="Conferência" state={check?.kind === "real" && check.v.ok ? "done" : drawn ? "active" : "waiting"}>
          <p>Qualquer pessoa refaz a conta e confirma que o resultado saiu do segredo selado, sem manipulação.</p>
          {drawn && !play ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => verify(false)}>
                Conferir sorteio
              </Button>
              <Button size="sm" variant="outline" onClick={() => verify(true)}>
                Simular fraude
              </Button>
            </div>
          ) : null}
        </StepCard>
      </div>

      <Feedback errors={errors} />

      <Section title="Roleta" subtitle="A roleta gira uma vez para cada prêmio e revela os cinco números sorteados.">
        {round?.prizes ? (
          <div className="space-y-3">
            <NumberRoulette prizes={round.prizes} digits={5} play={play} onDone={() => setPlay(false)} />
            {!play ? (
              <Button size="sm" variant="outline" onClick={() => setPlay(true)}>
                Rever na roleta
              </Button>
            ) : null}
          </div>
        ) : (
          <NumberRoulette prizes={Array<string>(5).fill("00000")} digits={5} play={false} idle />
        )}
      </Section>

      <AnimatePresence>
        {check ? (
          <motion.div key={check.kind + String(check.v.ok)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Section
              title={check.kind === "fraud" ? "Simulação de fraude" : "Resultado da conferência"}
              subtitle={
                check.kind === "fraud"
                  ? `Alteramos o 1º prêmio para ${check.fake?.[0]} e pedimos a conferência. O sistema precisa denunciar.`
                  : "Conta refeita no seu navegador, sem consultar o servidor."
              }
            >
              <div className="space-y-1.5">
                {check.v.checks.map((c) => (
                  <p
                    key={c.label}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium ${c.ok ? "border-primary/30 bg-primary/10" : "border-destructive/30 bg-destructive/10 text-destructive"}`}
                  >
                    {c.ok ? "✓" : "✗"} <strong>{c.label}:</strong> {c.detail}
                  </p>
                ))}
                <p className={`text-sm font-bold ${check.v.ok ? "text-primary" : "text-destructive"}`}>
                  {check.v.ok ? "Sorteio íntegro." : "Adulteração detectada: este resultado seria recusado."}
                </p>
              </div>
            </Section>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {result && !play ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Section title="Cotas contempladas" subtitle="Calculado pelo mesmo motor de apuração usado nas assembleias reais.">
            <div className="grid gap-3 sm:grid-cols-2">
              {result.contemplations.map((c) => (
                <motion.div
                  key={c.sequence}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: c.sequence * 0.12 }}
                  className="rounded-2xl border border-white/10 p-4 text-secondary-foreground shadow-panel-3d block-navy-3d"
                >
                  <p className="text-label font-bold uppercase text-primary">{c.sequence}ª contemplação</p>
                  <p className="mt-1 font-mono text-h1 font-bold">Cota {c.quotaLabel}</p>
                  <p className="text-sm text-secondary-foreground/80">
                    Número sorteado {c.candidateRaw ?? "—"} · {labelOf(VIA_LABEL, c.via)} · crédito {formatCurrencyBRL(c.creditAmount)}
                  </p>
                </motion.div>
              ))}
              {result.contemplations.length === 0 ? <p className="text-sm">Nenhuma cota contemplada: {result.errors.join(" ")}</p> : null}
            </div>
          </Section>

          <Section title="Como o sistema chegou nesse resultado" subtitle="Cada número testado, a cota correspondente e por que foi aceita ou pulada.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-card-beige-muted-foreground">
                    <th className="px-2 py-2">#</th>
                    <th className="px-2 py-2">Número</th>
                    <th className="px-2 py-2">Tipo</th>
                    <th className="px-2 py-2">Cota</th>
                    <th className="px-2 py-2">Situação da cota</th>
                    <th className="px-2 py-2">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {result.attempts.map((a) => (
                    <motion.tr
                      key={a.attempt}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: a.attempt * 0.05 }}
                      className="border-t border-black/5 transition-colors hover:bg-black/5"
                    >
                      <td className="px-2 py-2">{a.attempt}</td>
                      <td className="px-2 py-2 font-mono">{a.numberText}</td>
                      <td className="px-2 py-2">{labelOf(NUMBER_TYPE_LABEL, a.numberType)}</td>
                      <td className="px-2 py-2 font-mono font-bold">{a.quotaNumber !== null ? formatQuota(a.quotaNumber, 3) : "—"}</td>
                      <td className="px-2 py-2">{a.quotaNumber !== null ? SITUATION_LABEL[demoSituation(a.quotaNumber)] : "—"}</td>
                      <td
                        className={`px-2 py-2 font-semibold ${a.outcome === "SELECTED" ? "text-primary" : a.outcome === "INELIGIBLE" || a.outcome === "ELIMINATED" ? "text-destructive" : ""}`}
                      >
                        {labelOf(OUTCOME_LABEL, a.outcome)}
                        {a.reason ? <span className="block text-[11px] font-normal">{labelOf(REASON_LABEL, a.reason)}</span> : null}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-card-beige-muted-foreground">
              Regra da demonstração: valem os três últimos algarismos de cada prêmio; “000” vale a cota 1000; se a cota estiver inadimplente ou já
              contemplada, o sistema tenta a cota seguinte.
            </p>
          </Section>
        </motion.div>
      ) : null}

      {history.length ? (
        <Section title="Rodadas desta apresentação" subtitle="Cada rodada nova gera outro segredo e outro resultado. Nada disso fica gravado.">
          <ul className="space-y-2">
            {history.map((h) => (
              <motion.li
                key={h.n}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm transition-colors hover:bg-black/5"
              >
                <span className="font-semibold">Rodada {h.n}</span>
                <span className="font-mono text-xs">{h.prizes.join(" · ")}</span>
                <span>Contempladas: {h.quotas.join(", ") || "nenhuma"}</span>
              </motion.li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
