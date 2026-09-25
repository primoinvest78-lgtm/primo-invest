"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { ActionButton, Feedback, Field, Hash, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { commitOwnDraw, revealOwnDraw } from "@/lib/actions/consortium-engine";
import { verifyOwnDraw, type OwnDrawVerification } from "@/lib/consortium-engine/own-draw.ts";
import type { AssemblyStatus } from "@/lib/consortium-engine/state-machine.ts";
import type { OwnDrawRecordView } from "@/lib/data/consortium-engine";
import { formatDate } from "@/lib/utils/format";

const SEGMENTS = 10;
const SEG_ANGLE = 360 / SEGMENTS;
const SPIN_MS = 1900;
const DRUM_H = 44;

/** Roda de 0 a 9. Só ANIMA um número já sorteado — nunca decide nada. */
function Wheel({ rotation, spinning }: { rotation: number; spinning: boolean }) {
  const r = 92;
  const c = 100;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[220px]">
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
        <div className="h-0 w-0 border-x-[11px] border-t-[18px] border-x-transparent border-t-primary drop-shadow" />
      </div>
      <motion.svg
        viewBox="0 0 200 200"
        className="h-full w-full drop-shadow-[0_10px_24px_rgba(8,20,44,0.35)]"
        animate={{ rotate: rotation }}
        transition={{ duration: spinning ? SPIN_MS / 1000 : 0, ease: [0.16, 0.84, 0.3, 1] }}
      >
        {Array.from({ length: SEGMENTS }, (_, k) => {
          // Segmento k centrado em k·36° (0° = topo, sentido horário).
          const a0 = ((k * SEG_ANGLE - SEG_ANGLE / 2 - 90) * Math.PI) / 180;
          const a1 = ((k * SEG_ANGLE + SEG_ANGLE / 2 - 90) * Math.PI) / 180;
          const mid = ((k * SEG_ANGLE - 90) * Math.PI) / 180;
          const even = k % 2 === 0;
          return (
            <g key={k}>
              <path
                d={`M${c},${c} L${c + r * Math.cos(a0)},${c + r * Math.sin(a0)} A${r},${r} 0 0 1 ${c + r * Math.cos(a1)},${c + r * Math.sin(a1)} Z`}
                fill={even ? "var(--secondary)" : "var(--primary)"}
                stroke="var(--card)"
                strokeWidth={1.5}
              />
              <text
                x={c + r * 0.72 * Math.cos(mid)}
                y={c + r * 0.72 * Math.sin(mid)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={17}
                fontWeight={800}
                fill={even ? "var(--secondary-foreground)" : "var(--primary-foreground)"}
                transform={`rotate(${k * SEG_ANGLE} ${c + r * 0.72 * Math.cos(mid)} ${c + r * 0.72 * Math.sin(mid)})`}
              >
                {k}
              </text>
            </g>
          );
        })}
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--secondary)" strokeWidth={4} />
        <circle cx={c} cy={c} r={20} fill="var(--card)" stroke="var(--secondary)" strokeWidth={3} />
        <circle cx={c} cy={c} r={6} fill="var(--primary)" />
      </motion.svg>
    </div>
  );
}

