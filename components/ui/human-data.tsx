import { humanizeChanges, humanizeEntries } from "@/lib/utils/humanize";

/** Lista legível de dados (substitui qualquer exibição de JSON bruto). */
export function HumanData({ data, empty = "Sem detalhes adicionais." }: { data: Record<string, unknown> | null | undefined; empty?: string }) {
  const entries = humanizeEntries(data);
  if (entries.length === 0) return <p className="text-xs text-card-beige-muted-foreground">{empty}</p>;
  return (
    <dl className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
      {entries.map((e) => (
        <div key={e.label} className="min-w-0">
          <dt className="font-semibold text-foreground">{e.label}</dt>
          <dd className="break-words text-card-beige-muted-foreground">{e.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** "O que mudou" entre duas versões de um registro. */
export function HumanChanges({ before, after }: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }) {
  const changes = humanizeChanges(before, after);
  if (changes.length === 0) return <p className="text-xs text-card-beige-muted-foreground">Nenhuma alteração de conteúdo visível.</p>;
  const creation = !before;
  const removal = !after;
  return (
    <div className="space-y-1">
      {changes.map((c) => (
        <div key={c.label} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs">
          <span className="font-semibold text-foreground">{c.label}: </span>
          {creation ? (
            <span>{c.after}</span>
          ) : removal ? (
            <span className="line-through">{c.before}</span>
          ) : (
            <>
              <span className="text-card-beige-muted-foreground line-through">{c.before}</span> → <span className="text-foreground">{c.after}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
