# Primo Invest — Design System (pacote portátil)

Copiado direto do código-fonte real do projeto Primo Invest. Pronto pra
colar em outro projeto Next.js + Tailwind v4.

## O que tem aqui

```
design-system-export/
├── globals.css                     ← cole em app/globals.css do outro projeto
├── components/
│   ├── ui/animated-number.tsx      ← contador GSAP reutilizável
│   └── motion/scroll-reveal.tsx    ← scroll-reveal reutilizável (Framer Motion)
└── README.md                       ← este arquivo
```

## Dependências necessárias

O outro projeto precisa ser **Next.js 15+ com App Router** e **Tailwind CSS v4**
(o v4 é obrigatório — a sintaxe `@theme inline` e `@layer` usada no
`globals.css` não funciona no v3).

```bash
npm install tailwindcss @tailwindcss/postcss gsap motion recharts lucide-react cn class-variance-authority
```

- `tailwindcss` + `@tailwindcss/postcss` — motor do design system (v4, `^4`)
- `gsap` — usado pelo `animated-number.tsx` (contador em contagem crescente)
- `motion` — **é a Framer Motion renomeada** (mesma equipe, mesma API, pacote
  novo desde 2024). Usado pelo `scroll-reveal.tsx`. Não instale
  `framer-motion` separado, é o mesmo pacote com nome antigo.
- `recharts` — só se for reaproveitar os gráficos (pizza/barra/linha)
- `lucide-react` — ícones
- `cn` + `class-variance-authority` — utilitário de merge de classes usado
  em vários componentes shadcn

Opcional, só se for reaproveitar os componentes shadcn (Button, Badge, Card,
Dialog, Select, Tabs, Table, etc.):
```bash
npx shadcn@latest init
```
Style usado no projeto original: `base-nova` (roda sobre `@base-ui/react`,
não sobre Radix — é uma variante mais nova do shadcn).

## Como instalar

1. **Copie `globals.css`** por cima do `app/globals.css` do projeto novo
   (ou mescle manualmente se já tiver conteúdo lá).
2. **Fontes**: o sistema espera duas variáveis CSS de fonte já carregadas
   pelo layout raiz via `next/font`:
   ```ts
   // app/layout.tsx
   import { Inter, Manrope } from "next/font/google";

   const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
   const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

   // no <html>:
   <html className={`${inter.variable} ${manrope.variable}`}>
   ```
3. **Copie os componentes** de `components/` pras pastas equivalentes do
   projeto novo, ajustando os imports (`@/components/ui/animated-number`
   etc., conforme o alias configurado no `tsconfig.json`/`components.json`
   do projeto novo).
4. Rode `npm run dev` e confira se as cores/tipografia aparecem — se a
   fonte não carregar, o sistema cai pro fallback `sans-serif` (ainda
   funciona, só não fica idêntico).

## Estrutura de cores (resumo)

| Token | Valor | Uso |
|---|---|---|
| `--secondary` | `#101b3d` | Azul-marinho — blocos estruturais (headers, sidebar) |
| `--accent` | `#122b54` | Azul-marinho mais claro — eyebrows, ênfase |
| `--primary` | `#2ecc9b` | Verde-menta — CTAs, destaque, sucesso |
| `--card-beige` | `#f6f7c4` | Bege — cards de conteúdo em evidência |
| `--background` | `#f7f8fa` | Fundo geral de página |
| `--destructive` | `#ff5a6b` | Erros, ações destrutivas |

Pra trocar a marca (outra paleta), só editar os valores hex em `:root` e
`.light` no `globals.css` — toda a estrutura (classes `card-premium`,
`block-navy-3d`, escala tipográfica, sombras) continua funcionando igual,
porque tudo referencia as variáveis, nunca hex direto nos componentes.

## As duas classes centrais

```css
.card-premium     /* bege + borda verde + brilho no hover — cards de conteúdo */
.block-navy-3d    /* azul-marinho + brilho branco no hover — headers de módulo */
```

Aplique como classe simples: `className="card-premium rounded-2xl p-5"`.
O efeito de brilho/elevação no hover já vem embutido — não precisa
adicionar mais nada.

## Componentes

### `<AnimatedNumber value="R$ 48.750.320" />`
Anima o número em contagem crescente (0 até o valor real) ao montar.
Aceita qualquer string formatada (moeda, %, inteiro) — detecta prefixo/
sufixo não-numérico automaticamente.

### `<ScrollReveal delay={0.1}>...</ScrollReveal>`
Fade + slide-up ao entrar na área visível da tela (dispara uma vez).
Aceita `className` pra repassar pro elemento raiz.

## Relatório completo

Ver `../docs/design-system-report/index.html` no projeto original pra
documentação visual completa (paleta, tipografia, exemplos ao vivo,
arquitetura de código).