/** Um algarismo que rola até parar no valor. */
function Drum({ digit, rolling, delay }: { digit: number | null; rolling: boolean; delay: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-secondary text-secondary-foreground shadow-inner" style={{ height: DRUM_H, width: 34 }}>
      <motion.div
        animate={{ y: digit === null ? 0 : -(10 + digit) * DRUM_H }}
        transition={{ duration: rolling ? 1.1 + delay : 0, ease: [0.2, 0.9, 0.3, 1] }}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="flex items-center justify-center font-mono text-xl font-bold" style={{ height: DRUM_H }}>
            {digit === null && i === 0 ? "·" : i % 10}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Roleta de apresentação: gira uma vez por prêmio e revela os números já
 * definidos (sorteio próprio selado ou resultado da Loteria Federal).
 */
export function NumberRoulette({
  prizes,
  digits,
  play,
  onDone,
  idle = false,
}: {
  prizes: string[];
  digits: number;
  play: boolean;
  onDone?: () => void;
  /** Roleta parada, antes do sorteio: tambores vazios. */
  idle?: boolean;
}) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [prevPlay, setPrevPlay] = useState(play);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cada novo "play" recomeça do primeiro prêmio (ajuste durante o render,
  // sem efeito em cascata). Parado, a roleta mostra todos os números.
  if (play !== prevPlay) {
    setPrevPlay(play);
    if (play) setRevealedCount(0);
  }
  const shown = idle ? 0 : play ? revealedCount : prizes.length;
  const setShown = setRevealedCount;

  useEffect(() => {
    if (!play) return;
    let i = 0;
    let rot = 0;
    const step = () => {
      if (i >= prizes.length) {
        setSpinning(false);
        onDone?.();
        return;
      }
      const last = Number(prizes[i].slice(-1));
      const target = (360 - last * SEG_ANGLE) % 360;
      rot = rot - (rot % 360) + 360 * 4 + target;
      setSpinning(true);
      setRotation(rot);
      const idx = i;
      timer.current = setTimeout(() => {
        setShown(idx + 1);
        i += 1;
        timer.current = setTimeout(step, 450);
      }, SPIN_MS);
    };
    timer.current = setTimeout(step, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // Reinicia só quando a lista de números muda ou quando o play liga.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, prizes.join(",")]);

  function skip() {
    if (timer.current) clearTimeout(timer.current);
    setSpinning(false);
    setShown(prizes.length);
    onDone?.();
  }

  const animating = play && shown < prizes.length;

  return (
    <div className="grid items-center gap-6 md:grid-cols-[220px_1fr]">
      <Wheel rotation={rotation} spinning={spinning} />
      <div className="space-y-2">
        {prizes.map((p, i) => {
          const visible = i < shown;
          const current = animating && i === shown;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
                current ? "border-primary bg-primary/10" : visible ? "border-black/10" : "border-dashed border-black/15"
              }`}
            >
              <span className="w-16 shrink-0 text-[11px] font-bold uppercase text-card-beige-muted-foreground">{i + 1}º prêmio</span>
              <div className="flex gap-1">
                {Array.from({ length: digits }, (_, j) => (
                  <Drum key={j} digit={visible || current ? Number(p[j]) : null} rolling={play} delay={j * 0.12} />
                ))}
              </div>
            </motion.div>
          );
        })}
        {animating ? (
          <Button size="xs" variant="outline" onClick={skip}>
            Pular animação
          </Button>
        ) : null}
      </div>
    </div>
  );
}

const SEAL_STATUSES: AssemblyStatus[] = ["SCHEDULED", "PREPARING", "ELIGIBILITY_LOCKED"];

function Step({ n, title, done, active, children }: { n: number; title: string; done: boolean; active: boolean; children?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: n * 0.05 }}
      className={`rounded-xl border p-3 transition-all hover:-translate-y-0.5 ${
        done ? "border-primary/40 bg-primary/10" : active ? "border-primary" : "border-black/10"
      }`}
    >
      <p className="text-xs font-bold">
        <span className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${done ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
          {done ? "✓" : n}
        </span>
        {title}
      </p>
      {children ? <div className="mt-1.5 text-xs text-card-beige-muted-foreground">{children}</div> : null}
    </motion.div>
  );
}

function downloadEvidence(assemblyNumber: number, d: OwnDrawRecordView) {
  const lines = [
    `Sorteio próprio — Assembleia nº ${assemblyNumber}`,
    "",
    `Selo prévio registrado em: ${d.committedAt}`,
    `Selo prévio (impressão digital publicada antes do sorteio): ${d.commitmentHash}`,
    `Sorteio realizado em: ${d.revealedAt ?? "-"}`,
    `Segredo revelado: ${d.revealedSeed ?? "-"}`,
    `Frase pública e horário: ${d.publicEntropy ?? "-"}`,
    `Números sorteados, na ordem: ${(d.prizes ?? []).join(", ")}`,
    "",
    "Como conferir, sem depender do sistema:",
    "1. Calcule o SHA-256 do texto do segredo revelado. Ele deve ser igual ao selo prévio.",
    "2. Para cada prêmio i (1, 2, 3...), comece com a tentativa t = 0 e calcule o SHA-256 do texto",
    "   segredo|frase pública e horário|i|t",
    "3. Pegue os 15 primeiros caracteres do resultado, leia como número hexadecimal, divida por",
    `   10 elevado a ${d.prizeDigits ?? "N"} e fique com o resto. Complete com zeros à esquerda.`,
    "4. Se o número já saiu antes, some 1 à tentativa e repita. O resultado deve bater com a lista acima.",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sorteio-proprio-assembleia-${assemblyNumber}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function OwnDrawPanel({
  assemblyId,
  assemblyNumber,
  status,
  ownDraw,
  canOperate,
  canGovern,
  ruleIsOwnDraw,
  prizeDigits,
}: {
  assemblyId: string;
  assemblyNumber: number;
  status: AssemblyStatus;
  ownDraw: OwnDrawRecordView | null;
  canOperate: boolean;
  canGovern: boolean;
  /** null = a regra ainda não foi escolhida (antes de travar a elegibilidade). */
  ruleIsOwnDraw: boolean | null;
  prizeDigits: number;
}) {
  const [phrase, setPhrase] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [play, setPlay] = useState(false);
  const [freshPrizes, setFreshPrizes] = useState<string[] | null>(null);
  const [check, setCheck] = useState<OwnDrawVerification | null>(null);
  const [checking, setChecking] = useState(false);
  const { pending, errors, message, execute } = useEngineAction();

  const sealed = Boolean(ownDraw);
  const revealed = Boolean(ownDraw?.revealedAt);
  const prizes = freshPrizes ?? ownDraw?.prizes ?? null;
  const digits = ownDraw?.prizeDigits ?? prizeDigits;

  async function runCheck() {
    if (!ownDraw) return;
    setChecking(true);
    try {
      setCheck(await verifyOwnDraw(ownDraw));
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Step n={1} title="Selo prévio" done={sealed} active={!sealed}>
          {sealed ? (
            <>
              Registrado em {formatDate(ownDraw!.committedAt)}. <Hash value={ownDraw!.commitmentHash} label="selo prévio" />
            </>
          ) : (
            "Antes da assembleia, o sistema sorteia um segredo e publica só a impressão digital dele. Depois disso, ninguém consegue trocar o resultado."
          )}
        </Step>
        <Step n={2} title="Sorteio na roleta" done={revealed} active={sealed && !revealed}>
          {revealed
            ? `Realizado em ${formatDate(ownDraw!.revealedAt!)}${ownDraw!.publicPhrase ? ` · frase: “${ownDraw!.publicPhrase}”` : ""}.`
            : "Com a elegibilidade travada, alguém de governança gira a roleta. A frase dita pelos participantes entra no cálculo."}
        </Step>
        <Step n={3} title="Conferência" done={Boolean(check?.ok)} active={revealed}>
          Qualquer pessoa refaz a conta e confirma que o segredo é o do selo e que os números saíram dele.
        </Step>
      </div>

      {!sealed ? (
        ruleIsOwnDraw === false ? (
          <p className="text-sm text-card-beige-muted-foreground">A regra desta assembleia usa outra fonte de sorteio. A roleta não se aplica.</p>
        ) : SEAL_STATUSES.includes(status) && canOperate ? (
          <ActionButton
            label="Registrar selo prévio"
            confirm="Registrar o selo prévio do sorteio desta assembleia? Ele não pode ser trocado depois."
            action={() => commitOwnDraw(assemblyId)}
          />
        ) : (
          <p className="text-sm text-amber-700">
            {SEAL_STATUSES.includes(status) ? "Seu papel não permite registrar o selo prévio." : "O selo prévio precisava ser registrado antes de travar o resultado."}
          </p>
        )
      ) : null}

      {sealed && !revealed ? (
        status !== "ELIGIBILITY_LOCKED" ? (
          <p className="text-sm text-card-beige-muted-foreground">
            {status === "SCHEDULED" || status === "PREPARING"
              ? "Selo registrado. Trave a elegibilidade para liberar o sorteio."
              : "O sorteio só acontece com a elegibilidade travada."}
          </p>
        ) : !canGovern ? (
          <p className="text-sm text-amber-700">Aguardando alguém de governança (administrador, gestor ou compliance) girar a roleta.</p>
        ) : (
          <div className="space-y-3 rounded-xl border border-black/10 p-4">
            <Field label="Frase pública (opcional)" hint="Peça aos participantes uma frase qualquer e digite aqui na hora. Ela entra no cálculo e fica registrada na ata.">
              <Input value={phrase} maxLength={200} onChange={(e) => setPhrase(e.target.value)} placeholder="Ex.: bom dia a todos do grupo" />
            </Field>
            {confirming ? (
              <div className="space-y-2 rounded-lg border border-black/10 bg-black/5 p-3">
                <p className="text-xs font-medium">Girar a roleta agora? O resultado é definitivo e é travado nesta assembleia.</p>
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    disabled={pending}
                    onClick={() =>
                      execute(
                        () => revealOwnDraw(assemblyId, phrase),
                        (r) => {
                          setConfirming(false);
                          setFreshPrizes(r.data?.prizes ?? null);
                          setPlay(true);
                        },
                      )
                    }
                  >
                    {pending ? "Sorteando…" : "Confirmar e girar"}
                  </Button>
                  <Button size="xs" variant="outline" disabled={pending} onClick={() => setConfirming(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setConfirming(true)}>Girar a roleta</Button>
            )}
          </div>
        )
      ) : null}

      <Feedback errors={errors} message={message} />

      {prizes && prizes.length ? (
        <div className="space-y-4">
          <NumberRoulette prizes={prizes} digits={digits} play={play} onDone={() => setPlay(false)} />
          <p className="text-[11px] text-card-beige-muted-foreground">
            A animação apenas mostra os números já gravados. Eles vêm do segredo selado antes da assembleia combinado com a frase pública.
          </p>
          {revealed || freshPrizes ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={play} onClick={() => setPlay(true)}>
                Rever na roleta
              </Button>
              <Button size="sm" variant="outline" disabled={checking || !ownDraw?.revealedSeed} onClick={runCheck}>
                {checking ? "Conferindo…" : "Conferir sorteio"}
              </Button>
              <Button size="sm" variant="outline" disabled={!ownDraw?.revealedSeed} onClick={() => ownDraw && downloadEvidence(assemblyNumber, ownDraw)}>
                Baixar dados para conferência
              </Button>
            </div>
          ) : null}
          {check ? (
            <div className="space-y-1.5">
              {check.checks.map((c) => (
                <p
                  key={c.label}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium ${c.ok ? "border-primary/30 bg-primary/10" : "border-destructive/30 bg-destructive/10 text-destructive"}`}
                >
                  {c.ok ? "✓" : "✗"} <strong>{c.label}:</strong> {c.detail}
                </p>
              ))}
              <p className="text-[11px] text-card-beige-muted-foreground">A conferência foi feita no seu próprio navegador, sem consultar o servidor.</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
