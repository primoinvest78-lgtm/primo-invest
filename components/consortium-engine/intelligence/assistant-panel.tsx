"use client";

import { motion } from "motion/react";
import { useState, type FormEvent } from "react";

import { Feedback, Field, NativeSelect, Section, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAssistantAction } from "@/lib/actions/consortium-intelligence";
import { AGENTS, TOOL_LABEL } from "@/lib/consortium-intelligence/agents";
import type { AssistantAnswer } from "@/lib/consortium-intelligence/assistant";

const SUGGESTIONS = [
  "Por que a cota 940 não foi contemplada?",
  "Qual regra foi utilizada?",
  "Qual resultado da Loteria Federal foi utilizado?",
  "Mostre a sequência de cálculo.",
  "Quais cotas foram consideradas inelegíveis?",
  "Quantas contemplações ocorreram?",
  "Existe alguma inconsistência nesta assembleia?",
  "Quem alterou essa regra? Qual versão estava publicada?",
  "Houve retificação?",
  "O cálculo pode ser reproduzido?",
  "Qual foi o crédito líquido? Quanto falta para quitar?",
];

type Turn = { question: string; answer: AssistantAnswer };

export function AssistantPanel({ assemblies }: { assemblies: { value: string; label: string }[] }) {
  const [assemblyId, setAssemblyId] = useState(assemblies[0]?.value ?? "");
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const { pending, errors, execute } = useEngineAction();

  function ask(q: string) {
    if (!q.trim()) return;
    execute(() => askAssistantAction(q, assemblyId || null), (r) => {
      if (r.data) setTurns((t) => [{ question: q, answer: r.data! }, ...t]);
      setQuestion("");
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    ask(question);
  }

  return (
    <Section
      title="Assistente do motor"
      subtitle="Responde só com dados estruturados, por ferramentas limitadas, e sempre mostra de onde veio. Não publica, não altera, não aprova, não libera."
    >
      <div className="space-y-4">
        <form onSubmit={submit} className="grid gap-2 md:grid-cols-[260px_1fr_auto]">
          <Field label="Assembleia">
            <NativeSelect value={assemblyId} onChange={setAssemblyId} options={assemblies.length ? assemblies : [{ value: "", label: "Nenhuma assembleia" }]} />
          </Field>
          <Field label="Pergunta">
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ex.: Por que a cota 940 não foi contemplada?" />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={pending || !question.trim()}>
              {pending ? "Consultando…" : "Perguntar"}
            </Button>
          </div>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="rounded-full border border-white/10 bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:border-primary/60 px-3 py-1 text-xs font-medium transition-all"
            >
              {s}
            </button>
          ))}
        </div>
        <Feedback errors={errors} />
        <div className="space-y-3">
          {turns.map((t, i) => {
            const agent = AGENTS.find((a) => a.id === t.answer.agent);
            return (
              <motion.div key={turns.length - i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 rounded-xl border border-black/10 p-3">
                <p className="text-sm font-semibold">{t.question}</p>
                <div className="space-y-1 text-sm">
                  {t.answer.answer.map((l, j) => (
                    <p key={j}>{l}</p>
                  ))}
                </div>
                {t.answer.evidence.length ? (
                  <div className="space-y-1 rounded-lg bg-black/5 p-2 text-xs">
                    <p className="font-semibold">Evidência</p>
                    {t.answer.evidence.map((e, j) => (
                      <p key={j}>
                        {[e.source && `Fonte: ${e.source}`, e.rule && `Regra: ${e.rule}`, e.version !== undefined && e.version !== null && `Versão: ${e.version}`, e.calculation && `Cálculo: ${e.calculation}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ))}
                  </div>
                ) : null}
                <p className="text-[11px] text-card-beige-muted-foreground">
                  {agent?.name ?? "Assistente"} · consultas: {t.answer.tools.map((x) => TOOL_LABEL[x]).join(", ") || "nenhuma"} · resposta calculada a partir dos dados do sistema
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
