/**
 * Recorte de período do Report Center.
 *
 * Datas de período chegam como "YYYY-MM-DD" (coluna `date` do Postgres,
 * sem fuso). Formatar isso com `new Date(valor)` interpreta como UTC
 * meia-noite e, no fuso de Brasília (UTC-3), imprime o dia ANTERIOR —
 * aceitável num campo de tabela, inaceitável na capa de um documento
 * que declara o período coberto. Por isso o parsing aqui é textual.
 */

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "2026-03-14" -> "14/03/2026". Nunca desloca o dia por fuso. */
export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

/** "2026-03-14" -> "14 de março de 2026" (usado na capa do documento). */
export function formatDateLong(value: string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return String(value);
  return `${day} de ${MONTHS_PT[month - 1]} de ${year}`;
}

export function buildPeriodLabel(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  if (start && end) return `${formatDateOnly(start)} a ${formatDateOnly(end)}`;
  if (start) return `A partir de ${formatDateOnly(start)}`;
  return `Até ${formatDateOnly(end)}`;
}

/**
 * Compara só a parte "YYYY-MM-DD" — funciona tanto pra colunas `date`
 * quanto pra `timestamptz` (cujo ISO começa pela data), sem converter
 * fuso nem construir Date.
 */
export function withinPeriod(
  value: string | null | undefined,
  start: string | null,
  end: string | null,
): boolean {
  if (!value) return false;
  const day = value.slice(0, 10);
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
}

/** Mesma comparação, mas registro sem data entra no recorte (não some do relatório). */
export function withinPeriodOrUndated(
  value: string | null | undefined,
  start: string | null,
  end: string | null,
): boolean {
  if (!value) return true;
  return withinPeriod(value, start, end);
}

/** Recorta a evolução mensal ("YYYY-MM") pelos limites do período. */
export function filterMonthly<T extends { month: string }>(
  points: T[],
  start: string | null,
  end: string | null,
): T[] {
  if (!start && !end) return points;
  return points.filter((p) => {
    if (start && p.month < start.slice(0, 7)) return false;
    if (end && p.month > end.slice(0, 7)) return false;
    return true;
  });
}

/** Sugestões de período do gerador — sempre datas reais, calculadas na hora. */
export function periodPresets(today = new Date()) {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();

  return [
    {
      id: "mes_atual",
      label: "Mês atual",
      start: iso(new Date(Date.UTC(y, m, 1))),
      end: iso(new Date(Date.UTC(y, m + 1, 0))),
    },
    {
      id: "mes_anterior",
      label: "Mês anterior",
      start: iso(new Date(Date.UTC(y, m - 1, 1))),
      end: iso(new Date(Date.UTC(y, m, 0))),
    },
    {
      id: "trimestre",
      label: "Últimos 3 meses",
      start: iso(new Date(Date.UTC(y, m - 2, 1))),
      end: iso(new Date(Date.UTC(y, m + 1, 0))),
    },
    {
      id: "semestre",
      label: "Últimos 6 meses",
      start: iso(new Date(Date.UTC(y, m - 5, 1))),
      end: iso(new Date(Date.UTC(y, m + 1, 0))),
    },
    {
      id: "ano",
      label: "Ano corrente",
      start: iso(new Date(Date.UTC(y, 0, 1))),
      end: iso(new Date(Date.UTC(y, 11, 31))),
    },
  ] as const;
}
