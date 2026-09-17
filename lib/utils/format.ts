export function formatCurrencyBRL(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  // Colunas `date` do Postgres voltam como "YYYY-MM-DD" puro, sem hora.
  // `new Date("YYYY-MM-DD")` interpreta isso como meia-noite UTC — em
  // qualquer fuso atrás de UTC (Brasília inclusive) isso formata como o
  // dia ANTERIOR. Datas puras não têm hora pra converter; tratamos o
  // ano/mês/dia como já sendo o dia local, sem passar por UTC.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Intl.DateTimeFormat("pt-BR").format(new Date(Number(year), Number(month) - 1, Number(day)));
  }
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}

/** Converte uma chave "YYYY-MM" num rótulo curto em português ("mai/26"). */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  return new Date(year, month - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    .replace(".", "");
}

/** Tempo relativo em português ("há 14 min", "há 2h", "há 3 dias"). */
export function formatRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} ${days === 1 ? "dia" : "dias"}`;
  return formatDate(value);
}
