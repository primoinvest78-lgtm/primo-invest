"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Feedback, Field, Section, useEngineAction } from "@/components/consortium-engine/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRuleDraftFromDocument, previewRuleExtraction } from "@/lib/actions/consortium-intelligence";
import type { RuleExtraction } from "@/lib/consortium-intelligence/document-extraction";
import { CONFIDENCE_LABEL } from "@/lib/consortium-intelligence/findings";

/**
 * Documento → extração → REGRA EM RASCUNHO → revisão → aprovação →
 * publicação. A extração nunca publica nada.
 */
export function DocumentPanel() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<RuleExtraction | null>(null);
  const [meta, setMeta] = useState({ ruleKey: "", name: "", administratorName: "", effectiveFrom: "", regulationReference: "" });
  const prev = useEngineAction();
  const create = useEngineAction();

  return (
    <Section title="Regulamento → regra (rascunho)" subtitle="Cole o trecho do regulamento que descreve a apuração. O extrator propõe a configuração campo a campo, com confiança e trecho de origem.">
      <div className="space-y-4">
        <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Serão formadas 10 centenas... junção dos 3º, 4º e 5º algarismos do 1º prêmio..." />
        <Button size="sm" variant="outline" disabled={prev.pending} onClick={() => prev.execute(() => previewRuleExtraction(text), (r) => setPreview(r.data ?? null))}>
          {prev.pending ? "Extraindo…" : "Extrair (pré-visualizar)"}
        </Button>
        <Feedback errors={prev.errors} />
        {preview ? (
          <div className="space-y-3">
            {preview.warnings.length ? (
              <ul className="list-disc space-y-0.5 rounded-lg border border-amber-500/50 bg-amber-500/5 p-3 pl-6 text-xs">
                {preview.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            ) : null}
            <div className="space-y-1.5">
              {preview.fields.map((f) => (
                <div key={f.field} className="rounded-lg border border-black/10 px-3 py-1.5 text-sm">
                  <p>
                    <span className="font-semibold">{f.label}:</span> {String(f.value)}{" "}
                    <span className={`text-xs ${f.confidence === "HIGH" ? "text-primary" : f.confidence === "LOW" ? "text-destructive" : "text-amber-700"}`}>
                      · confiança {CONFIDENCE_LABEL[f.confidence]}
                    </span>
                  </p>
                  {f.evidence ? <p className="text-[11px] italic text-card-beige-muted-foreground">“{f.evidence}”</p> : null}
                </div>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-5">
              <Field label="Chave">
                <Input value={meta.ruleKey} onChange={(e) => setMeta({ ...meta, ruleKey: e.target.value })} />
              </Field>
              <Field label="Nome">
                <Input value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} />
              </Field>
              <Field label="Administradora">
                <Input value={meta.administratorName} onChange={(e) => setMeta({ ...meta, administratorName: e.target.value })} />
              </Field>
              <Field label="Vigente desde">
                <Input type="date" value={meta.effectiveFrom} onChange={(e) => setMeta({ ...meta, effectiveFrom: e.target.value })} />
              </Field>
              <Field label="Regulamento / cláusula">
                <Input value={meta.regulationReference} onChange={(e) => setMeta({ ...meta, regulationReference: e.target.value })} />
              </Field>
            </div>
            <Button
              size="sm"
              disabled={create.pending}
              onClick={() =>
                create.execute(() => createRuleDraftFromDocument({ text, ...meta }), (r) => {
                  if (r.data?.id) router.push(`/consorcios/motor/regras/${r.data.id}`);
                })
              }
            >
              {create.pending ? "Criando…" : "Criar regra em RASCUNHO"}
            </Button>
            <Feedback errors={create.errors} message={create.message} />
          </div>
        ) : null}
      </div>
    </Section>
  );
}
