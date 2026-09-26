"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import styles from "@/components/help/help.module.css";

export type SearchEntry = { slug: string; title: string; group: string; summary: string; headings: string[]; text: string };

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Página inicial da ajuda: busca por módulo, botão ou função, e os módulos na ordem do menu. */
export function HelpSearch({ entries, groups }: { entries: SearchEntry[]; groups: string[] }) {
  const [query, setQuery] = useState("");
  const q = normalize(query.trim());

  const results = useMemo(() => {
    if (!q) return null;
    const words = q.split(/\s+/);
    return entries
      .map((e) => {
        const hay = normalize(`${e.title} ${e.summary} ${e.headings.join(" ")} ${e.text}`);
        if (!words.every((w) => hay.includes(w))) return null;
        const heading = e.headings.find((h) => words.some((w) => normalize(h).includes(w)));
        const score = (normalize(e.title).includes(q) ? 10 : 0) + (heading ? 3 : 0);
        return { e, heading, score };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score) as { e: SearchEntry; heading?: string; score: number }[];
  }, [entries, q]);

  const card = (e: SearchEntry, heading?: string) => (
    <Link key={e.slug} href={`/ajuda/${e.slug}`} className={styles.card}>
      <h3>{e.title}</h3>
      <p>{e.summary}</p>
      {heading ? <p className={styles.match}>Encontrado em: {heading}</p> : null}
    </Link>
  );

  return (
    <>
      <section className={styles.hero}>
        <h1>Como podemos ajudar?</h1>
        <p>Manual de uso de cada módulo do Primo Invest: o que cada botão faz, cada filtro, cada mensagem — na mesma ordem do menu do sistema.</p>
        <label htmlFor="busca-ajuda" style={{ position: "absolute", left: -9999 }}>
          Buscar na ajuda
        </label>
        <input
          id="busca-ajuda"
          className={styles.search}
          type="search"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          placeholder="Busque um módulo, botão ou função (ex.: roleta, parcela em atraso, liberar usuário)"
        />
      </section>

      {results ? (
        <div className={styles.groups}>
          <div>
            <h2 className={styles.groupTitle}>
              {results.length} {results.length === 1 ? "resultado" : "resultados"}
            </h2>
            {results.length ? (
              <div className={styles.cards}>{results.map((r) => card(r.e, r.heading))}</div>
            ) : (
              <p className={styles.empty}>Nada encontrado. Tente outra palavra, como o nome do botão que aparece na tela.</p>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.groups}>
          {groups.map((g) => (
            <div key={g}>
              <h2 className={styles.groupTitle}>{g}</h2>
              <div className={styles.cards}>{entries.filter((e) => e.group === g).map((e) => card(e))}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
