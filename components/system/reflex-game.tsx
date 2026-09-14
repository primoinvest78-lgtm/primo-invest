"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

const GAME_SECONDS = 20;

function randomPosition() {
  return { x: 10 + Math.random() * 80, y: 12 + Math.random() * 76 };
}

export function ReflexGame() {
  const [status, setStatus] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [target, setTarget] = useState(randomPosition());
  const [pop, setPop] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    if (status !== "playing" || timeLeft <= 0) return;
    const id = setTimeout(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        if (next <= 0) {
          setStatus("done");
          setBest((b) => Math.max(b, score));
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [status, timeLeft, score]);

  const start = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setTarget(randomPosition());
    setStatus("playing");
  }, []);

  const hit = useCallback(() => {
    setScore((s) => s + 1);
    setTarget(randomPosition());
    setPop((p) => p + 1);
  }, []);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-white/70">Reflexo Primo</span>
        {status === "playing" ? (
          <span className="flex items-center gap-3 font-bold text-white">
            <span>
              Pontos: <span className="text-primary">{score}</span>
            </span>
            <span className="tabular-nums">{timeLeft}s</span>
          </span>
        ) : null}
      </div>

      <div className="relative h-56 w-full overflow-hidden rounded-xl border border-white/15 bg-white/5 sm:h-64">
        {status === "idle" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-white/70">
              Clique no ponto verde o mais rápido que conseguir por {GAME_SECONDS} segundos.
            </p>
            <button
              type="button"
              onClick={start}
              className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-transform duration-150 hover:scale-105"
            >
              Jogar enquanto isso
            </button>
          </div>
        ) : null}

        {status === "playing" ? (
          <motion.button
            key={pop}
            type="button"
            onClick={hit}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_22px_rgba(46,204,155,0.65)]"
            aria-label="Alvo"
          />
        ) : null}

        {status === "done" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-label font-bold uppercase text-white/50">Tempo esgotado</p>
            <p className="text-3xl font-bold text-white">
              {score} <span className="text-base font-semibold text-white/60">pontos</span>
            </p>
            {best > 0 ? (
              <p className="text-xs text-white/50">Melhor pontuação nesta visita: {best}</p>
            ) : null}
            <button
              type="button"
              onClick={start}
              className="rounded-full border border-white/25 px-5 py-2 text-sm font-bold text-white transition-colors duration-150 hover:border-primary hover:text-primary"
            >
              Jogar novamente
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
