import fs from "node:fs";
import path from "node:path";

import { marked } from "marked";

/**
 * Central de Ajuda — lê os manuais de docs/ (a mesma fonte versionada no
 * repositório) e os transforma em páginas. Nada é digitado duas vezes:
 * corrigiu o .md, corrigiu a página. As páginas são geradas no build
 * (generateStaticParams), então a leitura do disco acontece só ali.
 */

const ROOT = path.join(process.cwd(), "docs", "Manual de Usabilidade do Software Primo Invest");
const LEGAL_FOLDER = "24 - Política de Privacidade e Termos de Uso";

export type HelpArticle = {
  slug: string;
  title: string;
  folder: string;
  file: string;
};

export type HelpGroup = { title: string; articles: HelpArticle[] };

const a = (slug: string, title: string, folder: string, file?: string): HelpArticle => ({
  slug,
  title,
  folder,
  file: file ?? `Manual de Uso - ${folder.replace(/^\d+ - /, "")}.md`,
});

/** Mesma ordem do menu lateral do sistema, de cima para baixo. */
export const HELP_GROUPS: HelpGroup[] = [
  {
    title: "Primeiros passos",
    articles: [
      a("acesso-e-notificacoes", "Acesso, senha e notificações", "23 - Acesso e Notificações"),
      a("dashboard", "Dashboard", "01 - Dashboard"),
    ],
  },
  {
    title: "Relacionamento",
    articles: [
      a("painel-de-relacionamento", "Painel de Relacionamento", "02 - Painel de Relacionamento"),
      a("clientes", "Clientes", "03 - Clientes"),
      a("leads", "Leads", "04 - Leads"),
      a("oportunidades", "Oportunidades", "05 - Oportunidades"),
      a("tarefas", "Tarefas", "06 - Tarefas"),
    ],
  },
  {
    title: "Patrimônio",
    articles: [
      a("patrimonio", "Visão geral", "07 - Patrimônio - Visão Geral"),
      a("investimentos", "Investimentos", "08 - Patrimônio - Investimentos"),
      a("contas", "Contas", "09 - Patrimônio - Contas"),
      a("passivos", "Passivos", "10 - Patrimônio - Passivos"),
      a("metas", "Metas", "11 - Patrimônio - Metas"),
    ],
  },
  {
    title: "Consórcios",
    articles: [
      a("contratos", "Contratos", "12 - Consórcios - Contratos"),
      a("parcelas", "Parcelas", "13 - Consórcios - Parcelas"),
      a("lances", "Lances", "14 - Consórcios - Lances"),
      a("motor-de-apuracao", "Motor de apuração e roleta", "15 - Consórcios - Motor de Apuração"),
    ],
  },
  { title: "Pagamentos", articles: [a("pagamentos", "Pagamentos", "16 - Pagamentos")] },
  {
    title: "Documentos",
    articles: [
      a("cofre-digital", "Cofre digital", "17 - Documentos - Cofre Digital"),
      a("central-de-documentos", "Central de Documentos", "18 - Documentos - Central de Documentos"),
    ],
  },
  { title: "Relatórios", articles: [a("central-de-relatorios", "Central de Relatórios", "19 - Relatórios - Central de Relatórios")] },
  { title: "Integrações", articles: [a("integracoes", "Integrações", "20 - Integrações")] },
  { title: "Inteligência", articles: [a("inteligencia", "Central de Inteligência", "21 - Inteligência")] },
  { title: "Administração", articles: [a("administracao", "Administração", "22 - Administração")] },
];

export const LEGAL_DOCS = {
  privacidade: { title: "Política de Privacidade", folder: LEGAL_FOLDER, file: "Política de Privacidade - Primo Invest.md" },
  termos: { title: "Termos de Uso", folder: LEGAL_FOLDER, file: "Termos de Uso - Primo Invest.md" },
} as const;

export const ALL_ARTICLES = HELP_GROUPS.flatMap((g) => g.articles.map((article) => ({ ...article, group: g.title })));

export function findArticle(slug: string) {
  return ALL_ARTICLES.find((x) => x.slug === slug) ?? null;
}

function readDoc(folder: string, file: string): string {
  return fs.readFileSync(path.join(ROOT, folder, file), "utf8");
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type RenderedDoc = {
  html: string;
  headings: { id: string; text: string }[];
  summary: string;
  searchText: string;
};

/**
 * Markdown → HTML. O conteúdo é nosso (docs/ versionado), por isso é
 * seguro injetar. Acrescenta âncoras nos títulos (índice da página),
 * envolve tabelas para rolagem no celular e destaca campos a preencher.
 */
export function renderDoc(markdown: string): RenderedDoc {
  // O título (#) é mostrado pelo cabeçalho da página.
  const body = markdown.replace(/^# .*\r?\n/, "");
  const used = new Map<string, number>();
  const headings: { id: string; text: string }[] = [];

  let html = marked.parse(body, { async: false, gfm: true }) as string;
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, level: string, inner: string) => {
    const plain = inner.replace(/<[^>]+>/g, "").trim();
    let id = slugify(plain) || "secao";
    const n = used.get(id) ?? 0;
    used.set(id, n + 1);
    if (n) id = `${id}-${n + 1}`;
    if (level === "2") headings.push({ id, text: plain.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'") });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
  html = html.replace(/\[A PREENCHER([^\]]*)\]/g, '<mark class="pending">A preencher$1</mark>');

  const firstSection = body.split(/\n## /)[1] ?? body;
  const paragraph = firstSection
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith("#") && !p.startsWith("|") && !p.startsWith("-") && !p.startsWith("**Software") && !/^\d+\./.test(p));
  const summary = (paragraph ?? "").replace(/^[^\n]*\n/, (line) => (line.startsWith("1.") ? "" : line)).replace(/\*\*|\*|`/g, "").replace(/\s+/g, " ").trim();

  const searchText = body.replace(/[#*|`>-]/g, " ").replace(/\s+/g, " ").toLowerCase();
  return { html, headings, summary, searchText };
}

export function loadArticle(slug: string) {
  const article = findArticle(slug);
  if (!article) return null;
  return { article, doc: renderDoc(readDoc(article.folder, article.file)) };
}

export function loadLegal(kind: keyof typeof LEGAL_DOCS) {
  const meta = LEGAL_DOCS[kind];
  return { meta, doc: renderDoc(readDoc(meta.folder, meta.file)) };
}

/** Índice para a busca da página inicial da ajuda. */
export function loadSearchIndex() {
  return ALL_ARTICLES.map((article) => {
    const doc = renderDoc(readDoc(article.folder, article.file));
    return {
      slug: article.slug,
      title: article.title,
      group: article.group,
      summary: doc.summary,
      headings: doc.headings.map((h) => h.text),
      text: doc.searchText,
    };
  });
}
