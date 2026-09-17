/**
 * Geração do feed iCalendar (.ics) — RFC 5545, sem depender de nenhuma
 * biblioteca externa (é um formato de texto simples, bem documentado).
 *
 * Padrão de mercado pra isso ser um feed de ASSINATURA, não uma
 * exportação avulsa: UID estável por evento (a mesma tarefa gera
 * sempre o mesmo UID, senão o Google/Outlook duplica o evento a cada
 * atualização), DTSTAMP em UTC, sem VTIMEZONE (mais simples e livre de
 * bug de fuso — os horários já saem em UTC com sufixo Z).
 */

export type CalendarFeedTask = {
  taskId: string;
  title: string;
  description: string | null;
  dueAt: string;
  status: string;
  priority: string;
  category: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluída",
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Baixa",
  normal: "Média",
  high: "Alta",
  urgent: "Urgente",
};

/** Escapa vírgula, ponto e vírgula, barra invertida e quebra de linha — exigido pelo RFC 5545. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Quebra linhas com mais de 75 octetos — o RFC exige "folding" com espaço na continuação. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  parts.push(rest);
  return parts.join("\r\n");
}

function toIcsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/**
 * Um evento por tarefa com prazo. `taskId` vira o UID (com domínio
 * fixo) — regenerar o feed nunca cria um evento duplicado no
 * calendário do usuário, porque o UID é sempre o mesmo pra mesma
 * tarefa.
 */
function buildEvent(task: CalendarFeedTask, generatedAt: string): string {
  const status = task.status === "completed" ? "CONFIRMED" : task.status === "cancelled" ? "CANCELLED" : "CONFIRMED";
  const summaryParts = [task.title];
  if (task.priority && task.priority !== "normal") {
    summaryParts.push(`[${PRIORITY_LABEL[task.priority] ?? task.priority}]`);
  }

  const descriptionParts = [
    task.description ?? "",
    `Situação: ${STATUS_LABEL[task.status] ?? task.status}`,
    task.category ? `Categoria: ${task.category}` : null,
  ].filter((p): p is string => Boolean(p));

  const lines = [
    "BEGIN:VEVENT",
    `UID:${task.taskId}@primoinvest.app`,
    `DTSTAMP:${toIcsDate(generatedAt)}`,
    `DTSTART:${toIcsDate(task.dueAt)}`,
    `SUMMARY:${escapeText(summaryParts.join(" "))}`,
    `DESCRIPTION:${escapeText(descriptionParts.join("\\n"))}`,
    `STATUS:${status}`,
    `CATEGORIES:${escapeText(task.category ?? "Tarefa")}`,
    "END:VEVENT",
  ];

  return lines.map(foldLine).join("\r\n");
}

/**
 * Monta o VCALENDAR completo. `calendarName` vira o nome exibido no
 * app de calendário do usuário (X-WR-CALNAME é lido por
 * Google/Outlook/Apple, embora não faça parte do RFC original).
 */
export function buildIcsFeed(tasks: CalendarFeedTask[], calendarName: string): string {
  const generatedAt = new Date().toISOString();
  const events = tasks.map((t) => buildEvent(t, generatedAt)).join("\r\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Primo Invest//Report Center Calendar Feed//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    "X-WR-TIMEZONE:UTC",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    events,
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n") + "\r\n";
}

/** URLs que o usuário cola no app de calendário. `webcal://` sinaliza assinatura viva. */
export function calendarFeedUrls(origin: string, token: string) {
  const path = `/api/integracoes/calendario/${token}.ics`;
  const httpsUrl = `${origin}${path}`;
  const webcalUrl = `webcal://${origin.replace(/^https?:\/\//, "")}${path}`;
  return { httpsUrl, webcalUrl };
}
